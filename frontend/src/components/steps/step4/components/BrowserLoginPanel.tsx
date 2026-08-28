interface Props {
  loading: boolean
  error: string | null
  onLogin: () => void
}

export function BrowserLoginPanel({ loading, error, onLogin }: Props) {
  return (
    <>
      {loading ? (
        <div className="rounded-lg border border-accent-border bg-accent-muted px-4 py-4 text-sm text-accent-text">
          <p className="font-medium">Browser window open</p>
          <p className="mt-1">
            Log in to Garmin Connect in the browser that opened on your desktop.
            Use the copy buttons above to paste your credentials.
            This page will update automatically when you're done.
          </p>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover"
        >
          Open Garmin browser →
        </button>
      )}

      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
    </>
  )
}
