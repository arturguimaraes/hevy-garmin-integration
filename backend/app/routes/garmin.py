"""Garmin Connect browser-login and push routes.

Auth flow:
  POST /api/garmin/browser-login  ->  opens Chromium, user logs in, returns { token }
  POST /api/garmin/push           ->  { results: [...] }

The token is a serialised garth session blob. The frontend holds it in localStorage
and sends it back on /push. The backend never stores it — /push is stateless.
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


def _run_browser_login() -> str:
    """Open a real browser for login; capture the OAuth token via response interception."""
    from playwright.sync_api import sync_playwright

    captured: dict = {}

    with sync_playwright() as p:
        launch_kwargs: dict = {
            "headless": False,
            # Disable the flag that tells sites this is an automated browser
            "args": ["--disable-blink-features=AutomationControlled"],
        }
        # Prefer the user's real system Chrome — its fingerprint passes Cloudflare naturally.
        # Fall back to Playwright's Chromium if Chrome is not installed.
        try:
            browser = p.chromium.launch(channel="chrome", **launch_kwargs)
            log.info("Using system Chrome")
        except Exception:
            browser = p.chromium.launch(**launch_kwargs)
            log.info("System Chrome not found — using Playwright Chromium")

        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
        )
        # Remove the navigator.webdriver property that Cloudflare uses to detect automation
        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )
        page = context.new_page()

        def on_response(response):
            if captured or response.status != 200:
                return
            try:
                data = response.json()
                if isinstance(data, dict) and "access_token" in data:
                    captured.update(data)
                    log.info("OAuth token captured from response: %s", response.url)
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
                break  # browser was closed by the user
            page.wait_for_timeout(500)

        if not login_detected:
            try:
                browser.close()
            except Exception:
                pass
            raise TimeoutError("Browser closed or login timed out")

        # Let any pending token responses arrive
        page.wait_for_timeout(2000)

        # Fallback: check browser localStorage / sessionStorage for a token
        if not captured:
            log.info("No token in network responses — checking browser storage")
            stored = page.evaluate("""
                () => {
                    const stores = [localStorage, sessionStorage];
                    for (const store of stores) {
                        for (let i = 0; i < store.length; i++) {
                            try {
                                const val = JSON.parse(store.getItem(store.key(i)));
                                if (val && val.access_token) return val;
                            } catch {}
                        }
                    }
                    return null;
                }
            """)
            if isinstance(stored, dict) and "access_token" in stored:
                captured.update(stored)
                log.info("OAuth token found in browser storage")

        browser.close()

    if not captured:
        raise ValueError(
            "Logged in successfully but could not capture an OAuth token from "
            "network responses or browser storage. Try again."
        )

    now = time.time()
    session_blob = json.dumps({
        "oauth2_token": {
            "access_token": captured["access_token"],
            "refresh_token": captured.get("refresh_token", ""),
            "token_type": captured.get("token_type", "Bearer"),
            "expires_in": captured.get("expires_in", 3600),
            "expires_at": now + captured.get("expires_in", 3600),
            "scope": captured.get("scope", ""),
            "jti": captured.get("jti", ""),
        },
        "domain": "garmin.com",
    })
    return session_blob


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
        client = Garmin("", "")
        client.client.loads(body.garminToken)
    except Exception as exc:
        log.warning("Garmin token load failed: %s", type(exc).__name__)
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
