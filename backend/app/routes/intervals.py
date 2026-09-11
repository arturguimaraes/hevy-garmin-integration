"""Intervals.icu proxy — compiles structured runs and creates calendar events.

Stateless, like the Hevy and Garmin routes: the Athlete ID and API key arrive in
the request body, are used for a single HTTP Basic call to Intervals.icu, and are
never stored or logged. Intervals.icu then syncs the created event to the athlete's
watch through their own Intervals.icu → Garmin link (configured outside this app).
"""
from __future__ import annotations

import json
import logging

import httpx
from fastapi import APIRouter, HTTPException, Request, status

from app.intervals_compiler import BatchStructureError, parse_batch
from app.models import (
    IntervalsItemResult,
    IntervalsPreviewResponse,
    IntervalsPushRequest,
    IntervalsPushResponse,
)

router = APIRouter()
log = logging.getLogger(__name__)

_EVENTS_URL = "https://intervals.icu/api/v1/athlete/{athlete_id}/events"


async def _raw_batch(request: Request):
    """Read the request body as JSON, mapping a parse failure to a 400."""
    try:
        return await request.json()
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Request body is not valid JSON"
        ) from exc


@router.post("/preview", response_model=IntervalsPreviewResponse)
async def preview(request: Request) -> IntervalsPreviewResponse:
    """Compile each pasted workout to Workout Builder text. Never calls Intervals.icu."""
    raw = await _raw_batch(request)
    try:
        _, results = parse_batch(raw)
    except BatchStructureError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return IntervalsPreviewResponse(items=results)


@router.post("/push", response_model=IntervalsPushResponse)
async def push(body: IntervalsPushRequest) -> IntervalsPushResponse:
    """Create one Intervals.icu calendar event per workout that validates."""
    try:
        valid, results = parse_batch(body.workouts)
    except BatchStructureError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    by_index: dict[int, IntervalsItemResult] = {r.index: r for r in results}
    url = _EVENTS_URL.format(athlete_id=body.athleteId)

    async with httpx.AsyncClient(timeout=30) as client:
        for i, workout in valid:
            item = by_index[i]
            try:
                r = await client.post(
                    url,
                    auth=("API_KEY", body.apiKey),
                    json={
                        "category": "WORKOUT",
                        "type": workout.sport,
                        "start_date_local": workout.start_date_local,
                        "name": workout.name,
                        "description": item.description,
                    },
                )
            except httpx.HTTPError as exc:
                log.warning("Intervals.icu request failed for %r: %s", workout.name, exc)
                item.errors.append("Could not reach Intervals.icu — try again")
                continue

            if r.status_code in (401, 403):
                item.errors.append("Invalid API key or athlete ID")
            elif not r.is_success:
                item.errors.append(f"Intervals.icu returned {r.status_code}")
            else:
                event_id = r.json().get("id")
                item.eventId = str(event_id) if event_id is not None else None

    return IntervalsPushResponse(results=results)
