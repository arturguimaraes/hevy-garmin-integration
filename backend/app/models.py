"""Pydantic request / response models for the API."""
from __future__ import annotations

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

class BrowserLoginResponse(BaseModel):
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
    date: str | None = None
    exercises: list[WorkoutExercise]


class PushRequest(BaseModel):
    garminToken: str
    workouts: list[WorkoutPayload]


class PushResult(BaseModel):
    title: str
    workoutId: str | None = None
    scheduledDate: str | None = None
    error: str | None = None


class PushResponse(BaseModel):
    results: list[PushResult]
