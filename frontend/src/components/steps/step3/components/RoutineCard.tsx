import type { ExerciseMappingType, HevyRoutineType } from '@/state'
import { ChevronDownIcon } from '@/components/ui'
import { isGood } from '../mapping'
import { ExerciseRow } from './ExerciseRow'

interface Props {
  routine: HevyRoutineType
  mappings: Record<string, ExerciseMappingType>
  open: boolean
  onToggle: () => void
  editingRowId: string | null
  onEditRow: (rowId: string, hevyName: string) => void
}

/** Collapsible card for one routine. Header + border turn green once every row is resolved. */
export function RoutineCard({ routine, mappings, open, onToggle, editingRowId, onEditRow }: Props) {
  const good = routine.exercises.filter((ex) => isGood(mappings[ex.title])).length
  const bad = routine.exercises.length - good
  const done = bad === 0

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface ${done ? 'border-success-border' : 'border-warning-border'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${open ? 'border-b' : ''} ${
          done ? 'bg-success-bg border-success-border' : 'bg-warning-bg border-warning-border'
        }`}
      >
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-fg-subtle transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="flex-1 text-sm font-semibold text-fg">{routine.title}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-success">{good} ✓</span>
          {bad > 0 && <span className="text-warning">{bad} ⚠</span>}
        </div>
      </button>

      <div className={`divide-y divide-border ${open ? '' : 'hidden'}`}>
        {routine.exercises.map((ex, i) => {
          const rowId = `${routine.id}::${i}`
          return (
            <ExerciseRow
              key={rowId}
              title={ex.title}
              mapping={mappings[ex.title]}
              editing={editingRowId === rowId}
              onClick={() => onEditRow(rowId, ex.title)}
            />
          )
        })}
      </div>
    </div>
  )
}
