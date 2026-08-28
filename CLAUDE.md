# Claude instructions

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

## Integration architecture

This app integrates with two external services. Keep these descriptions accurate — update them whenever the integration changes.

### Hevy

- **What**: Fetches the user's strength routines via the Hevy REST API.
- **Auth**: API key passed in the `X-Hevy-Key` header. Stored in `localStorage` under `hg:hevyApiKey`. Validated in Step 1.
- **Key endpoints**: `POST /api/hevy/validate` (check key + fetch username), `GET /api/hevy/routines` (list all routines with exercises and sets).
- **Library**: Raw `httpx` requests in `backend/app/routes/hevy.py`.

### Garmin Connect

- **What**: Uploads strength workouts to Garmin Connect via the garminconnect library (which wraps the `garth` OAuth client).
- **Auth**: Step 4 opens a real Chromium browser (Playwright, non-headless) pointed at `connect.garmin.com/signin`. The user logs in manually. The backend intercepts the DI token from `diauth.garmin.com` network responses (preferred), or falls back to the `JWT_WEB` cookie. Serialised as `{"di_token": ...}` or `{"jwt_web": ...}` and returned to the frontend. Stored in `localStorage` under `hg:garminToken`.
- **Key endpoints**: `POST /api/garmin/browser-login` (opens browser, blocks until login completes, returns token), `POST /api/garmin/push` (uploads workouts using the stored token — stateless).
- **Libraries**: `playwright` for the browser login, `garminconnect` + `garth` for workout upload.
- **Why browser-based**: Garmin's Cloudflare protection blocks all automated HTTP login strategies. A real browser bypasses this entirely.

Update this section whenever:
- A new external service is added or removed
- The auth mechanism for an existing service changes (e.g. different token format, different storage key, different login flow)
- A new backend route is added or removed that talks to an external service

## Isolation & modularization

Always prefer isolation and modularization. When adding a feature, keep its logic, state, and UI together in a single self-contained folder with a barrel (`index.ts`) exposing a **minimal** public surface. Wiring it into the rest of the app should be a few one-line touch points (mount a provider, drop in a component) — feature internals must not leak across the codebase.

- One feature = one folder under `frontend/src/components/<feature>/` (or `src/<module>/` for non-UI modules like `state`, `api`).
- Cross-feature imports go through the barrel only, using the `@/` alias.
- Split a file into a feature folder before it grows unwieldy, not after.

Example: the theme/appearance feature lives entirely in `frontend/src/components/config/` (`ThemeProvider`, `theme.ts`, `ConfigMenu`, `ConfigModal`, `ThemeControl`); `main.tsx` and `Header.tsx` each touch it in one line.

## Code cleanup

When making any change, **remove code that is no longer used**. Do not leave dead code behind.

- Delete imports, functions, types, state fields, reducers cases, API methods, and backend routes that are no longer referenced after a change.
- Delete entire files when nothing in them is used anymore.
- Do not add `// unused` or `// removed` comments — just delete.
- This applies even when the dead code is outside the direct scope of the current task.
