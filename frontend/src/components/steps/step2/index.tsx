import type { WizardActionType, WizardStateType } from '@/state'
import { useRoutines } from './useRoutines'
import { RoutineList } from './components/RoutineList'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

export function Step2ChooseRoutines({ state, dispatch, onNext, onBack }: Props) {
  const { loading, error } = useRoutines(state.hevyApiKey, state.routines.length > 0, dispatch)

  if (loading) {
    return <div className="py-16 text-center text-sm text-fg-subtle">Loading routines…</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger">Failed to load routines: {error}</p>
        <button onClick={onBack} className="text-sm text-fg-muted underline">
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">Choose routines</h2>
        <p className="mt-1 text-sm text-fg-subtle">
          Select the routines to sync. Exercises are deduplicated across routines
          at the mapping step.
        </p>
      </div>

      {state.routines.length === 0 ? (
        <p className="text-sm text-fg-subtle">No routines found in your Hevy account.</p>
      ) : (
        <RoutineList
          routines={state.routines}
          selectedIds={state.selectedRoutineIds}
          dispatch={dispatch}
        />
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-fg-muted underline">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={state.selectedRoutineIds.length === 0}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Map exercises →
        </button>
      </div>
    </div>
  )
}
