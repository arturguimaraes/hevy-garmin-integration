# Hevy → Garmin Connect

A local wizard that reads your Hevy strength routines, maps each exercise onto
Garmin's catalog with human review, and uploads them as native Garmin Connect
strength workouts.

---

**[First time? Start here →](#first-time-setup)**
&nbsp;·&nbsp;
**[Already installed →](#run)**
&nbsp;·&nbsp;
**[Development →](#development)**

---

## First time setup

### 1 — Install `uv`

`uvx` ships with [`uv`](https://docs.astral.sh/uv/). Install it once, then restart your terminal.

| Platform | Command |
|---|---|
| macOS / Linux | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| macOS (Homebrew) | `brew install uv` |
| Windows (PowerShell) | `irm https://astral.sh/uv/install.sh \| iex` |

### 2 — Clone and build the frontend

```bash
git clone https://github.com/arturguimaraes/hevy-garmin-integration
cd hevy-garmin-integration
cd frontend && npm install && npm run build && cd ..
```

> Requires Node 18+. Only needed once (or after pulling frontend changes).

### 3 — Run

```bash
uvx --from . hevy-garmin
```

A browser tab opens at `http://127.0.0.1:8765`.

---

## Run

```bash
uvx --from . hevy-garmin
```

Options:

```
--port N        Listen on port N (default: 8765)
--no-browser    Don't open a browser tab automatically
```

---

## The wizard

1. **Connect Hevy** — enter your API key from [hevy.com/settings?developer](https://www.hevy.com/settings?developer) *(Hevy Pro required)*
2. **Choose routines** — select which routines to sync
3. **Map exercises** — review and correct the automatic Garmin exercise matches
4. **Connect Garmin** — log in with email + password (MFA supported)
5. **Review and push** — upload all workouts to Garmin Connect

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

## Why local-only?

Garmin's login endpoint blocks datacenter IPs (Cloudflare 403), so a hosted
backend can't log in on your behalf. Running locally means requests come from
your own IP, and your Garmin password never leaves your machine — structurally
verifiable by anyone who reads the source.

---

## Security

- Credentials held in browser memory only — never written to disk, logs, or `localStorage`
- Server binds to `127.0.0.1` — not reachable from the network
- CORS locked to loopback origins
- No analytics, telemetry, or outbound calls except to Hevy and Garmin

See [SECURITY.md](SECURITY.md) for the full model.

---

## License

MIT — see [LICENSE](LICENSE).
