import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/ui'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** Shown as a "Forget" link once a key is saved. Omit to hide it. */
  onForget?: () => void
}

export function ApiKeyField({ value, onChange, onSubmit, onForget }: Props) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div>
      <label htmlFor="hevy-key" className="block text-sm font-medium text-fg-muted">
        Hevy API key
      </label>
      <p className="mt-0.5 text-xs text-fg-subtle">
        Requires{' '}
        <a
          href="https://www.hevy.com/settings?developer"
          target="_blank"
          rel="noreferrer"
          className="text-accent-text underline"
        >
          Hevy Pro
        </a>
        . Get your key at hevy.com/settings?developer.
      </p>
      <div className="relative mt-1">
        <input
          id="hevy-key"
          type={showKey ? 'text' : 'password'}
          autoComplete="off"
          placeholder="hevy_api_key_…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
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
      {value && onForget && (
        <p className="mt-1 text-xs text-fg-subtle">
          Saved on this device.{' '}
          <button type="button" className="underline hover:text-fg" onClick={onForget}>
            Forget
          </button>
        </p>
      )}
    </div>
  )
}
