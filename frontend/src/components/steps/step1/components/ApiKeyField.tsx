import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'
import { EyeIcon, EyeOffIcon } from '@/components/ui'

interface Props {
  value: string
  dispatch: React.Dispatch<WizardActionType>
  onSubmit: () => void
}

export function ApiKeyField({ value, dispatch, onSubmit }: Props) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div>
      <label htmlFor="hevy-key" className="block text-sm font-medium text-gray-700">
        Hevy API key
      </label>
      <p className="mt-0.5 text-xs text-gray-500">
        Requires{' '}
        <a
          href="https://www.hevy.com/settings?developer"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
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
          onChange={(e) => dispatch({ type: ActionTypeEnum.HevyKeyChanged, key: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
        >
          {showKey ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {value && (
        <p className="mt-1 text-xs text-gray-400">
          Saved on this device.{' '}
          <button
            type="button"
            className="underline hover:text-gray-600"
            onClick={() => dispatch({ type: ActionTypeEnum.HevyKeyChanged, key: '' })}
          >
            Forget
          </button>
        </p>
      )}
    </div>
  )
}
