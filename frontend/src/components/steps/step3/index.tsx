import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType, WizardStateType } from '@/state'
import { WarningTriangleIcon } from '@/components/ui'
import { isGood, type EditTarget } from './mapping'
import { useExerciseMapping } from './useExerciseMapping'
import { Summary } from './components/Summary'
import { RoutineCard } from './components/RoutineCard'
import { MappingModal } from './components/MappingModal'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

export function Step3MapExercises({ state, dispatch, onNext, onBack }: Props) {
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const selectedRoutines = state.routines.filter((r) => state.selectedRoutineIds.includes(r.id))
  const uniqueExercises = [
    ...new Set(selectedRoutines.flatMap((r) => r.exercises.map((e) => e.title))),
  ].sort()

  const { loading, error, candidates, candidatesLoading, loadCandidates } = useExerciseMapping({
    uniqueExercises,
    mappings: state.mappings,
    dispatch,
  })

  function openEditor(rowId: string, hevyName: string) {
    setEditing({ rowId, hevyName })
    loadCandidates(hevyName)
  }

  const resolved = uniqueExercises.filter((name) => name in state.mappings)
  const matched = resolved.filter((name) => isGood(state.mappings[name])).length
  const needReview = resolved.length - matched

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Map exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each Hevy exercise is matched to the closest Garmin equivalent. Click any row to review the
          match and pick a different Garmin exercise.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">Failed to resolve mappings: {error}</p>}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Matching exercises…</div>
      ) : (
        <>
          <Summary total={uniqueExercises.length} matched={matched} needReview={needReview} />

          <div className="space-y-4">
            {selectedRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                mappings={state.mappings}
                open={!collapsed[routine.id]}
                onToggle={() =>
                  setCollapsed((prev) => ({ ...prev, [routine.id]: !prev[routine.id] }))
                }
                editingRowId={editing?.rowId ?? null}
                onEditRow={openEditor}
              />
            ))}
          </div>
        </>
      )}

      <MappingModal
        target={editing}
        current={editing ? state.mappings[editing.hevyName] : undefined}
        suggestions={editing ? candidates[editing.hevyName] : undefined}
        suggestionsLoading={editing ? candidatesLoading === editing.hevyName : false}
        onPick={(mp) => {
          if (editing) {
            dispatch({ type: ActionTypeEnum.MappingUpdated, hevyName: editing.hevyName, mapping: mp })
          }
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${
            needReview > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {needReview > 0 && <WarningTriangleIcon className="h-4 w-4 shrink-0" />}
          Connect Garmin →
        </button>
      </div>
    </div>
  )
}
