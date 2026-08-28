import type { WizardActionType, WizardStateType } from '@/state'
import { useGarminAuth } from './useGarminAuth'
import { useClipboard } from './useClipboard'
import { AuthenticatedNotice } from './components/AuthenticatedNotice'
import { CredentialFields } from './components/CredentialFields'
import { BrowserLoginPanel } from './components/BrowserLoginPanel'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

export function Step4ConnectGarmin({ state, dispatch, onNext, onBack }: Props) {
  const { validating, loading, error, login } = useGarminAuth(state.garminToken, dispatch)
  const { copied, copy } = useClipboard()
  const isAuthenticated = state.garminToken !== null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">Connect Garmin</h2>
        <p className="mt-1 text-sm text-fg-subtle">
          A browser window will open so you can log in to Garmin Connect directly.
          Store your credentials here for easy copy-paste — they are saved locally and never sent anywhere.
        </p>
      </div>

      {validating ? (
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-fg-subtle">
          Checking Garmin session…
        </div>
      ) : isAuthenticated ? (
        <AuthenticatedNotice dispatch={dispatch} />
      ) : (
        <div className="space-y-4">
          <CredentialFields
            email={state.garminEmail}
            password={state.garminPassword}
            dispatch={dispatch}
            copied={copied}
            onCopy={copy}
          />
          <BrowserLoginPanel loading={loading} error={error} onLogin={login} />
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={loading}
          className="text-sm text-fg-muted underline disabled:opacity-40"
        >
          ← Back
        </button>
        {isAuthenticated && !validating && (
          <button
            onClick={onNext}
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover"
          >
            Review and push →
          </button>
        )}
      </div>
    </div>
  )
}
