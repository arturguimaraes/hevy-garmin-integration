#!/usr/bin/env bash
# Start the Hevy → Garmin Connect wizard.
# Installs everything automatically on first run; subsequent runs are fast.
# Usage: ./run.sh [--port N] [--no-browser]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Determine port from args (default 8765) so we can free it if busy
PORT=8765
for arg in "$@"; do
  case "$arg" in --port) NEXT_IS_PORT=1 ;; *)
    if [[ "${NEXT_IS_PORT}" == "1" ]]; then PORT="$arg"; NEXT_IS_PORT=0; fi ;;
  esac
done

# ── 1. uv ─────────────────────────────────────────────────────────────────────
if ! command -v uv &>/dev/null; then
  echo "→ Installing uv…"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
  source "$HOME/.local/bin/env" 2>/dev/null || true
  echo "✓ uv installed"
else
  echo "✓ uv $(uv --version | head -1)"
fi

# ── 2. Python 3.12 ────────────────────────────────────────────────────────────
echo "→ Ensuring Python 3.12…"
uv python install 3.12
echo "✓ Python 3.12 ready"

# ── 3. Frontend dependencies ──────────────────────────────────────────────────
echo "→ Installing frontend dependencies…"
cd "$PROJECT_ROOT/frontend"
npm install
echo "✓ Frontend dependencies ready"

# ── 4. Playwright browser (downloaded once, ~150 MB) ──────────────────────────
echo "→ Ensuring Playwright Chromium…"
cd "$PROJECT_ROOT"
uv run --python 3.12 python -m playwright install chromium
echo "✓ Chromium ready"

# ── 5. Build frontend ─────────────────────────────────────────────────────────
echo "→ Building frontend…"
cd "$PROJECT_ROOT/frontend"
npm run build
cd "$PROJECT_ROOT"
echo "✓ Frontend built"

# ── 6. Free port if already in use ────────────────────────────────────────────
EXISTING_PID=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
if [[ -n "$EXISTING_PID" ]]; then
  echo "→ Port $PORT in use (PID $EXISTING_PID) — stopping previous instance…"
  kill "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi

# ── 7. Start backend ──────────────────────────────────────────────────────────
echo "→ Starting backend on port $PORT…"
PYTHONPATH="$PROJECT_ROOT/backend" exec uv run --python 3.12 python -m app.main "$@"
