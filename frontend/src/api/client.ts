/**
 * Typed fetch client for the backend API.
 *
 * Credentials (hevyApiKey, garminToken) are passed by the caller per-request
 * and never stored here — they live only in wizard state.
 */

import type { ExerciseMapping, HevyRoutine, MatchCandidate, PushResult } from '../state/types'

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

// ── Hevy ──────────────────────────────────────────────────────────────────────

export const hevy = {
  validate(apiKey: string): Promise<{ ok: boolean; username: string | null }> {
    return request('POST', '/hevy/validate', { body: { apiKey } })
  },

  routines(apiKey: string): Promise<{ routines: HevyRoutine[] }> {
    return request('GET', '/hevy/routines', { headers: { 'X-Hevy-Key': apiKey } })
  },
}

// ── Mapping ───────────────────────────────────────────────────────────────────

export interface ResolveMatch {
  hevyName: string
  top: MatchCandidate[]
}

export const mapping = {
  resolve(exerciseNames: string[]): Promise<{ matches: ResolveMatch[] }> {
    return request('POST', '/mapping/resolve', { body: { exerciseNames } })
  },

  search(q: string): Promise<{ entries: { name: string; category: string; exercise: string }[] }> {
    return request('GET', `/mapping/search?q=${encodeURIComponent(q)}`)
  },
}

// ── Garmin ────────────────────────────────────────────────────────────────────

export interface GarminLoginResponse {
  status: 'ok' | 'mfa_required'
  sessionId?: string
  token?: string
}

export interface GarminMfaResponse {
  status: 'ok'
  token: string
}

export interface WorkoutExercisePayload {
  hevyName: string
  garminCategory: string
  garminExercise: string
  sets: number
  reps: number
  weightKg: number | null
  restSeconds: number
  timed: boolean
}

export interface WorkoutPayload {
  title: string
  exercises: WorkoutExercisePayload[]
}

export const garmin = {
  login(email: string, password: string): Promise<GarminLoginResponse> {
    return request('POST', '/garmin/login', { body: { email, password } })
  },

  mfa(sessionId: string, code: string): Promise<GarminMfaResponse> {
    return request('POST', '/garmin/mfa', { body: { sessionId, code } })
  },

  push(
    garminToken: string,
    workouts: WorkoutPayload[],
  ): Promise<{ results: PushResult[] }> {
    return request('POST', '/garmin/push', { body: { garminToken, workouts } })
  },
}

// Re-export mapping helper used in Step 3
export function buildMappingFromCandidate(
  hevyName: string,
  candidate: MatchCandidate,
): ExerciseMapping {
  return {
    hevyName,
    garminCategory: candidate.category,
    garminExercise: candidate.exercise,
    garminDisplayName: candidate.name,
    score: candidate.score,
    source: 'auto',
  }
}
