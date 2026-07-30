#!/usr/bin/env bash
# Start the Hevy → Garmin Connect wizard.
# Usage: ./run.sh [--port N] [--no-browser]

set -e

if ! command -v uv &>/dev/null; then
  echo "uv not found. Run ./setup.sh first."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

PYTHONPATH="$PROJECT_ROOT/backend" exec uv run --python 3.12 python -m app.main "$@"
