import type { PushResultType } from '@/state'

interface Props {
  name: string
  date: string
  result: PushResultType | undefined
  pushing: boolean
  exerciseCount: number
  onNameChange: (value: string) => void
  onDateChange: (value: string) => void
}

export function WorkoutRow({
  name,
  date,
  result,
  pushing,
  exerciseCount,
  onNameChange,
  onDateChange,
}: Props) {
  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {result ? (
          <span className="truncate text-sm font-medium text-gray-900">{name}</span>
        ) : (
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={pushing}
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
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
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
