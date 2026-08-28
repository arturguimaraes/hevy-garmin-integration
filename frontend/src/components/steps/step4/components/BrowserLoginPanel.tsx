interface Props {
  loading: boolean
  error: string | null
  onLogin: () => void
}

export function BrowserLoginPanel({ loading, error, onLogin }: Props) {
  return (
    <>
      {loading ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
          <p className="font-medium">Browser window open</p>
          <p className="mt-1 text-blue-700">
            Log in to Garmin Connect in the browser that opened on your desktop.
            Use the copy buttons above to paste your credentials.
            This page will update automatically when you're done.
          </p>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Open Garmin browser →
        </button>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </>
  )
}
