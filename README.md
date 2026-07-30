# Hevy → Garmin Connect

A local wizard that reads your Hevy strength routines, maps each exercise onto
Garmin's catalog with human review, and uploads them as native Garmin Connect
strength workouts.

```
uvx hevy-garmin
```

Opens at `http://127.0.0.1:8765`.

---

## Why local-only?

Garmin's login endpoint blocks datacenter IPs. Hosting this on a server would
mean your Garmin password travels to someone else's machine — bad regardless of
intent. Running locally keeps requests from your residential IP (no Cloudflare
block) and makes the no-credential-storage promise structurally verifiable: the
process runs on your machine, you can read the source.

## Requirements

- Python 3.11+ and [uv](https://docs.astral.sh/uv/)
- Node 18+ (only if you want to modify the frontend)
- Hevy Pro account with an API key from [hevy.com/settings?developer](https://www.hevy.com/settings?developer)
- Garmin Connect account

## Usage

```bash
# Run directly (no install needed)
uvx hevy-garmin

# Or install first
pip install hevy-garmin
hevy-garmin
```

Options:
```
--port N        Listen on port N (default: 8765)
--no-browser    Don't open a browser tab automatically
```

## The wizard

1. **Connect Hevy** — enter your Hevy API key
2. **Choose routines** — select which routines to sync
3. **Map exercises** — review and correct the automatic Garmin exercise matches
4. **Connect Garmin** — log in with email + password (MFA supported)
5. **Review and push** — upload all workouts to Garmin Connect

## Exercise mapping

Garmin has 1,527 exercises across 47 categories. The wizard fuzzy-matches your
Hevy exercise names and shows confidence scores. You review every mapping before
anything is pushed. Your approved mappings are saved locally between sessions so
you only review once.

## Security model

- Credentials are held in browser memory only and never written to disk.
- The server binds to `127.0.0.1` — not reachable from the network.
- CORS is locked to loopback origins.
- No analytics, no telemetry, no outbound calls except to Hevy and Garmin.

See [SECURITY.md](SECURITY.md) for the full model.

## Development

```bash
# Backend (from repo root)
uv pip install -e ".[dev]"
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # Vite at localhost:5173, proxies /api to :8765
```

Tests:
```bash
pytest backend/tests/
cd frontend && npm test
```

## Repo layout

```
backend/
  app/
    main.py          FastAPI app, serves frontend build
    routes/          hevy.py, garmin.py, mapping.py
    matcher.py       Exercise name → Garmin catalog fuzzy match
    builder.py       Hevy blocks → StrengthWorkout payload
    session.py       In-memory TTL store (MFA handoff only)
    models.py        Pydantic request/response models
  tests/
frontend/
  src/
    steps/           One component per wizard step
    api/             Typed fetch client
    state/           Wizard reducer + types
docs/                GitHub Pages landing page
Dockerfile
pyproject.toml
SECURITY.md
```

## License

MIT — see [LICENSE](LICENSE).
