# Hevy → Garmin Connect

Sync your Hevy strength routines to Garmin Connect. Runs locally on your machine — no account, no server, no data leaving your hands.

---

[Run the app](#run-the-app) · [Development](#development)

---

## Run the app

```bash
./run.sh
```

Opens at `http://127.0.0.1:8765`. Installs everything on first run (~150 MB for the Playwright browser); subsequent runs start in seconds.

**First time only** — clone the repo first:

```bash
git clone https://github.com/arturguimaraes/hevy-garmin-integration
cd hevy-garmin-integration
./run.sh
```

```bash
./run.sh --port 9000      # different port
./run.sh --no-browser     # don't open a tab automatically
```

---

## The wizard

| Step | What happens |
|------|-------------|
| 1. Connect Hevy | Paste your API key from [hevy.com/settings?developer](https://www.hevy.com/settings?developer) *(Pro required)* |
| 2. Choose routines | Pick which routines to sync |
| 3. Map exercises | Review the automatic Garmin matches — correct any that are wrong |
| 4. Connect Garmin | A browser window opens; log in to Garmin Connect there. Your credentials go directly to Garmin — this app never sees them. Session token is saved locally so you only log in once. |
| 5. Review & push | Upload all workouts to Garmin Connect |

---

## Development

```bash
# Terminal 1 — Python backend
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765

# Terminal 2 — React frontend (proxies /api → :8765)
cd frontend
npm run dev
```

Tests:

```bash
pytest backend/tests/
cd frontend && npm test
```

---

## Credential & session storage

All sensitive values are stored in your **browser's localStorage** (prefix `hg:`), never on disk or sent to any third party.

| What | Stored? | Notes |
|------|---------|-------|
| Hevy API key | ✓ localStorage | Cleared with the "Forget" link |
| Garmin session token | ✓ localStorage | OAuth token captured after browser login. Cleared on "Sign in with a different account". |

The Garmin session token is a time-limited OAuth token, not your password. It can be revoked by changing your Garmin password.

---

## Why local-only?

Garmin's login flow is protected by Cloudflare bot detection — a hosted backend can't authenticate on your behalf. Running locally means a real browser window opens on your machine, bypassing Cloudflare entirely, and your credentials go directly to Garmin.

---

## License

MIT · [SECURITY.md](SECURITY.md)
