"""Pydantic request / response models for the API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, model_validator


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


class ValidateTokenRequest(BaseModel):
    garminToken: str


class ValidateTokenResponse(BaseModel):
    valid: bool


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


# ── Intervals.icu ─────────────────────────────────────────────────────────────

class IntervalsStep(BaseModel):
    cue: str | None = None
    duration: str | None = None
    distance: str | None = None
    target: str
    ramp: bool = False

    @model_validator(mode="after")
    def _one_of_duration_distance(self) -> "IntervalsStep":
        if bool(self.duration) == bool(self.distance):
            raise ValueError("each step needs exactly one of 'duration' or 'distance'")
        return self


class IntervalsSection(BaseModel):
    label: str
    repeat: int | None = None
    steps: list[IntervalsStep]


class IntervalsWorkout(BaseModel):
    name: str
    sport: str = "Run"
    start_date_local: str
    target_type: Literal["pace", "hr"]
    notes: str | None = None
    sections: list[IntervalsSection]

    @model_validator(mode="after")
    def _targets_match_target_type(self) -> "IntervalsWorkout":
        if self.target_type == "pace":
            ok, expected = (lambda t: t.strip().endswith("Pace")), "end with 'Pace'"
        else:
            ok, expected = (lambda t: t.strip().endswith("HR")), "end with 'HR' or 'LTHR'"
        for section in self.sections:
            for n, step in enumerate(section.steps, 1):
                if not ok(step.target):
                    raise ValueError(
                        f'step {n} in "{section.label}" targets "{step.target}", '
                        f'but target_type is "{self.target_type}" — its target must '
                        f"{expected}"
                    )
        return self


class IntervalsItemResult(BaseModel):
    index: int
    name: str | None = None
    description: str | None = None   # compiled text, preview only
    eventId: str | None = None       # push only
    errors: list[str] = []


class IntervalsPreviewResponse(BaseModel):
    items: list[IntervalsItemResult]


class IntervalsPushRequest(BaseModel):
    athleteId: str
    apiKey: str
    workouts: list[dict]   # raw — re-validated server-side, same as preview


class IntervalsPushResponse(BaseModel):
    results: list[IntervalsItemResult]
