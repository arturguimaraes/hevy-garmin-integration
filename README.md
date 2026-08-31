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

## Getting started

The first time you open the app, **connect Hevy** once — paste your API key from
[hevy.com/settings?developer](https://www.hevy.com/settings?developer) *(Pro required)*. The key
is saved locally, so from then on you land straight on the **home menu**, where you pick a task:

- **Sync to Garmin** — the routine-sync wizard (below)
- **Export to CSV** — download your Hevy data as CSV (below)

---

## Sync to Garmin

| Step | What happens |
|------|-------------|
| 1. Choose routines | Pick which routines to sync |
| 2. Map exercises | Review the automatic Garmin matches; click any exercise to pick a different Garmin exercise from the suggestions or by searching the catalog |
| 3. Connect Garmin | A browser window opens; log in to Garmin Connect there. Your credentials go directly to Garmin — this app never sees them. Session token is saved locally so you only log in once. |
| 4. Review & push | Upload all workouts to Garmin Connect |

---

## Export to CSV

Download your Hevy data as CSV, ready to drop into a spreadsheet or a Claude project.

- Tick **Workout history**, **Routines**, or both.
- For history, choose a range: all time / last 3 / 6 / 12 months.
- You get `hevy-workout-history-YYYY-MM-DD.csv` and/or `hevy-routines-YYYY-MM-DD.csv`.

Each file has **one row per set** (every set type kept — normal, warmup, dropset, failure), ISO 8601
dates, units in the column names (`weight_kg`, `duration_seconds`, …), and a precomputed
`volume_kg` (`weight_kg × reps`) column.

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

## Appearance

The app is **dark by default**. Click the gear icon in the top-right to open Settings and switch between **Dark**, **Light**, and **System** (follows your OS). The choice is saved in `localStorage` under `hg:theme`.

---

## Credential & session storage

All sensitive values are stored in your **browser's localStorage** (prefix `hg:`), never on disk or sent to any third party.

| What | Stored? | Notes |
|------|---------|-------|
| Hevy API key | ✓ localStorage | Cleared with the "Forget" link |
| Garmin session token | ✓ localStorage | OAuth token captured after browser login. Cleared on "Sign in with a different account". |
| Theme preference | ✓ localStorage | `hg:theme` — not sensitive; UI preference only |

The Garmin session token is a time-limited OAuth token, not your password. It can be revoked by changing your Garmin password.

---

## Why local-only?

Garmin's login flow is protected by Cloudflare bot detection — a hosted backend can't authenticate on your behalf. Running locally means a real browser window opens on your machine, bypassing Cloudflare entirely, and your credentials go directly to Garmin.

---

## License

MIT · [SECURITY.md](SECURITY.md)
