/**
 * Step 3 — Exercise mapping.
 *
 * The full implementation lands in Milestone 3. This skeleton shows the
 * structure and wires up the navigation.
 */
import type { WizardAction, WizardState } from '../state/types'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}

export function Step3MapExercises({ state, dispatch: _dispatch, onNext, onBack }: Props) {
  const selectedRoutines = state.routines.filter((r) =>
    state.selectedRoutineIds.includes(r.id),
  )

  const uniqueExercises = [
    ...new Set(selectedRoutines.flatMap((r) => r.exercises.map((e) => e.title))),
  ].sort()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Map exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each exercise is matched to a Garmin category and name. The{' '}
          <strong>category</strong> is what Garmin tracks for per-muscle volume — the
          name is cosmetic. Review every row before continuing.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Full matching UI coming in Milestone 3. Found{' '}
        <strong>{uniqueExercises.length}</strong> unique exercise
        {uniqueExercises.length !== 1 ? 's' : ''} across{' '}
        {selectedRoutines.length} routine
        {selectedRoutines.length !== 1 ? 's' : ''}:
        <ul className="mt-2 list-disc list-inside space-y-0.5 text-amber-700">
          {uniqueExercises.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Connect Garmin →
        </button>
      </div>
    </div>
  )
}
