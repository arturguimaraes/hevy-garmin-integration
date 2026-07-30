import { useEffect, useState } from 'react'
import { ActionTypeEnum } from '../state/enums'
import type { WizardActionType, WizardStateType } from '../state/types'
import { hevy } from '../api/client'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

export function Step2ChooseRoutines({ state, dispatch, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (state.routines.length > 0) return
    setLoading(true)
    setError(null)
    hevy
      .routines(state.hevyApiKey)
      .then((res) => dispatch({ type: ActionTypeEnum.RoutinesLoaded, routines: res.routines }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected =
    state.routines.length > 0 &&
    state.routines.every((r) => state.selectedRoutineIds.includes(r.id))

  if (loading)
    return (
      <div className="py-16 text-center text-sm text-gray-500">Loading routines…</div>
    )

  if (error)
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Failed to load routines: {error}</p>
        <button
          onClick={onBack}
          className="text-sm text-gray-600 underline"
        >
          ← Back
        </button>
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Choose routines</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select the routines to sync. Exercises are deduplicated across routines
          at the mapping step.
        </p>
      </div>

      {state.routines.length === 0 ? (
        <p className="text-sm text-gray-500">No routines found in your Hevy account.</p>
      ) : (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) =>
                dispatch({ type: ActionTypeEnum.AllRoutinesToggled, selected: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600"
            />
            Select all ({state.routines.length})
          </label>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {state.routines.map((routine) => {
              const selected = state.selectedRoutineIds.includes(routine.id)
              const isExpanded = expanded === routine.id
              return (
                <div key={routine.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`routine-${routine.id}`}
                      checked={selected}
                      onChange={() =>
                        dispatch({ type: ActionTypeEnum.RoutineToggled, id: routine.id })
                      }
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <label
                      htmlFor={`routine-${routine.id}`}
                      className="flex-1 cursor-pointer text-sm font-medium text-gray-900"
                    >
                      {routine.title}
                    </label>
                    <span className="text-xs text-gray-400">
                      {routine.exercises.length} exercise
                      {routine.exercises.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : routine.id)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      {isExpanded ? 'Hide' : 'Preview'}
                    </button>
                  </div>
                  {isExpanded && (
                    <ul className="mt-2 ml-7 space-y-0.5 text-xs text-gray-500">
                      {routine.exercises.map((ex, i) => (
                        <li key={i}>{ex.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={state.selectedRoutineIds.length === 0}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Map exercises →
        </button>
      </div>
    </div>
  )
}
