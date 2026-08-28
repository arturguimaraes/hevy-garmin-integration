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
          className="rounded border-gray-300 text-blue-600"
        />
        <label
          htmlFor={`routine-${routine.id}`}
          className="flex-1 cursor-pointer text-sm font-medium text-gray-900"
        >
          {routine.title}
        </label>
        <span className="text-xs text-gray-400">
          {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
        </span>
        <button onClick={onToggleExpand} className="text-xs text-gray-400 hover:text-gray-700">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>
      {expanded && (
        <ul className="mt-2 ml-7 space-y-0.5 text-xs text-gray-500">
          {routine.exercises.map((ex, i) => (
            <li key={i}>{ex.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
