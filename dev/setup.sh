#!/usr/bin/env bash
# One-time setup: installs uv, Python 3.12, and builds the frontend.
# Run this once after cloning the repo, then use run.sh to start the app.

set -e

# ── 1. Install uv (if not already installed) ──────────────────────────────────
if ! command -v uv &>/dev/null; then
  echo "→ Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # Make uv available in this session
  export PATH="$HOME/.local/bin:$PATH"
  source "$HOME/.local/bin/env" 2>/dev/null || true
fi

echo "✓ uv $(uv --version | head -1)"

# ── 2. Install Python 3.12 (via uv — no system changes) ──────────────────────
echo "→ Ensuring Python 3.12 is available..."
uv python install 3.12
echo "✓ Python 3.12 ready"

# ── 3. Build the frontend ─────────────────────────────────────────────────────
echo "→ Building frontend (requires Node 18+)..."
cd frontend
npm install --silent
npm run build --silent
cd ..
echo "✓ Frontend built"

echo ""
echo "Setup complete. Start the app with:"
echo ""
echo "    ./dev/run.sh"
echo ""
