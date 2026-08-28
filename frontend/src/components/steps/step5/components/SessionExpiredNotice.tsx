interface Props {
  relogging: boolean
  onReconnect: () => void
}

export function SessionExpiredNotice({ relogging, onReconnect }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>Garmin session expired.</span>
      <button
        onClick={onReconnect}
        disabled={relogging}
        className="shrink-0 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {relogging ? 'Opening browser…' : 'Re-connect Garmin'}
      </button>
    </div>
  )
}
