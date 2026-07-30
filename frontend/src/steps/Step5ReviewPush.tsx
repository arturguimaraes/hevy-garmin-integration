import { useState } from 'react'
import { garmin } from '../api/client'
import { ActionTypeEnum } from '../state/enums'
import type { ExerciseMappingType, HevyRoutineType, WizardActionType, WizardStateType } from '../state/types'
import type { WorkoutExercisePayloadType } from '../api/client'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onBack: () => void
}

function buildExercises(
  routine: HevyRoutineType,
  mappings: Record<string, ExerciseMappingType>,
): WorkoutExercisePayloadType[] {
  return routine.exercises
    .filter((ex) => mappings[ex.title])
    .map((ex) => {
      const mapping = mappings[ex.title]
      const allSets = ex.sets
      const workSets = allSets.filter((s) => s.type !== 'warmup')
      const activeSets = workSets.length > 0 ? workSets : allSets

      const weighted = activeSets.filter((s) => s.weight_kg != null && s.weight_kg > 0)
      const top =
        weighted.length > 0
          ? weighted.reduce((a, b) => (a.weight_kg! > b.weight_kg! ? a : b))
          : null
      const repCounts = activeSets.map((s) => s.reps).filter((r): r is number => r != null)
      const hasDuration = activeSets.some((s) => s.duration_seconds != null)

      return {
        hevyName: ex.title,
        garminCategory: mapping.garminCategory,
        garminExercise: mapping.garminExercise,
        sets: activeSets.length || 1,
        reps: top?.reps ?? (repCounts.length > 0 ? Math.max(...repCounts) : 10),
        weightKg: top ? Math.round(top.weight_kg! * 10) / 10 : null,
        restSeconds: ex.rest_seconds ?? 90,
        timed: hasDuration && repCounts.length === 0,
      }
    })
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export function Step5ReviewPush({ state, dispatch, onBack }: Props) {
  const selectedRoutines = state.routines.filter((r) =>
    state.selectedRoutineIds.includes(r.id),
  )

  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(selectedRoutines.map((r) => [r.id, r.title])),
  )
  const [dates, setDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(selectedRoutines.map((r) => [r.id, todayIso()])),
  )
  const [pushing, setPushing] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  const hasPushResults = state.pushResults.length > 0
  const allDone =
    hasPushResults &&
    selectedRoutines.every((r) => state.pushResults.some((p) => p.title === r.title))

  async function handlePush() {
    setPushing(true)
    setPushError(null)
    dispatch({ type: ActionTypeEnum.PushResultsCleared })

    try {
      const workouts = selectedRoutines.map((routine) => ({
        title: (names[routine.id] ?? routine.title).trim() || routine.title,
        date: dates[routine.id] ?? todayIso(),
        exercises: buildExercises(routine, state.mappings),
      }))
      const { results } = await garmin.push(state.garminToken!, workouts)
      for (const result of results) {
        dispatch({ type: ActionTypeEnum.PushResultAdded, result })
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Push failed')
    } finally {
      setPushing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Review and push</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pick a date for each workout, then push all {selectedRoutines.length} to Garmin Connect.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {selectedRoutines.map((routine) => {
          const result = state.pushResults.find((r) => r.title === routine.title)
          return (
            <div key={routine.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                {result ? (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {names[routine.id] ?? routine.title}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={names[routine.id] ?? routine.title}
                    onChange={(e) =>
                      setNames((prev) => ({ ...prev, [routine.id]: e.target.value }))
                    }
                    disabled={pushing}
                    className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                )}
                <div className="shrink-0">
                  {result ? (
                    result.error ? (
                      <span className="text-xs text-red-600">✗ {result.error}</span>
                    ) : (
                      <span className="text-xs text-green-600">
                        ✓ Uploaded{result.scheduledDate ? ` · ${result.scheduledDate}` : ''}
                      </span>
                    )
                  ) : pushing ? (
                    <span className="text-xs text-gray-500">Uploading…</span>
                  ) : (
                    <input
                      type="date"
                      value={dates[routine.id] ?? todayIso()}
                      onChange={(e) =>
                        setDates((prev) => ({ ...prev, [routine.id]: e.target.value }))
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {routine.exercises.length} exercise
                {routine.exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
          )
        })}
      </div>

      {pushError && (
        <p className="text-sm text-red-600">{pushError}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={pushing}
          className="text-sm text-gray-600 underline disabled:opacity-50"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          {allDone && (
            <button
              onClick={() => dispatch({ type: ActionTypeEnum.Reset })}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Start over
            </button>
          )}
          <button
            onClick={handlePush}
            disabled={pushing}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pushing ? 'Pushing…' : allDone ? 'Push again' : 'Push to Garmin'}
          </button>
        </div>
      </div>
    </div>
  )
}
