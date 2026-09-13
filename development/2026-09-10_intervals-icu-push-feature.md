# Feature: paste structured running workouts, push to Garmin via Intervals.icu

**Date:** 2026-09-10
**Repo:** arturguimaraes/hevy-garmin-integration
**Purpose:** Paste this whole file into a Claude Code conversation inside the repo.

---

## Context

This app is a local-first FastAPI + React/Vite tool. It currently supports two things
from the home menu: "Sync to Garmin" (a 4-step wizard pushing Hevy strength routines
directly to Garmin Connect via browser login) and "Export to CSV". Follow
`CLAUDE.md`'s isolation/modularization rules, the `hg:` localStorage prefix convention,
and the existing per-feature folder pattern (see `components/csv-export/` and
`components/hevy/` as references) throughout.

This feature is unrelated to the existing Garmin strength push — do not touch it.
It adds a new, independent way to schedule **running workouts** by pushing them to
Intervals.icu, which then syncs to Garmin via the athlete's own Intervals.icu → Garmin
link (already configured on their account, outside this app's scope).

## Key API fact (verified against Intervals.icu's own forum/docs — do not deviate)

Intervals.icu's public API does **not** accept a raw `steps`/`workout_doc` JSON on
create — that internal format is deliberately not part of the public API, and posting
it silently creates an event with no structured steps. The only way to get parsed,
structured steps is to POST a `description` field containing Intervals.icu's own
**Workout Builder plain-text syntax**; their server parses that text into steps.

Endpoint: `POST https://intervals.icu/api/v1/athlete/{athleteId}/events`
Auth: HTTP Basic — username literal `"API_KEY"`, password = the user's API key
  (httpx: `auth=("API_KEY", api_key)`)

Body:

```json
{
  "category": "WORKOUT",
  "type": "Run",
  "start_date_local": "2026-09-16T07:00:00",
  "name": "M15W12 Run #1 - Easy",
  "description": "<compiled Workout Builder text — see below>"
}
```

Success response includes an `id` field for the created event.

### Workout Builder syntax cheat-sheet (what the compiler must emit)

- A section is a header line, optionally followed by `Nx` to repeat it, e.g.
  `Main Set 4x`. Leave a blank line before and after every section.
- A step is a line starting with `- `, in this order: `[cue text] [duration or
  distance] [target]`. Cue text is anything before the first duration/distance token.
- Duration: `10m` (minutes), `90s` (seconds), `1h30m` (combined). `m` = minutes here.
- Distance: `2km`, `1mi`, or **meters as `mtr`** (e.g. `800mtr`) — never plain `m` for
  meters, since `m` means minutes in this syntax.
- A target string is written out in full, including its keyword suffix, e.g.
  `4:45/km Pace`, `6:30-6:00/km Pace`, `Z2 HR`, `90-95% LTHR`. Ramps: prefix the
  target with `ramp ` (case-insensitive), e.g. `ramp 6:30-6:00/km Pace`.
- Free text before the first section (if present) is the workout's overall
  description/intro, separated from the first section by a blank line.

## JSON schema this feature accepts

The pasted payload is **always a bare JSON array**, even for a single workout —
`[{...}]`, never `{"workouts": [...]}` or a bare object. Reject anything else with an
explicit, friendly error (see Validation below).

```json
[
  {
    "name": "M15W12 Run #1 - Easy",
    "sport": "Run",
    "start_date_local": "2026-09-16T07:00:00",
    "target_type": "pace",
    "notes": "Easy effort — hamstring rehab, stop if posterior thigh tightness",
    "sections": [
      { "label": "Warmup", "steps": [
        { "duration": "10m", "target": "6:30-6:00/km Pace" }
      ]},
      { "label": "Main Set", "repeat": 4, "steps": [
        { "duration": "3m", "target": "4:45/km Pace", "cue": "Tempo" },
        { "duration": "90s", "target": "6:30/km Pace", "cue": "Recovery jog" }
      ]},
      { "label": "Cooldown", "steps": [
        { "duration": "10m", "target": "6:30-6:00/km Pace" }
      ]}
    ]
  }
]
```

Field notes:

- `sport`: `"Run"` for now (design so adding `"Ride"`/`"Row"` later needs no
  restructuring — it's just passed through as Intervals.icu's `type`).
- `target_type`: `"pace"` or `"hr"`. **Every step's `target` in a workout must match
  its `target_type`** (Intervals.icu doesn't allow mixing pace and HR in one workout):
  for `"pace"`, `target` must end with the literal word `Pace`; for `"hr"`, it must
  end with `HR` or `LTHR`. Validate this and reject with a clear per-step message if
  it doesn't match.
- Each step has exactly one of `duration` or `distance` (never both, never neither).
- `repeat` is optional on a section (omit for a non-repeated section).
- `cue` and `notes` are optional.
- `ramp` (optional boolean on a step) prefixes the target with `ramp ` as above.

### Compiler test vectors (write these as actual unit tests)

**Test 1** — the example above compiles to exactly:

```
Easy effort — hamstring rehab, stop if posterior thigh tightness

Warmup
- 10m 6:30-6:00/km Pace

Main Set 4x
- Tempo 3m 4:45/km Pace
- Recovery jog 90s 6:30/km Pace

Cooldown
- 10m 6:30-6:00/km Pace
```

**Test 2** — HR-based, distance step in meters, ramp:

```json
{
  "name": "Hyrox Conditioning Intervals",
  "sport": "Run",
  "start_date_local": "2026-09-20T07:00:00",
  "target_type": "hr",
  "sections": [
    { "label": "Warmup", "steps": [
      { "duration": "10m", "target": "Z1-Z2 HR", "ramp": true }
    ]},
    { "label": "Main Set", "repeat": 6, "steps": [
      { "distance": "400m", "target": "Z4 HR", "cue": "Hard" },
      { "duration": "90s", "target": "Z1 HR", "cue": "Jog recovery" }
    ]}
  ]
}
```

compiles to exactly:

```
Warmup
- ramp 10m Z1-Z2 HR

Main Set 6x
- Hard 400mtr Z4 HR
- Jog recovery 90s Z1 HR
```

(Note the `400m` → `400mtr` translation — that's the compiler's job, not the author's.)

## Backend

`backend/app/models.py` — add a `# ── Intervals.icu ──` section:

```python
class IntervalsStep(BaseModel):
    cue: str | None = None
    duration: str | None = None
    distance: str | None = None
    target: str
    ramp: bool = False
    # validator: exactly one of duration/distance must be set

class IntervalsSection(BaseModel):
    label: str
    repeat: int | None = None
    steps: list[IntervalsStep]

class IntervalsWorkout(BaseModel):
    name: str
    sport: str = "Run"
    start_date_local: str
    target_type: Literal["pace", "hr"]
    notes: str | None = None
    sections: list[IntervalsSection]

class IntervalsItemResult(BaseModel):
    index: int
    name: str | None = None
    description: str | None = None   # compiled text, preview only
    eventId: str | None = None       # push only
    errors: list[str] = []

class IntervalsPreviewResponse(BaseModel):
    items: list[IntervalsItemResult]

class IntervalsPushRequest(BaseModel):
    athleteId: str
    apiKey: str
    workouts: list[dict]   # raw — re-validated server-side, same as preview

class IntervalsPushResponse(BaseModel):
    results: list[IntervalsItemResult]
```

`backend/app/intervals_compiler.py` — pure functions, no I/O:

- `compile_workout(workout: IntervalsWorkout) -> str` — renders the syntax per the
  cheat-sheet above.
- `parse_batch(raw: Any) -> tuple[list[tuple[int, IntervalsWorkout]], list[IntervalsItemResult]]`
  — shared by both routes. If `raw` is not a list, raise a single clear error (see
  Validation). Otherwise validate each item independently; items that fail produce an
  `IntervalsItemResult` with `errors` populated and no `description`; items that pass
  are compiled immediately (`description` populated) and returned alongside their
  parsed model.

`backend/app/routes/intervals.py`:

- `POST /api/intervals/preview` — accepts the raw body (do **not** type the FastAPI
  parameter as `list[IntervalsWorkout]`, since that would let FastAPI's generic 422
  reject a malformed body before we can give our own friendly message — read the raw
  JSON, call `parse_batch`, return `IntervalsPreviewResponse` with an item per input
  entry, valid or not. Never calls Intervals.icu.
- `POST /api/intervals/push` — calls `parse_batch` the same way; for each valid item,
  `POST` to Intervals.icu with HTTP Basic auth as above; on non-2xx, especially
  401/403, set `errors: ["Invalid API key or athlete ID"]`; on success set `eventId`
  from the response `id`. Items that failed validation get their existing errors
  carried through untouched (still push whatever *did* validate — don't fail the
  whole batch for one bad entry). Stateless — no credentials stored server-side.

`backend/tests/test_intervals_compiler.py` — the two test vectors above, plus a case
asserting the `distance` meters→`mtr` translation and a case asserting a `target_type`
mismatch (e.g. an `"hr"` workout with a step targeting `"4:45/km Pace"`) is rejected
with a clear per-step message.

## Frontend

```
frontend/src/components/intervals/
  intervalsStorage.ts        # hg:intervalsApiKey / hg:intervalsAthleteId, mirrors hevyStorage.ts exactly
  IntervalsCredentialsForm.tsx
  IntervalsPush.tsx          # main screen
  useIntervalsPush.ts        # state machine: idle -> previewing -> previewed/error -> pushing -> done
  index.ts                   # barrel
```

`IntervalsPush.tsx` is a **single screen**, not a wizard step (this doesn't need
`state/useWizard.ts` — there's no multi-step navigation here, unlike the Garmin sync).
Layout, top to bottom:

1. Credentials — if `intervalsStorage` has no stored Athlete ID/API key, show
   `IntervalsCredentialsForm` (two fields, Save). Once saved, collapse to a one-line
   summary with a "Forget" link, same UX as Hevy's connection line.
2. A textarea for pasting the JSON array, with a "Preview" button.
3. Preview results: for each array index, either the compiled text (in a `<pre>` or
   similar) or its error list. If the top-level payload isn't an array, show one clear
   message above the textarea instead of per-item results — e.g. "Expected a JSON
   array of workouts — wrap a single workout in [ ] too." — and disable Push.
4. "Push" button (enabled once at least one item previewed successfully) — calls
   `/api/intervals/push`, then renders per-item results the same shape as preview but
   with success (✓ + link-free confirmation) or error per item.

Wire into the app the same one-line way as CSV export:

- `components/home/appMode.ts`: add `Intervals = 'INTERVALS'` to `AppModeEnum`.
- `components/home/useAppMode.ts`: add a `showIntervals` callback, same shape as
  `showCsv`.
- `components/home/HomeMenu.tsx`: add a third `TaskCard` — title "Push to
  Intervals.icu", description "Paste a structured run and sync it straight to your
  watch." — calling a new `onPushIntervals` prop.
- `App.tsx`: one new `mode === AppModeEnum.Intervals && <IntervalsPush onBack={showMenu} />`
  branch, and wire `onPushIntervals={showIntervals}` on `HomeMenu`.

## Documentation

- Create `CHANGELOG.md` at repo root if it doesn't exist (it doesn't currently).
  Newest entry first, one dated heading per shipped feature (not per commit):

  ```markdown
  ## 2026-09-10 — Push structured runs to Garmin via Intervals.icu
  Paste a JSON array of running workouts; the app compiles each into Intervals.icu's
  Workout Builder syntax and creates it as a new calendar event via their API, which
  syncs to the watch through the athlete's existing Intervals.icu → Garmin link.
  ```

- `CLAUDE.md`: add an `### Intervals.icu` subsection under "Integration architecture",
  matching the style of the existing Hevy/Garmin subsections — what it does, auth
  (API key, HTTP Basic, stored under `hg:intervalsApiKey`/`hg:intervalsAthleteId`),
  key endpoint, and a "Why plain-text description, not workout_doc" note capturing the
  API fact above so a future session doesn't have to rediscover it.
- `CLAUDE.md`: add a `## Changelog` section right after the existing README-update
  rules, with the same shape: "add a dated entry to `CHANGELOG.md` whenever a feature
  ships" — so this stays self-maintaining for future sessions without being asked.

## Security check (repo is public)

Before finishing, explicitly check:

1. Full `git log --all -p` history (all branches, not just `main`) for hardcoded API
   keys, tokens, private keys, or credentials — not just the current working tree.
2. That the new `intervalsApiKey`/`intervalsAthleteId` never appear in a backend log
   statement, test fixture, or committed file — they must follow the exact same
   client-only, never-persisted-server-side pattern as the existing Hevy key and
   Garmin token.
3. `.gitignore` still correctly excludes `.env` and any local credential files (it
   currently does — don't regress it).

Report what you checked and found, even if the answer is "nothing found" — don't
silently skip this section.

*Optional, mention but don't do unless asked:* a `gitleaks`-based GitHub Action
(one YAML file, runs on every push/PR) would give ongoing automated scanning rather
than a one-time check — worth a one-line suggestion at the end if you think it fits,
not required for this task.

## Out of scope

- No strength/rep-based workouts through this path (Intervals.icu can't structure
  those — that's what the existing Garmin browser-login push is for).
- No upsert/idempotent updates — every push creates a new Intervals.icu event, even
  for a date already pushed. No `external_id`, no bulk endpoint.
- No sports besides `"Run"` for now (design should make adding one later trivial, but
  don't build UI or validation for others yet).
- No changes to the existing Garmin-sync wizard, CSV export, or Hevy connection.

## Acceptance criteria

- Pasting a valid array of 1+ workouts previews compiled text matching the syntax
  cheat-sheet exactly, including the meters→`mtr` translation and ramp prefix.
- Pasting a non-array, an empty array, or a workout with a `target_type` mismatch
  produces a clear, specific error and blocks push for that item without blocking
  others.
- Pushing creates one new Intervals.icu event per valid workout; invalid 401/403
  credentials surface as "Invalid API key or athlete ID", not a raw exception.
- `pytest backend/tests/` and `npm test` (frontend) both pass, including new tests
  for the compiler.
- `CHANGELOG.md` and `CLAUDE.md` are updated as specified above.
- The security check section has been run and its findings reported.
