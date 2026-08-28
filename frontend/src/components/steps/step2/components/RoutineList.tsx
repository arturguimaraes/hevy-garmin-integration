import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { HevyRoutineType, WizardActionType } from '@/state'
import { RoutineItem } from './RoutineItem'

interface Props {
  routines: HevyRoutineType[]
  selectedIds: string[]
  dispatch: React.Dispatch<WizardActionType>
}

export function RoutineList({ routines, selectedIds, dispatch }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const allSelected = routines.length > 0 && routines.every((r) => selectedIds.includes(r.id))

  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) =>
            dispatch({ type: ActionTypeEnum.AllRoutinesToggled, selected: e.target.checked })
          }
          className="rounded border-gray-300 text-blue-600"
        />
        Select all ({routines.length})
      </label>

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {routines.map((routine) => (
          <RoutineItem
            key={routine.id}
            routine={routine}
            selected={selectedIds.includes(routine.id)}
            expanded={expanded === routine.id}
            onToggleExpand={() => setExpanded(expanded === routine.id ? null : routine.id)}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  )
}
