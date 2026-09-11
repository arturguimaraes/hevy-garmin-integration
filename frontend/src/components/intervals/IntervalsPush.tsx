import { useState } from 'react'
import type { IntervalsItemResultType } from '@/api'
import { IntervalsCredentialsForm } from './IntervalsCredentialsForm'
import { loadIntervalsCreds, saveIntervalsCreds } from './intervalsStorage'
import type { IntervalsCredsType } from './intervalsStorage'
import { useIntervalsPush } from './useIntervalsPush'

interface Props {
  onBack: () => void
}

const PLACEHOLDER = `[
  {
    "name": "Easy Run",
    "sport": "Run",
    "start_date_local": "2026-09-16T07:00:00",
    "target_type": "pace",
    "sections": [
      { "label": "Run", "steps": [
        { "duration": "30m", "target": "6:30-6:00/km Pace" }
      ]}
    ]
  }
]`

export function IntervalsPush({ onBack }: Props) {
  const [creds, setCreds] = useState<IntervalsCredsType>(loadIntervalsCreds)
  const [text, setText] = useState('')
  const { phase, error, items, results, canPush, preview, push } = useIntervalsPush()

  const connected = !!creds.athleteId && !!creds.apiKey

  const store = (next: IntervalsCredsType) => {
    saveIntervalsCreds(next)
    setCreds(next)
  }

  const shown = phase === 'done' ? results : items
  const busy = phase === 'previewing' || phase === 'pushing'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">Push to Intervals.icu</h2>
        <p className="mt-1 text-sm text-fg-subtle">
          Paste a JSON array of structured running workouts. Each one is compiled to
          Intervals.icu's Workout Builder syntax and created as a calendar event,
          which syncs to your watch through your Intervals.icu → Garmin link.
        </p>
      </div>

      {connected ? (
        <p className="text-xs text-fg-subtle">
          Connected to Intervals.icu as <code>{creds.athleteId}</code>.{' '}
          <button
            type="button"
            className="underline hover:text-fg"
            onClick={() => store({ athleteId: '', apiKey: '' })}
          >
            Forget
          </button>
        </p>
      ) : (
        <IntervalsCredentialsForm initial={creds} onSave={store} />
      )}

      {connected && (
        <>
          <div className="space-y-2">
            <label htmlFor="intervals-json" className="block text-sm font-medium text-fg-muted">
              Workouts JSON
            </label>
            <textarea
              id="intervals-json"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={PLACEHOLDER}
              className="block w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-xs text-fg shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex justify-end">
              <button
                onClick={() => preview(text)}
                disabled={!text.trim() || busy}
                className="rounded-md border border-border-strong bg-surface px-5 py-2 text-sm font-medium text-fg-muted shadow-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                {phase === 'previewing' ? 'Compiling…' : 'Preview'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          {shown && shown.length > 0 && (
            <div className="space-y-3">
              {shown.map((item) => (
                <ResultCard key={item.index} item={item} pushed={phase === 'done'} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-sm text-fg-muted underline">
              ← Menu
            </button>
            <button
              onClick={() => push(creds, text)}
              disabled={!canPush || busy}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === 'pushing'
                ? 'Pushing…'
                : phase === 'done'
                  ? 'Push again'
                  : 'Push'}
            </button>
          </div>
        </>
      )}

      {!connected && (
        <button onClick={onBack} className="text-sm text-fg-muted underline">
          ← Menu
        </button>
      )}
    </div>
  )
}

function ResultCard({ item, pushed }: { item: IntervalsItemResultType; pushed: boolean }) {
  const label = item.name ?? `Workout ${item.index + 1}`
  const failed = item.errors.length > 0

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium text-fg">{label}</span>
        {failed ? (
          <span className="shrink-0 text-xs text-danger">✗ {item.errors.length} problem{item.errors.length !== 1 ? 's' : ''}</span>
        ) : pushed ? (
          <span className="shrink-0 text-xs text-success">✓ Created on Intervals.icu</span>
        ) : (
          <span className="shrink-0 text-xs text-success">✓ Compiled</span>
        )}
      </div>

      {failed ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-danger">
          {item.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : (
        !pushed &&
        item.description && (
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-surface-muted p-3 font-mono text-xs text-fg-muted">
            {item.description}
          </pre>
        )
      )}
    </div>
  )
}
