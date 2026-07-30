# Hevy → Garmin Connect

A local wizard that reads your Hevy strength routines, maps each exercise onto
Garmin's catalog with human review, and uploads them as native Garmin Connect
strength workouts.

---

**→ [First time? Run setup.sh](#setup)**
&nbsp;&nbsp;
**→ [Already set up? Run run.sh](#run)**
&nbsp;&nbsp;
**→ [Development](#development)**

---

## Setup

*Run once after cloning.*

```bash
git clone https://github.com/arturguimaraes/hevy-garmin-integration
cd hevy-garmin-integration
./setup.sh
```

`setup.sh` will:
- Install [uv](https://docs.astral.sh/uv/) if you don't have it
- Install Python 3.12 (via uv — no system changes)
- Install Node dependencies and build the frontend *(requires Node 18+)*

---

## Run

```bash
./run.sh
```

Opens at `http://127.0.0.1:8765`. Options:

```
./run.sh --port N        # use a different port (default: 8765)
./run.sh --no-browser    # don't open a browser tab automatically
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
# Terminal 1 — backend with hot reload
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765

# Terminal 2 — frontend dev server (proxies /api → :8765)
cd frontend
npm run dev
# → http://localhost:5173
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
your own IP, and your Garmin password never leaves your machine.

---

## Security

- Credentials held in browser memory only — never written to disk or `localStorage`
- Server binds to `127.0.0.1` — not reachable from the network
- CORS locked to loopback origins
- No analytics, telemetry, or outbound calls except to Hevy and Garmin

See [SECURITY.md](SECURITY.md) for the full model.

---

## License

MIT — see [LICENSE](LICENSE).
