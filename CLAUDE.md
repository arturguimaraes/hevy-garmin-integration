# Claude instructions

## Working style

Do not assume anything and start implementing. When a request is ambiguous, or
when the way to verify a change (spinning up servers, installing browsers,
downloading dependencies) is heavier than the change itself, ask first instead
of guessing — this saves tokens and avoids wasted work.

## README updates

Keep `README.md` up to date whenever any of the following change:

- **Wizard steps** — if a step is added, removed, renamed, or its behaviour changes meaningfully (e.g. new persistence behaviour, new MFA flow, new skip logic)
- **Credential / session storage** — if what is stored in `localStorage`, what prefix is used (`hg:`), or the storage semantics change
- **Setup or run commands** — if `dev/setup.sh`, `run.sh`, flags, or the default port change
- **Dev workflow** — if the backend or frontend start commands, test commands, or port numbers change
- **Why local-only rationale** — if the technical reason for running locally changes

Do **not** update the README for:
- Internal refactors that have no user-visible effect (e.g. renaming enums, moving files)
- Skeleton/milestone placeholders being filled in (update when the feature ships, not when the skeleton is added)
- Bug fixes that don't change documented behaviour

## Changelog

Add a dated entry to `CHANGELOG.md` (repo root, newest first) whenever a feature ships — one heading per shipped feature, not per commit. Same shape as the existing entries: `## YYYY-MM-DD — <feature>` followed by a short paragraph.

## Integration architecture

This app integrates with three external services. Keep these descriptions accurate — update them whenever the integration changes.

### Hevy

- **What**: Fetches the user's strength routines and logged workout history via the Hevy REST API.
- **Auth**: API key passed in the `X-Hevy-Key` header. Stored in `localStorage` under `hg:hevyApiKey`. Owned by the `frontend/src/components/hevy/` feature; validated on the shared connect screen (shown before the home menu), used by both the Garmin-sync wizard and the CSV export.
- **Key endpoints**: `POST /api/hevy/validate` (check key), `GET /api/hevy/routines` (list all routines with exercises and sets), `GET /api/export/workouts.csv` (logged workout history as CSV, one row per set, optional `since` ISO 8601 query param), `GET /api/export/routines.csv` (routines as CSV, one row per set).
- **Library**: Raw `httpx` requests in `backend/app/routes/hevy.py` and `backend/app/routes/export.py`.

### Garmin Connect

- **What**: Uploads strength workouts to Garmin Connect via the garminconnect library (which wraps the `garth` OAuth client).
- **Auth**: Step 4 opens a real Chromium browser (Playwright, non-headless) pointed at `connect.garmin.com/signin`. The user logs in manually. The backend intercepts the DI token from `diauth.garmin.com` network responses (preferred), or falls back to the `JWT_WEB` cookie. Serialised as `{"di_token": ...}` or `{"jwt_web": ...}` and returned to the frontend. Stored in `localStorage` under `hg:garminToken`.
- **Key endpoints**: `POST /api/garmin/browser-login` (opens browser, blocks until login completes, returns token), `POST /api/garmin/push` (uploads workouts using the stored token — stateless).
- **Libraries**: `playwright` for the browser login, `garminconnect` + `garth` for workout upload.
- **Why browser-based**: Garmin's Cloudflare protection blocks all automated HTTP login strategies. A real browser bypasses this entirely.

### Intervals.icu

- **What**: Schedules structured **running** workouts by creating Intervals.icu calendar events. The user's own Intervals.icu → Garmin link (configured on their account, outside this app) then syncs each event to the watch. Independent of the Garmin strength push — different feature, different route.
- **Auth**: HTTP Basic — username is the literal string `API_KEY`, password is the user's Intervals.icu API key (`httpx: auth=("API_KEY", api_key)`). The API key and Athlete ID are stored in `localStorage` under `hg:intervalsApiKey` / `hg:intervalsAthleteId`, owned by the `frontend/src/components/intervals/` feature. Sent in the request body to the local backend per call; never stored or logged server-side (same pattern as the Hevy key and Garmin token).
- **Key endpoints**: `POST /api/intervals/preview` (compiles each pasted workout to Workout Builder text, never calls Intervals.icu), `POST /api/intervals/push` (creates one `POST https://intervals.icu/api/v1/athlete/{athleteId}/events` per valid workout — stateless).
- **Libraries**: Raw `httpx` in `backend/app/routes/intervals.py`; pure compiler in `backend/app/intervals_compiler.py`.
- **Why plain-text `description`, not `workout_doc`**: Intervals.icu's public API does **not** accept a raw `steps` / `workout_doc` JSON on create — that internal format is deliberately not public, and posting it silently creates an event with no structured steps. The only supported way to get parsed steps is to POST a `description` string in Intervals.icu's own Workout Builder plain-text syntax, which their server parses. The compiler emits that syntax; see its test vectors for the exact format.

Update this section whenever:
- A new external service is added or removed
- The auth mechanism for an existing service changes (e.g. different token format, different storage key, different login flow)
- A new backend route is added or removed that talks to an external service

## Isolation & modularization

Always prefer isolation and modularization. When adding a feature, keep its logic, state, and UI together in a single self-contained folder with a barrel (`index.ts`) exposing a **minimal** public surface. Wiring it into the rest of the app should be a few one-line touch points (mount a provider, drop in a component) — feature internals must not leak across the codebase.

- One feature = one folder under `frontend/src/components/<feature>/` (or `src/<module>/` for non-UI modules like `state`, `api`).
- Cross-feature imports go through the barrel only, using the `@/` alias.
- Split a file into a feature folder before it grows unwieldy, not after.

Examples:
- The theme/appearance feature lives entirely in `frontend/src/components/config/` (`ThemeProvider`, `theme.ts`, `ConfigMenu`, `ConfigModal`, `ThemeControl`); `main.tsx` and `Header.tsx` each touch it in one line.
- The Hevy connection lives entirely in `frontend/src/components/hevy/` (`HevyProvider`/`useHevy`, `hevyStorage.ts`, `HevyGate`, `ConnectHevyScreen`, `ApiKeyField`); `main.tsx` wraps the provider, `App.tsx` mounts `<HevyGate>`, and each consumer reads `useHevy()` in one line.
- The home-menu / mode selection is `frontend/src/components/home/` (`useAppMode`, `AppModeEnum`, `HomeMenu`); the CSV export is `frontend/src/components/csv-export/` (`CsvExport`, `useCsvExport`, `range.ts`). Both are mounted from `App.tsx` in one line each.
- The Intervals.icu push lives entirely in `frontend/src/components/intervals/` (`IntervalsPush`, `useIntervalsPush`, `IntervalsCredentialsForm`, `intervalsStorage.ts`); `App.tsx` mounts `<IntervalsPush>` in one line and `HomeMenu` gets one `onPushIntervals` prop.

## Code cleanup

When making any change, **remove code that is no longer used**. Do not leave dead code behind.

- Delete imports, functions, types, state fields, reducers cases, API methods, and backend routes that are no longer referenced after a change.
- Delete entire files when nothing in them is used anymore.
- Do not add `// unused` or `// removed` comments — just delete.
- This applies even when the dead code is outside the direct scope of the current task.
