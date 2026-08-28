"""Tests for the Hevy → CSV export routes."""
from __future__ import annotations

import csv
import io

import pytest
from fastapi.testclient import TestClient

from app import main
from app.routes import export
from app.routes.export import ROUTINE_HEADERS, WORKOUT_HEADERS

client = TestClient(main.app)


class _FakeResponse:
    def __init__(self, payload: dict, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code
        self.is_success = 200 <= status_code < 300

    def json(self) -> dict:
        return self._payload


class _FakeClient:
    """Stands in for httpx.AsyncClient; serves canned pages keyed by `page`."""

    pages: dict[int, dict] = {}
    status_code: int = 200

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def get(self, url, headers=None, params=None):
        if _FakeClient.status_code != 200:
            return _FakeResponse({}, _FakeClient.status_code)
        return _FakeResponse(_FakeClient.pages[params["page"]])


@pytest.fixture(autouse=True)
def _patch_httpx(monkeypatch):
    _FakeClient.pages = {}
    _FakeClient.status_code = 200
    monkeypatch.setattr(export.httpx, "AsyncClient", _FakeClient)


def _rows(body: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(body)))


def test_workouts_csv_headers_and_rows():
    _FakeClient.pages = {
        1: {
            "page": 1,
            "page_count": 1,
            "workouts": [
                {
                    "id": "w1",
                    "title": "Push Day",
                    "start_time": "2026-08-20T08:00:00Z",
                    "end_time": "2026-08-20T09:00:00Z",
                    "exercises": [
                        {
                            "index": 0,
                            "title": "Bench Press",
                            "notes": None,
                            "sets": [
                                {"index": 0, "type": "warmup", "weight_kg": 40, "reps": 10},
                                {"index": 1, "type": "normal", "weight_kg": 100, "reps": 5, "rpe": 8},
                            ],
                        },
                        {
                            "index": 1,
                            "title": "Plank",
                            "sets": [
                                {"index": 0, "type": "normal", "duration_seconds": 60},
                            ],
                        },
                    ],
                }
            ],
        }
    }

    res = client.get("/api/export/workouts.csv", headers={"X-Hevy-Key": "k"})

    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "hevy-workout-history-" in res.headers["content-disposition"]
    assert res.headers["x-row-count"] == "3"

    lines = res.text.splitlines()
    assert lines[0] == ",".join(WORKOUT_HEADERS)

    rows = _rows(res.text)
    warmup = next(r for r in rows if r["set_type"] == "warmup")
    assert warmup["volume_kg"] == "400"  # 40 * 10
    assert warmup["exercise_notes"] == ""  # None -> empty

    work = next(r for r in rows if r["set_type"] == "normal" and r["exercise_title"] == "Bench Press")
    assert work["volume_kg"] == "500"
    assert work["rpe"] == "8"
    assert work["workout_date"] == "2026-08-20"

    plank = next(r for r in rows if r["exercise_title"] == "Plank")
    assert plank["duration_seconds"] == "60"
    assert plank["volume_kg"] == ""


def test_workouts_csv_since_filter():
    _FakeClient.pages = {
        1: {
            "page": 1,
            "page_count": 2,
            "workouts": [
                {
                    "id": "recent",
                    "start_time": "2026-08-01T08:00:00Z",
                    "exercises": [{"index": 0, "title": "Squat", "sets": [{"index": 0, "type": "normal", "weight_kg": 120, "reps": 5}]}],
                }
            ],
        },
        2: {
            "page": 2,
            "page_count": 2,
            "workouts": [
                {
                    "id": "old",
                    "start_time": "2025-01-01T08:00:00Z",
                    "exercises": [{"index": 0, "title": "Squat", "sets": [{"index": 0, "type": "normal", "weight_kg": 100, "reps": 5}]}],
                }
            ],
        },
    }

    res = client.get(
        "/api/export/workouts.csv",
        headers={"X-Hevy-Key": "k"},
        params={"since": "2026-06-01T00:00:00Z"},
    )

    assert res.status_code == 200
    rows = _rows(res.text)
    assert len(rows) == 1
    assert rows[0]["workout_id"] == "recent"


def test_routines_csv_headers():
    _FakeClient.pages = {
        1: {
            "page": 1,
            "page_count": 1,
            "routines": [
                {
                    "id": "r1",
                    "title": "Legs",
                    "exercises": [
                        {
                            "index": 0,
                            "title": "Squat",
                            "rest_seconds": 120,
                            "sets": [
                                {"index": 0, "type": "normal", "weight_kg": 100, "reps": 5},
                                {"index": 1, "type": "normal", "weight_kg": 100, "reps": 5},
                            ],
                        }
                    ],
                }
            ],
        }
    }

    res = client.get("/api/export/routines.csv", headers={"X-Hevy-Key": "k"})

    assert res.status_code == 200
    assert res.headers["x-row-count"] == "2"
    lines = res.text.splitlines()
    assert lines[0] == ",".join(ROUTINE_HEADERS)

    rows = _rows(res.text)
    assert rows[0]["folder_id"] == ""
    assert rows[0]["custom_metric"] == ""
    assert rows[0]["rest_seconds"] == "120"
    assert rows[0]["volume_kg"] == "500"


def test_invalid_key_returns_401():
    _FakeClient.status_code = 401
    res = client.get("/api/export/workouts.csv", headers={"X-Hevy-Key": "bad"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid Hevy API key"


def test_missing_key_returns_422():
    res = client.get("/api/export/routines.csv")
    assert res.status_code == 422
