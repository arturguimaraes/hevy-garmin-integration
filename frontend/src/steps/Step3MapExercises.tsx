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

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-600 mx-auto">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-500 mx-auto">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export function Step3MapExercises({ state, dispatch, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const selectedRoutines = state.routines.filter((r) =>
    state.selectedRoutineIds.includes(r.id),
  )

  const uniqueExercises = [
    ...new Set(selectedRoutines.flatMap((r) => r.exercises.map((e) => e.title))),
  ].sort()

  // Build exercise → routine titles map (an exercise can appear in multiple routines)
  const exerciseRoutines: Record<string, string[]> = {}
  for (const routine of selectedRoutines) {
    for (const ex of routine.exercises) {
      if (!exerciseRoutines[ex.title]) exerciseRoutines[ex.title] = []
      if (!exerciseRoutines[ex.title].includes(routine.title)) {
        exerciseRoutines[ex.title].push(routine.title)
      }
    }
  }

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

  const resolved = uniqueExercises.filter((name) => name in state.mappings)
  const goodCount = resolved.filter((name) => state.mappings[name].score >= GOOD_MATCH_THRESHOLD).length
  const badCount = resolved.length - goodCount

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Map exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each Hevy exercise is matched to the closest Garmin equivalent.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">Failed to resolve mappings: {error}</p>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Matching exercises…</div>
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-600">Total exercises</span>
              <span className="text-sm font-semibold text-gray-900">{uniqueExercises.length}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-green-50">
              <span className="flex items-center gap-2 text-sm text-green-800">
                <CheckIcon />
                Matched automatically
              </span>
              <span className="text-sm font-semibold text-green-800">{goodCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-red-50">
              <span className="flex items-center gap-2 text-sm text-red-700">
                <XIcon />
                May need review
              </span>
              <span className="text-sm font-semibold text-red-700">{badCount}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-sm text-blue-600 underline"
          >
            {showDetails ? 'Hide details ↑' : 'Show details ↓'}
          </button>

          {/* Detail table */}
          {showDetails && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Hevy</th>
                    <th className="px-2 py-2 text-gray-400 w-6">→</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Garmin</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Workout</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {uniqueExercises.map((name) => {
                    const m = state.mappings[name]
                    const good = m !== undefined && m.score >= GOOD_MATCH_THRESHOLD
                    return (
                      <tr key={name} className={good ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="px-4 py-2.5 text-gray-900">{name}</td>
                        <td className="px-2 py-2.5 text-gray-400 text-center">→</td>
                        <td className="px-4 py-2.5 text-gray-700">
                          {m
                            ? m.garminDisplayName
                            : <span className="italic text-gray-400">resolving…</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {(exerciseRoutines[name] ?? []).join(', ')}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {m && (good ? <CheckIcon /> : <XIcon />)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
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
