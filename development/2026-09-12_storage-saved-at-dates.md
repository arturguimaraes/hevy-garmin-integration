# Add "saved on" dates to Garmin and Intervals.icu credentials

**Date:** 2026-09-12
**Scope:** only this. No storage redesign, no touching Hevy's working implementation.

## Why

`hevyStorage.ts` already tracks this: a companion `hg:hevyApiKeySavedAt` key, read via
`loadHevyKeySavedAt()`, rendered in `HevyKeyControl.tsx` via a local `formatSavedAt()`
helper. Garmin and Intervals don't have this yet. Extend the same pattern to both —
keep separate localStorage keys (don't consolidate into objects).

## 1. Shared date formatter

Extract `formatSavedAt` out of `HevyKeyControl.tsx` into `frontend/src/lib/formatDate.ts`
(new file), export it, and update `HevyKeyControl.tsx` to import it from there instead
of defining it locally. This is the only change to Hevy — no other Hevy file touches.

## 2. Garmin (`frontend/src/state/storage.ts`)

- Add a `hg:garminSavedAt` key.
- In `saveCred`, whenever a non-empty value is set, also write the current
  ISO timestamp to `hg:garminSavedAt` (one shared timestamp, bumped on any of
  email/password/token — not per-field). No special handling needed on removal.
- Add `loadGarminSavedAt(): string | null`, mirroring `loadHevyKeySavedAt()`.

Wire it into `frontend/src/components/steps/step3/components/AuthenticatedNotice.tsx`:
add a `savedAt: string | null` prop, and render a line under "✓ Authenticated with
Garmin Connect" using the shared `formatSavedAt` — same phrasing as Hevy's
`"Saved on this device {date}."`. Pass `savedAt` down from wherever `AuthenticatedNotice`
is currently mounted (`step3/index.tsx`), sourced from `loadGarminSavedAt()`.

## 3. Intervals.icu (`frontend/src/components/intervals/intervalsStorage.ts`)

- Add a `hg:intervalsSavedAt` key.
- In `saveIntervalsCreds`, write the current ISO timestamp to it whenever either
  field is set; remove it when both `athleteId` and `apiKey` end up empty (mirrors
  how `saveHevyKey('')` removes its companion key).
- Add `loadIntervalsSavedAt(): string | null`.

Wire it into `IntervalsPush.tsx`: the existing line `Connected to Intervals.icu as
<athleteId>. Forget` gets the saved date appended, same phrasing pattern as Hevy,
using the shared `formatSavedAt`.

## Out of scope

- No change to Hevy's storage shape or behavior — only its formatter moves.
- No per-field timestamps (e.g. Garmin token vs. password saved separately).
- No changes to CHANGELOG.md/README/CLAUDE.md structure beyond what's already
  required by CLAUDE.md's own update rules for this kind of change (add a one-line
  Changelog entry; no Integration architecture changes needed, since auth/endpoints
  are unchanged).

## Acceptance criteria

- Saving Garmin credentials (via browser login) and Intervals credentials each show
  a "Saved on this device {date}" line, styled and worded like Hevy's.
- `formatSavedAt` exists in exactly one place and all three features use it.
- `npm test` still passes.
