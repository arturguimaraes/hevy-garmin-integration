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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-green-600">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-amber-500">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

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
          {/* Global summary */}
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">{uniqueExercises.length} exercises</span>
            <span className="text-green-700">{goodCount} matched</span>
            {badCount > 0 && (
              <span className="text-amber-600">{badCount} need review</span>
            )}
          </div>

          {/* Per-routine cards */}
          <div className="space-y-4">
            {selectedRoutines.map((routine) => {
              const routineGood = routine.exercises.filter(
                (ex) => state.mappings[ex.title]?.score >= GOOD_MATCH_THRESHOLD,
              ).length
              const routineBad = routine.exercises.length - routineGood

              return (
                <div key={routine.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-900">{routine.title}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-700">{routineGood} ✓</span>
                      {routineBad > 0 && (
                        <span className="text-amber-600">{routineBad} ⚠</span>
                      )}
                    </div>
                  </div>

                  {/* Exercise rows */}
                  <div className="divide-y divide-gray-100">
                    {routine.exercises.map((ex) => {
                      const m = state.mappings[ex.title]
                      const good = m !== undefined && m.score >= GOOD_MATCH_THRESHOLD
                      return (
                        <div key={ex.title} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="shrink-0">
                            {m ? (good ? <CheckIcon /> : <XIcon />) : (
                              <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
                            )}
                          </div>
                          <span className="text-sm text-gray-700 min-w-0 truncate flex-1">
                            {ex.title}
                          </span>
                          <span className="text-gray-400 text-sm shrink-0">→</span>
                          <span className={`text-sm min-w-0 truncate flex-1 text-right ${good ? 'text-gray-700' : m ? 'text-amber-700' : 'text-gray-400 italic'}`}>
                            {m ? m.garminDisplayName : 'resolving…'}
                          </span>
                          {m && (
                            <span className="shrink-0 rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 font-mono">
                              {m.garminCategory}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
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
