import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/ui'
import { useHevy } from './HevyProvider'

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Settings-panel view of the connected Hevy API key: hidden by default, revealable. */
export function HevyKeyControl() {
  const { apiKey, savedAt, status, forget } = useHevy()
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <p className="text-sm font-medium text-fg">Hevy API key</p>

      {status === 'connected' ? (
        <>
          <div className="relative mt-2">
            <input
              readOnly
              type={visible ? 'text' : 'password'}
              value={apiKey}
              className="block w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 pr-10 text-sm text-fg shadow-sm"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-subtle hover:text-fg"
              aria-label={visible ? 'Hide API key' : 'Show API key'}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <p className="mt-1 text-xs text-fg-subtle">
            {savedAt ? `Saved on this device ${formatSavedAt(savedAt)}.` : 'Saved on this device.'}{' '}
            <button type="button" className="underline hover:text-fg" onClick={forget}>
              Forget
            </button>
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-fg-subtle">Not connected.</p>
      )}
    </div>
  )
}
