import type { WizardActionType, WizardStateType } from '@/state'
import { useHevyValidation } from './useHevyValidation'
import { ApiKeyField } from './components/ApiKeyField'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
}

export function Step1ConnectHevy({ state, dispatch, onNext }: Props) {
  const { loading, error, validate } = useHevyValidation(dispatch, onNext)
  const submit = () => validate(state.hevyApiKey)

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
        <ApiKeyField value={state.hevyApiKey} dispatch={dispatch} onSubmit={submit} />

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
          onClick={submit}
          disabled={!state.hevyApiKey.trim() || loading}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Connecting…' : 'Connect →'}
        </button>
      </div>
    </div>
  )
}
