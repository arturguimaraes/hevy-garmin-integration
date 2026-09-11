import { useCallback, useMemo, useState } from 'react'
import { intervals as intervalsApi } from '@/api'
import type { IntervalsItemResultType } from '@/api'
import type { IntervalsCredsType } from './intervalsStorage'

type PhaseType = 'idle' | 'previewing' | 'previewed' | 'pushing' | 'done'

const BAD_JSON = "That's not valid JSON — check what you pasted."

/**
 * State machine for the paste → preview → push flow:
 * idle → previewing → previewed / error → pushing → done.
 *
 * `error` holds a single top-level message (bad JSON, or a non-array payload the
 * backend rejected); `items` / `results` hold the per-workout outcomes.
 */
export function useIntervalsPush() {
  const [phase, setPhase] = useState<PhaseType>('idle')
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<IntervalsItemResultType[] | null>(null)
  const [results, setResults] = useState<IntervalsItemResultType[] | null>(null)

  const preview = useCallback(async (text: string) => {
    setError(null)
    setItems(null)
    setResults(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setError(BAD_JSON)
      setPhase('idle')
      return
    }

    setPhase('previewing')
    try {
      const res = await intervalsApi.preview(parsed)
      setItems(res.items)
      setPhase('previewed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
      setPhase('idle')
    }
  }, [])

  const push = useCallback(async (creds: IntervalsCredsType, text: string) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setError(BAD_JSON)
      return
    }

    setError(null)
    setPhase('pushing')
    try {
      const res = await intervalsApi.push(creds.athleteId, creds.apiKey, parsed)
      setResults(res.results)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Push failed')
      setPhase('previewed')
    }
  }, [])

  const canPush = useMemo(
    () => !!items && items.some((it) => it.errors.length === 0 && !!it.description),
    [items],
  )

  return { phase, error, items, results, canPush, preview, push }
}
