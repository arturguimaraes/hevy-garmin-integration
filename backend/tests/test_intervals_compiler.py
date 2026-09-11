"""Tests for the Intervals.icu Workout Builder compiler and batch parser."""
from __future__ import annotations

import pytest

from app.intervals_compiler import BatchStructureError, compile_workout, parse_batch
from app.models import IntervalsWorkout

VECTOR_1 = {
    "name": "M15W12 Run #1 - Easy",
    "sport": "Run",
    "start_date_local": "2026-09-16T07:00:00",
    "target_type": "pace",
    "notes": "Easy effort — hamstring rehab, stop if posterior thigh tightness",
    "sections": [
        {"label": "Warmup", "steps": [
            {"duration": "10m", "target": "6:30-6:00/km Pace"},
        ]},
        {"label": "Main Set", "repeat": 4, "steps": [
            {"duration": "3m", "target": "4:45/km Pace", "cue": "Tempo"},
            {"duration": "90s", "target": "6:30/km Pace", "cue": "Recovery jog"},
        ]},
        {"label": "Cooldown", "steps": [
            {"duration": "10m", "target": "6:30-6:00/km Pace"},
        ]},
    ],
}

EXPECTED_1 = """Easy effort — hamstring rehab, stop if posterior thigh tightness

Warmup
- 10m 6:30-6:00/km Pace

Main Set 4x
- Tempo 3m 4:45/km Pace
- Recovery jog 90s 6:30/km Pace

Cooldown
- 10m 6:30-6:00/km Pace"""

VECTOR_2 = {
    "name": "Hyrox Conditioning Intervals",
    "sport": "Run",
    "start_date_local": "2026-09-20T07:00:00",
    "target_type": "hr",
    "sections": [
        {"label": "Warmup", "steps": [
            {"duration": "10m", "target": "Z1-Z2 HR", "ramp": True},
        ]},
        {"label": "Main Set", "repeat": 6, "steps": [
            {"distance": "400m", "target": "Z4 HR", "cue": "Hard"},
            {"duration": "90s", "target": "Z1 HR", "cue": "Jog recovery"},
        ]},
    ],
}

EXPECTED_2 = """Warmup
- ramp 10m Z1-Z2 HR

Main Set 6x
- Hard 400mtr Z4 HR
- Jog recovery 90s Z1 HR"""


def test_vector_1_compiles_exactly():
    assert compile_workout(IntervalsWorkout.model_validate(VECTOR_1)) == EXPECTED_1


def test_vector_2_compiles_exactly():
    assert compile_workout(IntervalsWorkout.model_validate(VECTOR_2)) == EXPECTED_2


@pytest.mark.parametrize(
    "distance, token",
    [("400m", "400mtr"), ("800m", "800mtr"), ("2km", "2km"), ("1mi", "1mi"), ("600mtr", "600mtr")],
)
def test_distance_metres_translated_to_mtr(distance, token):
    workout = IntervalsWorkout.model_validate({
        "name": "d",
        "start_date_local": "2026-09-20T07:00:00",
        "target_type": "hr",
        "sections": [{"label": "S", "steps": [{"distance": distance, "target": "Z2 HR"}]}],
    })
    assert compile_workout(workout).endswith(f"- {token} Z2 HR")


def test_target_type_mismatch_is_rejected_per_step():
    raw = [{
        "name": "mismatch",
        "start_date_local": "2026-09-20T07:00:00",
        "target_type": "hr",
        "sections": [{"label": "Main Set", "steps": [
            {"duration": "3m", "target": "Z4 HR"},
            {"duration": "3m", "target": "4:45/km Pace"},
        ]}],
    }]
    valid, results = parse_batch(raw)
    assert valid == []
    assert len(results) == 1
    joined = " ".join(results[0].errors)
    assert "step 2" in joined
    assert "Main Set" in joined
    assert "4:45/km Pace" in joined
    assert results[0].description is None


def test_step_needs_exactly_one_of_duration_distance():
    _, results = parse_batch([{
        "name": "bad step",
        "start_date_local": "2026-09-20T07:00:00",
        "target_type": "pace",
        "sections": [{"label": "S", "steps": [{"target": "4:45/km Pace"}]}],
    }])
    assert "exactly one of 'duration' or 'distance'" in " ".join(results[0].errors)


def test_valid_and_invalid_items_are_reported_independently():
    valid, results = parse_batch([VECTOR_1, {"name": "broken"}])
    assert [i for i, _ in valid] == [0]
    assert results[0].description == EXPECTED_1
    assert results[0].errors == []
    assert results[1].description is None
    assert results[1].errors


def test_non_list_payload_raises():
    with pytest.raises(BatchStructureError):
        parse_batch({"workouts": [VECTOR_1]})


def test_empty_list_raises():
    with pytest.raises(BatchStructureError):
        parse_batch([])
