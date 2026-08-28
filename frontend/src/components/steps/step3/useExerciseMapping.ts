import { useEffect, useState } from 'react'
import { ActionTypeEnum, MappingSourceEnum } from '@/state'
import type { ExerciseMappingType, MatchCandidateType, WizardActionType } from '@/state'
import { mapping } from '@/api'
import { candidateToMapping } from './mapping'

interface Params {
  uniqueExercises: string[]
  mappings: Record<string, ExerciseMappingType>
  dispatch: React.Dispatch<WizardActionType>
}

/**
 * Resolves every not-yet-mapped exercise against Garmin's catalog on mount,
 * seeding auto-mappings, and exposes lazy per-exercise candidate lookup for
 * the edit modal.
 */
export function useExerciseMapping({ uniqueExercises, mappings, dispatch }: Params) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Record<string, MatchCandidateType[]>>({})
  const [candidatesLoading, setCandidatesLoading] = useState<string | null>(null)

  useEffect(() => {
    const unmapped = uniqueExercises.filter((name) => !(name in mappings))
    if (unmapped.length === 0) return

    setLoading(true)
    setError(null)
    mapping
      .resolve(unmapped)
      .then(({ matches }) => {
        const bulk: Record<string, ExerciseMappingType> = {}
        const cand: Record<string, MatchCandidateType[]> = {}
        for (const { hevyName, top } of matches) {
          cand[hevyName] = top
          if (top.length > 0) {
            bulk[hevyName] = candidateToMapping(hevyName, top[0], MappingSourceEnum.Auto)
          }
        }
        setCandidates((prev) => ({ ...prev, ...cand }))
        dispatch({ type: ActionTypeEnum.MappingsBulkLoaded, mappings: bulk })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [uniqueExercises.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Fetch the candidate list for a single exercise, unless already cached. */
  function loadCandidates(name: string) {
    if (name in candidates) return
    setCandidatesLoading(name)
    mapping
      .resolve([name])
      .then(({ matches }) => {
        setCandidates((prev) => ({ ...prev, [name]: matches[0]?.top ?? [] }))
      })
      .catch(() => setCandidates((prev) => ({ ...prev, [name]: [] })))
      .finally(() => setCandidatesLoading((cur) => (cur === name ? null : cur)))
  }

  return { loading, error, candidates, candidatesLoading, loadCandidates }
}
