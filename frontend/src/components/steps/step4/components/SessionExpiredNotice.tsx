interface Props {
  relogging: boolean
  onReconnect: () => void
}

export function SessionExpiredNotice({ relogging, onReconnect }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
      <span>Garmin session expired.</span>
      <button
        onClick={onReconnect}
        disabled={relogging}
        className="shrink-0 rounded-md bg-warning-solid px-3 py-1.5 text-sm font-medium text-warning-solid-fg hover:bg-warning-solid-hover disabled:opacity-60"
      >
        {relogging ? 'Opening browser…' : 'Re-connect Garmin'}
      </button>
    </div>
  )
}
