# Hevy → Garmin Connect

A local wizard that reads your Hevy strength routines, maps each exercise onto
Garmin's catalog with human review, and uploads them as native Garmin Connect
strength workouts.

---

## Requirements

- Python 3.11+
- Hevy Pro account with an API key from [hevy.com/settings?developer](https://www.hevy.com/settings?developer)
- Garmin Connect account

---

## Quick start

### Step 1 — Install `uv` (one-time)

`uvx` is a command that ships with [`uv`](https://docs.astral.sh/uv/), a fast
Python package manager. If you don't have it yet:

**macOS / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**macOS (Homebrew):**
```bash
brew install uv
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.sh | iex"
```

After install, restart your terminal (or run `source ~/.zshrc` / `source ~/.bashrc`)
so that `uvx` is on your PATH.

### Step 2 — Build the frontend (one-time)

The wizard UI is a React app that must be built before the Python server can
serve it. You need Node 18+ for this step.

```bash
# Clone the repo
git clone https://github.com/arturguimaraes/hevy-garmin-integration
cd hevy-garmin-integration

# Build frontend
cd frontend && npm install && npm run build && cd ..
```

### Step 3 — Run

```bash
uvx --from . hevy-garmin
```

This installs the package into a temporary virtual environment and starts the
server. A browser tab opens at `http://127.0.0.1:8765` automatically.

---

## Alternative: install permanently

If you prefer a permanent install instead of `uvx`:

```bash
pip install uv           # skip if already installed
uv pip install -e .      # install the hevy-garmin package
hevy-garmin              # run it
```

---

## CLI options

```
hevy-garmin [--port N] [--host HOST] [--no-browser]

  --port N        Listen on port N (default: 8765)
  --no-browser    Don't open a browser tab automatically
```

---

## The wizard

1. **Connect Hevy** — enter your Hevy API key
2. **Choose routines** — select which routines to sync
3. **Map exercises** — review and correct the automatic Garmin exercise matches
4. **Connect Garmin** — log in with email + password (MFA supported)
5. **Review and push** — upload all workouts to Garmin Connect

---

## Exercise mapping

Garmin has 1,527 exercises across 47 categories. The wizard fuzzy-matches your
Hevy exercise names and shows confidence scores. You review every mapping before
anything is pushed. Your approved mappings are saved locally between sessions so
you only review once.

---

## Security model

- Credentials are held in browser memory only and never written to disk.
- The server binds to `127.0.0.1` — not reachable from the network.
- CORS is locked to loopback origins.
- No analytics, no telemetry, no outbound calls except to Hevy and Garmin.

See [SECURITY.md](SECURITY.md) for the full model.

---

## Development

```bash
# Install Python deps
uv pip install -e ".[dev]"

# Terminal 1 — backend with hot reload
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765

# Terminal 2 — frontend dev server (proxies /api to :8765)
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

Tests:
```bash
pytest backend/tests/
cd frontend && npm test
```

---

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

---

## License

MIT — see [LICENSE](LICENSE).
