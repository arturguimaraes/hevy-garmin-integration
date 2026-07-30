"""FastAPI application — serves the wizard UI and proxies to Hevy / Garmin."""
from __future__ import annotations

import argparse
import logging
import threading
import webbrowser
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routes import garmin, hevy, mapping

log = logging.getLogger(__name__)

_HERE = Path(__file__).parent

# Production: wheel ships with static/ built by scripts/build.sh
# Development: Vite outputs to frontend/dist/
_STATIC = _HERE / "static"
if not _STATIC.exists():
    _STATIC = _HERE.parent.parent / "frontend" / "dist"

app = FastAPI(title="hevy-garmin", docs_url=None, redoc_url=None)

# CORS is locked to loopback addresses only.
# localhost:5173 covers the Vite dev server; it is unreachable from external
# networks even when listed because the server itself binds to 127.0.0.1.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8765",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes — must be registered before the static-file catch-all.
app.include_router(hevy.router, prefix="/api/hevy")
app.include_router(garmin.router, prefix="/api/garmin")
app.include_router(mapping.router, prefix="/api/mapping")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


# Static files — registered last so API routes always win.
if _STATIC.exists():
    if (_STATIC / "assets").exists():
        app.mount("/assets", StaticFiles(directory=_STATIC / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str) -> FileResponse:
        """Serve static files or fall back to index.html for SPA navigation."""
        target = _STATIC / full_path
        if target.is_file():
            return FileResponse(target)
        return FileResponse(_STATIC / "index.html")
else:

    @app.get("/")
    def no_frontend() -> dict:
        return {
            "detail": (
                "Frontend not built. Run: cd frontend && npm install && npm run build"
            )
        }


def main() -> None:
    p = argparse.ArgumentParser(description="Hevy → Garmin Connect sync wizard")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--no-browser", action="store_true")
    args = p.parse_args()

    if args.host != "127.0.0.1":
        print(
            "\nWARNING: Binding to a non-loopback address exposes this server to the\n"
            "         network. Garmin and Hevy credentials could be visible to other\n"
            "         machines. Only use this in a trusted environment.\n"
        )

    url = f"http://{args.host}:{args.port}"
    if not args.no_browser:
        threading.Timer(1.5, webbrowser.open, args=[url]).start()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
    logging.getLogger("garminconnect").setLevel(logging.DEBUG)

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
