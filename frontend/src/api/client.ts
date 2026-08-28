/**
 * Typed fetch client for the backend API.
 *
 * Credentials (the Hevy API key, the Garmin token) are passed by the caller
 * per-request and never stored here.
 */

import type { HevyRoutineType, MatchCandidateType, PushResultType } from '@/state'

const BASE = '/api'

async function request<T>(
  method: string,
  path: string,
  opts: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export interface CsvDownloadType {
  blob: Blob
  filename: string
  /** Row count (excluding the header) from the X-Row-Count header, if present. */
  rowCount: number | null
}

/** Fetches a file response, surfacing backend `{ detail }` errors like `request`. */
async function requestBlob(
  path: string,
  headers: Record<string, string>,
): Promise<CsvDownloadType> {
  const res = await fetch(`${BASE}${path}`, { headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? `${res.status} ${res.statusText}`)
  }
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^"]+)"?/.exec(disposition)
  const rowCount = res.headers.get('X-Row-Count')
  return {
    blob: await res.blob(),
    filename: match?.[1] ?? 'export.csv',
    rowCount: rowCount != null ? Number(rowCount) : null,
  }
}

// ── Hevy ──────────────────────────────────────────────────────────────────────

export const hevy = {
  validate(apiKey: string): Promise<{ ok: boolean; username: string | null }> {
    return request('POST', '/hevy/validate', { body: { apiKey } })
  },

  routines(apiKey: string): Promise<{ routines: HevyRoutineType[] }> {
    return request('GET', '/hevy/routines', { headers: { 'X-Hevy-Key': apiKey } })
  },
}

// ── Export ────────────────────────────────────────────────────────────────────

export const exportApi = {
  workouts(apiKey: string, since: string | null): Promise<CsvDownloadType> {
    const q = since ? `?since=${encodeURIComponent(since)}` : ''
    return requestBlob(`/export/workouts.csv${q}`, { 'X-Hevy-Key': apiKey })
  },

  routines(apiKey: string): Promise<CsvDownloadType> {
    return requestBlob('/export/routines.csv', { 'X-Hevy-Key': apiKey })
  },
}

// ── Mapping ───────────────────────────────────────────────────────────────────

export interface ResolveMatchType {
  hevyName: string
  top: MatchCandidateType[]
}

export const mapping = {
  resolve(exerciseNames: string[]): Promise<{ matches: ResolveMatchType[] }> {
    return request('POST', '/mapping/resolve', { body: { exerciseNames } })
  },

  search(q: string): Promise<{ entries: { name: string; category: string; exercise: string }[] }> {
    return request('GET', `/mapping/search?q=${encodeURIComponent(q)}`)
  },
}

// ── Garmin ────────────────────────────────────────────────────────────────────

export interface WorkoutExercisePayloadType {
  hevyName: string
  garminCategory: string
  garminExercise: string
  sets: number
  reps: number
  weightKg: number | null
  restSeconds: number
  timed: boolean
}

export interface WorkoutPayloadType {
  title: string
  date: string | null
  exercises: WorkoutExercisePayloadType[]
}

export const garmin = {
  validateToken(garminToken: string): Promise<{ valid: boolean }> {
    return request('POST', '/garmin/validate-token', { body: { garminToken } })
  },

  browserLogin(): Promise<{ token: string }> {
    return request('POST', '/garmin/browser-login')
  },

  push(
    garminToken: string,
    workouts: WorkoutPayloadType[],
  ): Promise<{ results: PushResultType[] }> {
    return request('POST', '/garmin/push', { body: { garminToken, workouts } })
  },
}
