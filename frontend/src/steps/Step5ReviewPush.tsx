/**
 * Step 5 — Review and push.
 *
 * Full implementation (per-workout progress, Garmin deep links) in Milestone 5.
 * This skeleton shows the layout and wires up the reset.
 */
import type { WizardAction, WizardState } from '../state/types'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  onBack: () => void
}

export function Step5ReviewPush({ state, dispatch, onBack }: Props) {
  const selectedRoutines = state.routines.filter((r) =>
    state.selectedRoutineIds.includes(r.id),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Review and push</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ready to upload {selectedRoutines.length} workout
          {selectedRoutines.length !== 1 ? 's' : ''} to Garmin Connect.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {selectedRoutines.map((routine) => {
          const result = state.pushResults.find((r) => r.title === routine.title)
          return (
            <div key={routine.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{routine.title}</p>
                <p className="text-xs text-gray-400">
                  {routine.exercises.length} exercise
                  {routine.exercises.length !== 1 ? 's' : ''}
                </p>
              </div>
              {result ? (
                result.error ? (
                  <span className="text-xs text-red-600">✗ {result.error}</span>
                ) : (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Full push UI with live progress and Garmin deep-links coming in Milestone 5.
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
