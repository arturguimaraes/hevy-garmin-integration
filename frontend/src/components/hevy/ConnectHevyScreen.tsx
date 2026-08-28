import { useState } from 'react'
import { useHevy } from './HevyProvider'
import { ApiKeyField } from './ApiKeyField'

/** Full-screen gate shown until a Hevy API key is connected. */
export function ConnectHevyScreen() {
  const { apiKey, validating, error, connect } = useHevy()
  const [value, setValue] = useState(apiKey)
  const submit = () => connect(value)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">Connect Hevy</h2>
        <p className="mt-1 text-sm text-fg-subtle">
          Your API key never leaves your machine — it's sent directly from your
          browser to the local server, which proxies it to Hevy.
        </p>
      </div>

      <div className="space-y-4">
        <ApiKeyField value={value} onChange={setValue} onSubmit={submit} />

        {error && (
          <p className="text-sm text-danger">
            {error.includes('401') || error.includes('Invalid')
              ? 'Invalid API key — check you copied it correctly and that your account is Hevy Pro.'
              : `Could not reach Hevy: ${error}`}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!value.trim() || validating}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {validating ? 'Connecting…' : 'Connect →'}
        </button>
      </div>
    </div>
  )
}
