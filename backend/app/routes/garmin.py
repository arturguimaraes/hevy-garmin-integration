"""Garmin Connect browser-login and push routes.

Auth flow:
  POST /api/garmin/browser-login  ->  opens Chromium, user logs in, returns { token }
  POST /api/garmin/validate-token ->  { valid: bool }
  POST /api/garmin/push           ->  { results: [...] }

Token format stored in the frontend:
  {"di_token": "...", "di_refresh_token": "...", "di_client_id": null}
  -- or, if the web flow doesn't hit diauth.garmin.com --
  {"jwt_web": "..."}

The backend never stores the token — /push and /validate-token are stateless.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException, status
from garminconnect import Garmin
from garminconnect.workout import StrengthWorkout, WorkoutSegment, create_strength_set

from app.models import (
    BrowserLoginResponse,
    PushRequest,
    PushResponse,
    PushResult,
    ValidateTokenRequest,
    ValidateTokenResponse,
)

router = APIRouter()
log = logging.getLogger(__name__)

_STRENGTH = {"sportTypeId": 5, "sportTypeKey": "strength_training"}
_executor = ThreadPoolExecutor(max_workers=1)

_BROWSER_LOGIN_TIMEOUT = 300  # seconds the user has to complete login


def _is_garmin_dashboard(url: str) -> bool:
    lower = url.lower()
    return (
        "connect.garmin.com" in url
        and "sso.garmin.com" not in url
        and "signin" not in lower
        and "sign-in" not in lower
        and "/sso" not in lower
        and "/login" not in lower
    )


def _restore_session(garmin_token: str) -> Garmin:
    """Restore an authenticated Garmin client from a stored token blob.

    Supports two formats:
    - {"di_token": ..., "di_refresh_token": ..., "di_client_id": ...}
      (garminconnect Client native format — preferred)
    - {"jwt_web": ...}
      (fallback when the browser flow doesn't surface the DI token)
    """
    data = json.loads(garmin_token)
    client = Garmin("", "")
    if "di_token" in data:
        client.client.loads(garmin_token)
    elif "jwt_web" in data:
        client.client.jwt_web = data["jwt_web"]
    else:
        raise ValueError(f"Unrecognised token format: {list(data.keys())}")
    if not client.client.is_authenticated:
        raise ValueError("Client not authenticated after token restore")
    return client


def _run_browser_login() -> str:
    """Open a real browser for login; capture the session token."""
    from playwright.sync_api import sync_playwright

    # DI token from diauth.garmin.com — preferred format for the garminconnect client.
    di_captured: dict = {}

    with sync_playwright() as p:
        launch_kwargs: dict = {
            "headless": False,
            "args": ["--disable-blink-features=AutomationControlled"],
        }
        try:
            browser = p.chromium.launch(channel="chrome", **launch_kwargs)
            log.info("Using system Chrome")
        except Exception:
            browser = p.chromium.launch(**launch_kwargs)
            log.info("System Chrome not found — using Playwright Chromium")

        context = browser.new_context(viewport={"width": 1280, "height": 800})
        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )
        page = context.new_page()

        def on_response(response):
            # Only intercept responses from Garmin's DI auth service.
            # The Garmin Connect web app also calls HERE Maps and other services
            # that return OAuth-style access_token fields — we must ignore those.
            if di_captured or response.status != 200:
                return
            if "diauth.garmin.com" not in response.url:
                return
            try:
                data = response.json()
                if isinstance(data, dict) and "access_token" in data:
                    di_captured.update(data)
                    log.info("DI token captured from: %s", response.url)
            except Exception:
                pass

        page.on("response", on_response)
        page.goto("https://connect.garmin.com/signin")
        log.info("Garmin browser window open — waiting for user to log in")

        deadline = time.monotonic() + _BROWSER_LOGIN_TIMEOUT
        login_detected = False
        while time.monotonic() < deadline:
            try:
                if _is_garmin_dashboard(page.url):
                    login_detected = True
                    break
            except Exception:
                break
            page.wait_for_timeout(500)

        if not login_detected:
            try:
                browser.close()
            except Exception:
                pass
            raise TimeoutError("Browser closed or login timed out")

        # Let any in-flight token responses land.
        page.wait_for_timeout(2000)

        if di_captured:
            session_blob = json.dumps({
                "di_token": di_captured["access_token"],
                "di_refresh_token": di_captured.get("refresh_token") or None,
                "di_client_id": None,
            })
            log.info("Session stored as DI token")
        else:
            # The web login flow uses JWT_WEB cookie auth rather than DI tokens.
            log.info("No DI token in network responses — falling back to JWT_WEB cookie")
            cookies = context.cookies()
            jwt_web = next(
                (c["value"] for c in cookies if c["name"] == "JWT_WEB"),
                None,
            )
            if not jwt_web:
                browser.close()
                raise ValueError(
                    "Logged in successfully but could not capture a DI token or "
                    "JWT_WEB cookie. Try again."
                )
            session_blob = json.dumps({"jwt_web": jwt_web})
            log.info("Session stored as JWT_WEB cookie")

        browser.close()

    return session_blob


@router.post("/validate-token", response_model=ValidateTokenResponse)
def validate_token(body: ValidateTokenRequest) -> ValidateTokenResponse:
    try:
        client = _restore_session(body.garminToken)
        client.get_user_profile()
        return ValidateTokenResponse(valid=True)
    except Exception:
        return ValidateTokenResponse(valid=False)


@router.post("/browser-login", response_model=BrowserLoginResponse)
async def browser_login() -> BrowserLoginResponse:
    loop = asyncio.get_event_loop()
    try:
        token = await loop.run_in_executor(_executor, _run_browser_login)
    except TimeoutError as exc:
        raise HTTPException(
            status.HTTP_408_REQUEST_TIMEOUT,
            detail="Login cancelled or timed out — try again",
        ) from exc
    except Exception as exc:
        log.warning("Browser login failed: %s", exc)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail=str(exc) or "Garmin browser login failed",
        ) from exc
    return BrowserLoginResponse(token=token)


@router.post("/push", response_model=PushResponse)
def push(body: PushRequest) -> PushResponse:
    try:
        client = _restore_session(body.garminToken)
    except Exception as exc:
        log.warning("Garmin session restore failed: %s", exc)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Garmin session is no longer valid"
        ) from exc

    results: list[PushResult] = []
    for workout in body.workouts:
        try:
            steps, order = [], 1
            for ex in workout.exercises:
                steps.append(
                    create_strength_set(
                        ex.garminCategory,
                        step_order=order,
                        sets=ex.sets,
                        reps=ex.reps,
                        rest_seconds=ex.restSeconds,
                        exercise_name=ex.garminExercise,
                        weight_kg=ex.weightKg,
                    )
                )
                order += 3

            sw = StrengthWorkout(
                workoutName=workout.title[:80],
                estimatedDurationInSecs=0,
                workoutSegments=[
                    WorkoutSegment(
                        segmentOrder=1,
                        sportType=_STRENGTH,
                        workoutSteps=steps,
                    )
                ],
            )
            res = client.upload_strength_workout(sw)
            wid = str(res["workoutId"])
            scheduled_date: str | None = None
            if workout.date:
                client.schedule_workout(wid, workout.date)
                scheduled_date = workout.date
            results.append(PushResult(title=workout.title, workoutId=wid, scheduledDate=scheduled_date))
        except Exception as exc:
            log.warning("Failed to push %r: %s", workout.title, exc)
            results.append(PushResult(title=workout.title, error=str(exc)))

    return PushResponse(results=results)
