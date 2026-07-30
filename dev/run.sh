#!/usr/bin/env bash
# Start the Hevy → Garmin Connect wizard.
# Usage: ./run.sh [--port N] [--no-browser]

set -e

if ! command -v uv &>/dev/null; then
  echo "uv not found. Run ./setup.sh first."
  exit 1
fi

exec uvx --python 3.12 --from . hevy-garmin "$@"
