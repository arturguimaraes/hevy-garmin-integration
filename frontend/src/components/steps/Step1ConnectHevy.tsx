import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType, WizardStateType } from '@/state'
import { hevy } from '@/api'
import { EyeIcon, EyeOffIcon } from '@/components/ui'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
}

export function Step1ConnectHevy({ state, dispatch, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  async function handleValidate() {
    if (!state.hevyApiKey.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await hevy.validate(state.hevyApiKey.trim())
      dispatch({ type: ActionTypeEnum.HevyValidated, username: res.username })
      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Connect Hevy</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your API key never leaves your machine — it's sent directly from your
          browser to the local server, which proxies it to Hevy.
        </p>
      </div>

      <div className="space-y-4">
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
              value={state.hevyApiKey}
              onChange={(e) => dispatch({ type: ActionTypeEnum.HevyKeyChanged, key: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
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
          {state.hevyApiKey && (
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

        {error && (
          <p className="text-sm text-red-600">
            {error.includes('401') || error.includes('Invalid')
              ? 'Invalid API key — check you copied it correctly and that your account is Hevy Pro.'
              : `Could not reach Hevy: ${error}`}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleValidate}
          disabled={!state.hevyApiKey.trim() || loading}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Connecting…' : 'Connect →'}
        </button>
      </div>
    </div>
  )
}
