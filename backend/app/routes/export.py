"""Hevy → CSV export.

Builds Claude-friendly CSVs (one row per set) from Hevy workout history and
routines. Same stateless proxy model as `hevy.py`: the API key arrives in the
`X-Hevy-Key` header and is forwarded to Hevy as `api-key`.
"""
from __future__ import annotations

import csv
import io
from datetime import date, datetime, timezone

import httpx
from fastapi import APIRouter, Header, HTTPException, Query, status
from fastapi.responses import Response

router = APIRouter()
_BASE = "https://api.hevyapp.com/v1"
_PAGE_SIZE = 10
_MAX_PAGES = 300  # safety valve: ~3000 workouts

WORKOUT_HEADERS = [
    "workout_date",
    "workout_start",
    "workout_end",
    "workout_title",
    "workout_id",
    "exercise_index",
    "exercise_title",
    "exercise_notes",
    "superset_id",
    "set_index",
    "set_type",
    "weight_kg",
    "reps",
    "distance_meters",
    "duration_seconds",
    "rpe",
    "volume_kg",
]

ROUTINE_HEADERS = [
    "routine_title",
    "routine_id",
    "folder_id",
    "routine_notes",
    "exercise_index",
    "exercise_title",
    "exercise_notes",
    "superset_id",
    "rest_seconds",
    "set_index",
    "set_type",
    "weight_kg",
    "reps",
    "distance_meters",
    "duration_seconds",
    "rpe",
    "custom_metric",
    "volume_kg",
]


def _cell(value: object) -> object:
    """None renders as an empty cell; everything else is written as-is."""
    return "" if value is None else value


def _volume(weight: object, reps: object) -> object:
    if isinstance(weight, (int, float)) and isinstance(reps, (int, float)):
        return round(weight * reps, 4)
    return ""


def _sort_num(value: object) -> float:
    return float(value) if isinstance(value, (int, float)) else 0.0


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _csv_response(headers: list[str], rows: list[list], filename: str) -> Response:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(headers)
    writer.writerows(rows)
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Row-Count": str(len(rows)),
        },
    )


async def _fetch_pages(client: httpx.AsyncClient, path: str, key: str, item_key: str):
    """Yield each page's list of items from a paginated Hevy endpoint."""
    page = 1
    while page <= _MAX_PAGES:
        r = await client.get(
            f"{_BASE}/{path}",
            headers={"api-key": key},
            params={"page": page, "pageSize": _PAGE_SIZE},
        )
        if r.status_code == 401:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid Hevy API key")
        if not r.is_success:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Hevy API returned an error")
        data = r.json()
        yield data.get(item_key, [])
        if page >= data.get("page_count", 1):
            break
        page += 1


@router.get("/workouts.csv")
async def workouts_csv(
    x_hevy_key: str = Header(..., alias="X-Hevy-Key"),
    since: str | None = Query(None),
) -> Response:
    """All logged workouts as CSV, one row per set. `since` is an ISO 8601 cutoff."""
    since_dt = _parse_dt(since)
    rows: list[list] = []

    async with httpx.AsyncClient(timeout=60) as client:
        async for batch in _fetch_pages(client, "workouts", x_hevy_key, "workouts"):
            for wk in batch:
                start = wk.get("start_time")
                if since_dt is not None:
                    start_dt = _parse_dt(start)
                    if start_dt is not None and start_dt < since_dt:
                        continue
                w_date = (start or "")[:10]
                for ex in wk.get("exercises", []):
                    for s in ex.get("sets", []):
                        rows.append(
                            [
                                w_date,
                                _cell(start),
                                _cell(wk.get("end_time")),
                                _cell(wk.get("title")),
                                _cell(wk.get("id")),
                                _cell(ex.get("index")),
                                _cell(ex.get("title")),
                                _cell(ex.get("notes")),
                                _cell(ex.get("superset_id")),
                                _cell(s.get("index")),
                                _cell(s.get("type")),
                                _cell(s.get("weight_kg")),
                                _cell(s.get("reps")),
                                _cell(s.get("distance_meters")),
                                _cell(s.get("duration_seconds")),
                                _cell(s.get("rpe")),
                                _volume(s.get("weight_kg"), s.get("reps")),
                            ]
                        )

    rows.sort(key=lambda r: (str(r[1]), _sort_num(r[5]), _sort_num(r[9])))
    return _csv_response(
        WORKOUT_HEADERS, rows, f"hevy-workout-history-{date.today().isoformat()}.csv"
    )


@router.get("/routines.csv")
async def routines_csv(
    x_hevy_key: str = Header(..., alias="X-Hevy-Key"),
) -> Response:
    """All routine templates as CSV, one row per set."""
    rows: list[list] = []

    async with httpx.AsyncClient(timeout=60) as client:
        async for batch in _fetch_pages(client, "routines", x_hevy_key, "routines"):
            for rt in batch:
                for ex in rt.get("exercises", []):
                    for s in ex.get("sets", []):
                        rows.append(
                            [
                                _cell(rt.get("title")),
                                _cell(rt.get("id")),
                                _cell(rt.get("folder_id")),
                                _cell(rt.get("notes")),
                                _cell(ex.get("index")),
                                _cell(ex.get("title")),
                                _cell(ex.get("notes")),
                                _cell(ex.get("superset_id")),
                                _cell(ex.get("rest_seconds")),
                                _cell(s.get("index")),
                                _cell(s.get("type")),
                                _cell(s.get("weight_kg")),
                                _cell(s.get("reps")),
                                _cell(s.get("distance_meters")),
                                _cell(s.get("duration_seconds")),
                                _cell(s.get("rpe")),
                                _cell(s.get("custom_metric")),
                                _volume(s.get("weight_kg"), s.get("reps")),
                            ]
                        )

    return _csv_response(
        ROUTINE_HEADERS, rows, f"hevy-routines-{date.today().isoformat()}.csv"
    )
