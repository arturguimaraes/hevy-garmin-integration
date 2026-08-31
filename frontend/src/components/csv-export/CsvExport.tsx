import { useState } from 'react'
import { DownloadIcon } from '@/components/ui'
import { HistoryRangeEnum, RANGE_OPTIONS } from './range'
import { useCsvExport } from './useCsvExport'

interface Props {
  onBack: () => void
}

export function CsvExport({ onBack }: Props) {
  const [includeHistory, setIncludeHistory] = useState(true)
  const [includeRoutines, setIncludeRoutines] = useState(false)
  const [range, setRange] = useState<HistoryRangeEnum>(HistoryRangeEnum.All)

  const { exporting, preparing, error, done, run } = useCsvExport()
  const nothingSelected = !includeHistory && !includeRoutines

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">Export to CSV</h2>
        <p className="mt-1 text-sm text-fg-subtle">
          Download your Hevy data as CSV — one row per set, with ISO dates and a
          precomputed <code>volume_kg</code> column. Built to drop straight into a
          Claude project.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 accent-accent"
            checked={includeHistory}
            onChange={(e) => setIncludeHistory(e.target.checked)}
          />
          <span>
            <span className="block font-medium text-fg">Workout history</span>
            <span className="block text-fg-subtle">
              Every logged session — exercises, sets, reps, weights, RPE.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 accent-accent"
            checked={includeRoutines}
            onChange={(e) => setIncludeRoutines(e.target.checked)}
          />
          <span>
            <span className="block font-medium text-fg">Routines</span>
            <span className="block text-fg-subtle">
              Your routine templates — planned exercises, sets and targets.
            </span>
          </span>
        </label>

        <div className="border-t border-border pt-4">
          <label htmlFor="csv-range" className="block text-sm font-medium text-fg-muted">
            History range
          </label>
          <select
            id="csv-range"
            value={range}
            disabled={!includeHistory}
            onChange={(e) => setRange(e.target.value as HistoryRangeEnum)}
            className="mt-1 block rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {exporting && preparing && (
        <p className="py-2 text-center text-sm text-fg-subtle">Preparing {preparing}…</p>
      )}

      {error && <p className="text-sm text-danger">Export failed: {error}</p>}

      {done.length > 0 && !exporting && (
        <p className="text-sm text-success">
          Downloaded {done.join(' and ')}.
        </p>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-fg-muted underline">
          ← Menu
        </button>
        <button
          onClick={() => run({ includeHistory, includeRoutines, range })}
          disabled={nothingSelected || exporting}
          className="flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <DownloadIcon className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </div>
  )
}
