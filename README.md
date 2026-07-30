# Hevy → Garmin Connect

Sync your Hevy strength routines to Garmin Connect. Runs locally on your machine — no account, no server, no data leaving your hands.

---

[First time setup](#first-time-setup) · [Run the app](#run-the-app) · [Development](#development)

---

## First time setup

```bash
git clone https://github.com/arturguimaraes/hevy-garmin-integration
cd hevy-garmin-integration
./dev/setup.sh
```

That's it. The script installs everything you need:

- **uv** — Python package manager (if not already installed)
- **Python 3.12** — managed by uv, no system changes
- **Frontend** — Node dependencies + production build *(requires Node 18+)*

---

## Run the app

```bash
./dev/run.sh
```

Opens at `http://127.0.0.1:8765`.

```bash
./dev/run.sh --port 9000      # different port
./dev/run.sh --no-browser     # don't open a tab automatically
```

---

## The wizard

| Step | What happens |
|------|-------------|
| 1. Connect Hevy | Paste your API key from [hevy.com/settings?developer](https://www.hevy.com/settings?developer) *(Pro required)* |
| 2. Choose routines | Pick which routines to sync |
| 3. Map exercises | Review the automatic Garmin matches — correct any that are wrong |
| 4. Connect Garmin | Log in with email + password (MFA supported). Session is saved locally so you only need to log in once. |
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
| Garmin email + password | ✓ localStorage | Cleared with the "Forget" link |
| Garmin session token | ✓ localStorage | OAuth DI token pair (access + refresh). Cleared on "Sign in with a different account" or when you type new credentials. |

The Garmin session token is a time-limited OAuth token, not your password. It can be revoked by changing your Garmin password. Storing it means you only need to authenticate once — future sessions skip the login step entirely.

---

## Why local-only?

Garmin's login blocks datacenter IPs — a hosted backend can't authenticate on your behalf. Running locally means your Garmin credentials go directly from your browser to Garmin's servers and nowhere else.

---

## License

MIT · [SECURITY.md](SECURITY.md)
