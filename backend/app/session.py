"""In-memory TTL session store for the Garmin MFA two-step handoff.

Nothing is ever written to disk. Sessions are keyed by random tokens with a
5-minute TTL — long enough for a human to retrieve their MFA code.
"""
from __future__ import annotations

import secrets
import time
from threading import Lock
from typing import Any

_store: dict[str, dict[str, Any]] = {}
_lock = Lock()

TTL = 300  # seconds


def create(data: Any) -> str:
    """Persist data for up to TTL seconds; return a random session ID."""
    sid = secrets.token_urlsafe(32)
    with _lock:
        _prune()
        _store[sid] = {"data": data, "expires": time.monotonic() + TTL}
    return sid


def get(sid: str) -> Any | None:
    """Return stored data, or None if missing or expired."""
    with _lock:
        _prune()
        entry = _store.get(sid)
        if entry is None or entry["expires"] < time.monotonic():
            _store.pop(sid, None)
            return None
        return entry["data"]


def delete(sid: str) -> None:
    with _lock:
        _store.pop(sid, None)


def _prune() -> None:
    now = time.monotonic()
    for k in [k for k, v in _store.items() if v["expires"] < now]:
        del _store[k]
