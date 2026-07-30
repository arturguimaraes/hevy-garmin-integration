import { useEffect, useState } from 'react'
import { ActionTypeEnum, MappingSourceEnum } from '../state/enums'
import type { ExerciseMappingType, WizardActionType, WizardStateType } from '../state/types'
import { mapping } from '../api/client'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

const GOOD_MATCH_THRESHOLD = 0.5

export function Step3MapExercises({ state, dispatch, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedRoutines = state.routines.filter((r) =>
    state.selectedRoutineIds.includes(r.id),
  )

  const uniqueExercises = [
    ...new Set(selectedRoutines.flatMap((r) => r.exercises.map((e) => e.title))),
  ].sort()

  useEffect(() => {
    const unmapped = uniqueExercises.filter((name) => !(name in state.mappings))
    if (unmapped.length === 0) return

    setLoading(true)
    setError(null)
    mapping
      .resolve(unmapped)
      .then(({ matches }) => {
        const bulk: Record<string, ExerciseMappingType> = {}
        for (const { hevyName, top } of matches) {
          if (top.length > 0) {
            bulk[hevyName] = {
              hevyName,
              garminCategory: top[0].category,
              garminExercise: top[0].exercise,
              garminDisplayName: top[0].name,
              score: top[0].score,
              source: MappingSourceEnum.Auto,
            }
          }
        }
        dispatch({ type: ActionTypeEnum.MappingsBulkLoaded, mappings: bulk })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [uniqueExercises.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Map exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each Hevy exercise is matched to the closest Garmin equivalent.{' '}
          <span className="text-green-600 font-medium">✓</span> means a confident
          match; <span className="text-red-500 font-medium">✗</span> means the match
          may need review.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">Failed to resolve mappings: {error}</p>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Matching exercises…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Hevy</th>
                <th className="px-2 py-2 text-gray-400 w-6">→</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Garmin</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {uniqueExercises.map((name) => {
                const m = state.mappings[name]
                const good = m !== undefined && m.score >= GOOD_MATCH_THRESHOLD
                return (
                  <tr key={name}>
                    <td className="px-4 py-2.5 text-gray-900">{name}</td>
                    <td className="px-2 py-2.5 text-gray-400 text-center">→</td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {m
                        ? m.garminDisplayName
                        : <span className="text-gray-400 italic">resolving…</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {m && (good ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500 mx-auto">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-400 mx-auto">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect Garmin →
        </button>
      </div>
    </div>
  )
}
