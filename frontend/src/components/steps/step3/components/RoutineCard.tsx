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
      className={`overflow-hidden rounded-lg border bg-white ${done ? 'border-green-300' : 'border-amber-300'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${open ? 'border-b' : ''} ${
          done ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}
      >
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="flex-1 text-sm font-semibold text-gray-900">{routine.title}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-700">{good} ✓</span>
          {bad > 0 && <span className="text-amber-700">{bad} ⚠</span>}
        </div>
      </button>

      <div className={`divide-y divide-gray-100 ${open ? '' : 'hidden'}`}>
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
