"""Exercise mapping routes — fuzzy search against Garmin's catalog.

The matcher lives in app.matcher; this file is just the HTTP surface.
Full implementation lands in Milestone 3.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.models import CatalogEntry, ResolveRequest, ResolveResponse

router = APIRouter()


@router.post("/resolve", response_model=ResolveResponse)
def resolve(body: ResolveRequest) -> ResolveResponse:
    """Return the top-3 Garmin catalog matches for each exercise name."""
    from app.matcher import match  # deferred — matcher.py added in Milestone 3

    return ResolveResponse(
        matches=[
            {
                "hevyName": name,
                "top": [
                    {
                        "name": m["name"],
                        "category": m["category"],
                        "exercise": m["exercise"],
                        "score": m["score"],
                    }
                    for m in match(name, top=3)
                ],
            }
            for name in body.exerciseNames
        ]
    )


@router.get("/search")
def search(q: str = "") -> dict:
    """Full-text search across the 1,527-entry Garmin catalog."""
    from garminconnect import exercises as gex

    q_lower = q.lower()
    hits = [
        CatalogEntry(name=e["name"], category=e["category"], exercise=e["exercise"])
        for e in gex.EXERCISES
        if q_lower in e["name"].lower() or q_lower in e["category"].lower()
    ][:50]
    return {"entries": [h.model_dump() for h in hits]}
