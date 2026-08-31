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
          <span className="truncate text-sm font-medium text-fg">{name}</span>
        ) : (
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={pushing}
            className="min-w-0 flex-1 rounded border border-border-strong bg-surface px-2 py-1 text-sm font-medium text-fg focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-surface-muted disabled:text-fg-subtle"
          />
        )}
        <div className="shrink-0">
          {result ? (
            result.error ? (
              <span className="text-xs text-danger">✗ {result.error}</span>
            ) : (
              <span className="text-xs text-success">
                ✓ Uploaded{result.scheduledDate ? ` · ${result.scheduledDate}` : ''}
              </span>
            )
          ) : pushing ? (
            <span className="text-xs text-fg-subtle">Uploading…</span>
          ) : (
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded border border-border-strong bg-surface px-2 py-1 text-sm text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          )}
        </div>
      </div>
      <p className="text-xs text-fg-subtle">
        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
