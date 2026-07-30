"""Hevy API proxy — validates keys and fetches routines."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Header, HTTPException, status

from app.models import HevyValidateRequest, HevyValidateResponse

router = APIRouter()
_BASE = "https://api.hevyapp.com/v1"


@router.post("/validate", response_model=HevyValidateResponse)
async def validate(body: HevyValidateRequest) -> HevyValidateResponse:
    """Lightweight check that the API key is valid."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{_BASE}/routines",
            headers={"api-key": body.apiKey},
            params={"page": 1, "pageSize": 1},
        )
    if r.status_code == 401:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid Hevy API key")
    if not r.is_success:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Hevy API returned an error")
    return HevyValidateResponse(ok=True, username=None)


@router.get("/routines")
async def routines(
    x_hevy_key: str = Header(..., alias="X-Hevy-Key"),
) -> dict:
    """Fetch all routines for the authenticated user."""
    all_routines: list[dict] = []
    page = 1
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            r = await client.get(
                f"{_BASE}/routines",
                headers={"api-key": x_hevy_key},
                params={"page": page, "pageSize": 10},
            )
            if r.status_code == 401:
                raise HTTPException(
                    status.HTTP_401_UNAUTHORIZED, detail="Invalid Hevy API key"
                )
            if not r.is_success:
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY, detail="Hevy API returned an error"
                )
            batch = r.json().get("routines", [])
            if not batch:
                break
            all_routines.extend(batch)
            page += 1
    return {"routines": all_routines}
