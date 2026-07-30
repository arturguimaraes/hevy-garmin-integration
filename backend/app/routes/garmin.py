"""Garmin Connect auth and push routes.

Auth flow:
  POST /api/garmin/login  ->  { status: "ok", token } or { status: "mfa_required", sessionId }
  POST /api/garmin/mfa    ->  { status: "ok", token }          (MFA accounts only)
  POST /api/garmin/push   ->  { results: [...] }

The token returned by login/mfa is a serialised garminconnect session blob. The
frontend holds it in memory and sends it back on /push. The backend never
stores it — /push is completely stateless.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from garminconnect import Garmin
from garminconnect.exceptions import GarminConnectTooManyRequestsError
from garminconnect.workout import StrengthWorkout, WorkoutSegment, create_strength_set

from app import session as sess
from app.models import (
    GarminLoginRequest,
    GarminLoginResponse,
    GarminMfaRequest,
    GarminMfaResponse,
    PushRequest,
    PushResponse,
    PushResult,
)

router = APIRouter()
log = logging.getLogger(__name__)

_STRENGTH = {"sportTypeId": 5, "sportTypeKey": "strength_training"}


@router.post("/login", response_model=GarminLoginResponse)
def login(body: GarminLoginRequest) -> GarminLoginResponse:
    try:
        client = Garmin(body.email, body.password, return_on_mfa=True)
        client.skip_strategies = {"mobile+cffi", "mobile+requests"}
        result = client.login()
    except GarminConnectTooManyRequestsError as exc:
        log.warning("Garmin login rate-limited: %s", exc)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Garmin is rate-limiting this IP — wait a few minutes and try again",
        ) from exc
    except Exception as exc:
        log.warning("Garmin login failed: %s", type(exc).__name__)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Garmin login failed — check credentials"
        ) from exc

    if isinstance(result, tuple):
        # MFA required: library returns (status_string, client_state)
        _mfa_status, client_state = result
        sid = sess.create({"client_state": client_state, "email": body.email})
        return GarminLoginResponse(status="mfa_required", sessionId=sid)

    token = client.client.dumps()
    return GarminLoginResponse(status="ok", token=token)


@router.post("/mfa", response_model=GarminMfaResponse)
def mfa(body: GarminMfaRequest) -> GarminMfaResponse:
    stored = sess.get(body.sessionId)
    if stored is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="MFA session expired or not found — please log in again",
        )
    sess.delete(body.sessionId)

    try:
        client = Garmin(stored["email"], "")
        client.resume_login(stored["client_state"], body.code)
    except Exception as exc:
        log.warning("Garmin MFA failed: %s", type(exc).__name__)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code"
        ) from exc

    return GarminMfaResponse(status="ok", token=client.client.dumps())


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
                order += 3  # repeat-group + inner exercise step + inner rest step

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
            results.append(PushResult(title=workout.title, workoutId=str(res["workoutId"])))
        except Exception as exc:
            log.warning("Failed to push %r: %s", workout.title, exc)
            results.append(PushResult(title=workout.title, error=str(exc)))

    return PushResponse(results=results)
