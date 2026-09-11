"""Compile the app's structured-workout JSON into Intervals.icu Workout Builder text.

Intervals.icu's public API does not accept a raw ``steps`` / ``workout_doc`` JSON on
create — posting that internal format silently creates an event with no structured
steps. The only supported way to get parsed steps is to POST a ``description`` string
written in Intervals.icu's own plain-text Workout Builder syntax, which their server
parses. These are pure functions with no I/O; both routes share ``parse_batch``.
"""
from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from app.models import IntervalsItemResult, IntervalsStep, IntervalsWorkout


class BatchStructureError(ValueError):
    """The pasted payload is not a non-empty JSON array of workouts."""


def _distance_token(distance: str) -> str:
    """Translate an authored distance into Workout Builder units.

    ``km`` / ``mi`` / ``mtr`` pass through unchanged; a bare ``m`` means metres and
    must become ``mtr`` (in this syntax ``m`` on its own means minutes).
    """
    d = distance.strip()
    lower = d.lower()
    if lower.endswith(("km", "mi", "mtr")):
        return d
    if lower.endswith("m"):
        return f"{d[:-1]}mtr"
    return d


def _step_line(step: IntervalsStep) -> str:
    parts = ["-"]
    if step.ramp:
        parts.append("ramp")
    if step.cue:
        parts.append(step.cue)
    parts.append(step.duration if step.duration else _distance_token(step.distance or ""))
    parts.append(step.target)
    return " ".join(parts)


def compile_workout(workout: IntervalsWorkout) -> str:
    """Render a workout as Intervals.icu Workout Builder text."""
    blocks: list[str] = []
    for section in workout.sections:
        header = section.label
        if section.repeat is not None:
            header += f" {section.repeat}x"
        blocks.append("\n".join([header, *(_step_line(s) for s in section.steps)]))

    body = "\n\n".join(blocks)
    if workout.notes:
        return f"{workout.notes}\n\n{body}"
    return body


def _friendly_errors(exc: ValidationError) -> list[str]:
    out: list[str] = []
    for err in exc.errors():
        msg = err["msg"]
        msg = msg.removeprefix("Value error, ")
        loc = " → ".join(str(p) for p in err["loc"])
        out.append(f"{loc}: {msg}" if loc else msg)
    return out


def parse_batch(
    raw: Any,
) -> tuple[list[tuple[int, IntervalsWorkout]], list[IntervalsItemResult]]:
    """Validate every entry in a pasted batch.

    Returns ``(valid, results)`` where ``valid`` pairs each passing workout with its
    input index and ``results`` has one :class:`IntervalsItemResult` per input entry
    (in order) — compiled ``description`` for entries that passed, populated
    ``errors`` for entries that failed. Raises :class:`BatchStructureError` if the
    top-level payload is not a non-empty list.
    """
    if not isinstance(raw, list):
        raise BatchStructureError(
            "Expected a JSON array of workouts — wrap a single workout in [ ] too."
        )
    if not raw:
        raise BatchStructureError("The JSON array is empty — add at least one workout.")

    valid: list[tuple[int, IntervalsWorkout]] = []
    results: list[IntervalsItemResult] = []
    for i, item in enumerate(raw):
        name = item.get("name") if isinstance(item, dict) else None
        try:
            model = IntervalsWorkout.model_validate(item)
        except ValidationError as exc:
            results.append(
                IntervalsItemResult(index=i, name=name, errors=_friendly_errors(exc))
            )
            continue
        valid.append((i, model))
        results.append(
            IntervalsItemResult(
                index=i, name=model.name, description=compile_workout(model)
            )
        )
    return valid, results
