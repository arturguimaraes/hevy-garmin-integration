import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/ui'
import type { IntervalsCredsType } from './intervalsStorage'

interface Props {
  initial: IntervalsCredsType
  onSave: (creds: IntervalsCredsType) => void
}

/**
 * Athlete ID + API key inputs. Both are needed to reach Intervals.icu; the key
 * is masked with a show/hide toggle, same as the Hevy key field.
 */
export function IntervalsCredentialsForm({ initial, onSave }: Props) {
  const [athleteId, setAthleteId] = useState(initial.athleteId)
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [showKey, setShowKey] = useState(false)

  const canSave = !!athleteId.trim() && !!apiKey.trim()
  const save = () => canSave && onSave({ athleteId: athleteId.trim(), apiKey: apiKey.trim() })

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <p className="text-xs text-fg-subtle">
        Find both in Intervals.icu → Settings → Developer. The Athlete ID looks
        like <code>i123456</code>.
      </p>

      <div>
        <label htmlFor="intervals-athlete" className="block text-sm font-medium text-fg-muted">
          Athlete ID
        </label>
        <input
          id="intervals-athlete"
          type="text"
          autoComplete="off"
          placeholder="i123456"
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="mt-1 block w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label htmlFor="intervals-key" className="block text-sm font-medium text-fg-muted">
          API key
        </label>
        <div className="relative mt-1">
          <input
            id="intervals-key"
            type={showKey ? 'text' : 'password'}
            autoComplete="off"
            placeholder="intervals_api_key_…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="block w-full rounded-md border border-border-strong bg-surface px-3 py-2 pr-10 text-sm text-fg shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-subtle hover:text-fg"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={!canSave}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}
