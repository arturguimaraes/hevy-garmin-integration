"""Pydantic request / response models for the API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


# ── Hevy ──────────────────────────────────────────────────────────────────────

class HevyValidateRequest(BaseModel):
    apiKey: str


class HevyValidateResponse(BaseModel):
    ok: bool
    username: str | None = None


# ── Mapping ───────────────────────────────────────────────────────────────────

class CatalogEntry(BaseModel):
    name: str
    category: str
    exercise: str


class MatchCandidate(BaseModel):
    name: str
    category: str
    exercise: str
    score: float


class Match(BaseModel):
    hevyName: str
    top: list[MatchCandidate]


class ResolveRequest(BaseModel):
    exerciseNames: list[str]


class ResolveResponse(BaseModel):
    matches: list[Match]


# ── Garmin auth ───────────────────────────────────────────────────────────────

class GarminLoginRequest(BaseModel):
    email: str
    password: str


class GarminLoginResponse(BaseModel):
    status: Literal["ok", "mfa_required"]
    sessionId: str | None = None
    token: str | None = None  # present when status == "ok"


class GarminMfaRequest(BaseModel):
    sessionId: str
    code: str


class GarminMfaResponse(BaseModel):
    status: Literal["ok"]
    token: str


# ── Push ──────────────────────────────────────────────────────────────────────

class WorkoutExercise(BaseModel):
    hevyName: str
    garminCategory: str
    garminExercise: str
    sets: int
    reps: int
    weightKg: float | None = None
    restSeconds: float
    timed: bool = False


class WorkoutPayload(BaseModel):
    title: str
    exercises: list[WorkoutExercise]


class PushRequest(BaseModel):
    garminToken: str
    workouts: list[WorkoutPayload]


class PushResult(BaseModel):
    title: str
    workoutId: str | None = None
    error: str | None = None


class PushResponse(BaseModel):
    results: list[PushResult]
