import { ActionTypeEnum } from '@/state'
import type { HevyRoutineType, WizardActionType } from '@/state'

interface Props {
  routine: HevyRoutineType
  selected: boolean
  expanded: boolean
  onToggleExpand: () => void
  dispatch: React.Dispatch<WizardActionType>
}

export function RoutineItem({ routine, selected, expanded, onToggleExpand, dispatch }: Props) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={`routine-${routine.id}`}
          checked={selected}
          onChange={() => dispatch({ type: ActionTypeEnum.RoutineToggled, id: routine.id })}
          className="rounded border-border-strong accent-accent"
        />
        <label
          htmlFor={`routine-${routine.id}`}
          className="flex-1 cursor-pointer text-sm font-medium text-fg"
        >
          {routine.title}
        </label>
        <span className="text-xs text-fg-subtle">
          {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
        </span>
        <button onClick={onToggleExpand} className="text-xs text-fg-subtle hover:text-fg">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>
      {expanded && (
        <ul className="mt-2 ml-7 space-y-0.5 text-xs text-fg-subtle">
          {routine.exercises.map((ex, i) => (
            <li key={i}>{ex.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
