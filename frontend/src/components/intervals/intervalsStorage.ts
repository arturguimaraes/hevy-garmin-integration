/**
 * Intervals.icu credential persistence.
 *
 * Stored in localStorage under `hg:intervalsAthleteId` / `hg:intervalsApiKey`
 * (same `hg:` prefix as the rest of the app). Mirrors `hevyStorage.ts` — the
 * values never leave the browser except as a per-request body to the local
 * backend, which uses them for a single HTTP Basic call to Intervals.icu.
 */

const ATHLETE_ID_KEY = 'hg:intervalsAthleteId'
const API_KEY_KEY = 'hg:intervalsApiKey'
const SAVED_AT_KEY = 'hg:intervalsSavedAt'

export interface IntervalsCredsType {
  athleteId: string
  apiKey: string
}

export function loadIntervalsCreds(): IntervalsCredsType {
  try {
    return {
      athleteId: localStorage.getItem(ATHLETE_ID_KEY) ?? '',
      apiKey: localStorage.getItem(API_KEY_KEY) ?? '',
    }
  } catch {
    return { athleteId: '', apiKey: '' }
  }
}

export function saveIntervalsCreds({ athleteId, apiKey }: IntervalsCredsType) {
  try {
    if (athleteId) localStorage.setItem(ATHLETE_ID_KEY, athleteId)
    else localStorage.removeItem(ATHLETE_ID_KEY)
    if (apiKey) localStorage.setItem(API_KEY_KEY, apiKey)
    else localStorage.removeItem(API_KEY_KEY)

    if (athleteId || apiKey) localStorage.setItem(SAVED_AT_KEY, new Date().toISOString())
    else localStorage.removeItem(SAVED_AT_KEY)
  } catch {
    // Storage disabled (private mode) — the credentials just won't persist.
  }
}

export function loadIntervalsSavedAt(): string | null {
  try {
    return localStorage.getItem(SAVED_AT_KEY)
  } catch {
    return null
  }
}
