import { useEffect, useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType, WizardStateType } from '@/state'
import { garmin } from '@/api'
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from '@/components/ui'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

export function Step4ConnectGarmin({ state, dispatch, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  const isAuthenticated = state.garminToken !== null

  useEffect(() => {
    if (!state.garminToken) return
    setValidating(true)
    garmin.validateToken(state.garminToken)
      .then(({ valid }) => {
        if (!valid) dispatch({ type: ActionTypeEnum.GarminSessionExpired })
      })
      .catch(() => dispatch({ type: ActionTypeEnum.GarminSessionExpired }))
      .finally(() => setValidating(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function copy(field: 'email' | 'password') {
    const text = field === 'email' ? state.garminEmail : state.garminPassword
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleBrowserLogin() {
    setLoading(true)
    setError(null)
    try {
      const res = await garmin.browserLogin()
      dispatch({ type: ActionTypeEnum.GarminAuthenticated, token: res.token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Connect Garmin</h2>
        <p className="mt-1 text-sm text-gray-500">
          A browser window will open so you can log in to Garmin Connect directly.
          Store your credentials here for easy copy-paste — they are saved locally and never sent anywhere.
        </p>
      </div>

      {validating ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          Checking Garmin session…
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            ✓ Authenticated with Garmin Connect
          </div>
          <p className="text-xs text-gray-400">
            <button
              type="button"
              className="underline hover:text-gray-600"
              onClick={() => dispatch({ type: ActionTypeEnum.GarminSessionExpired })}
            >
              Sign in with a different account
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Credential storage for copy-paste convenience */}
          <div className="space-y-3">
            <div>
              <label htmlFor="garmin-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative mt-1 flex">
                <input
                  id="garmin-email"
                  type="email"
                  autoComplete="username"
                  value={state.garminEmail}
                  onChange={(e) => dispatch({ type: ActionTypeEnum.GarminEmailChanged, email: e.target.value })}
                  className="block w-full rounded-l-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
                <button
                  type="button"
                  onClick={() => copy('email')}
                  disabled={!state.garminEmail}
                  title="Copy email"
                  className="flex items-center gap-1 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  {copied === 'email' ? <CheckIcon /> : <CopyIcon />}
                  {copied === 'email' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="garmin-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1 flex">
                <div className="relative flex-1">
                  <input
                    id="garmin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={state.garminPassword}
                    onChange={(e) => dispatch({ type: ActionTypeEnum.GarminPasswordChanged, password: e.target.value })}
                    className="block w-full rounded-l-md border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copy('password')}
                  disabled={!state.garminPassword}
                  title="Copy password"
                  className="flex items-center gap-1 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  {copied === 'password' ? <CheckIcon /> : <CopyIcon />}
                  {copied === 'password' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
              <p className="font-medium">Browser window open</p>
              <p className="mt-1 text-blue-700">
                Log in to Garmin Connect in the browser that opened on your desktop.
                Use the copy buttons above to paste your credentials.
                This page will update automatically when you're done.
              </p>
            </div>
          ) : (
            <button
              onClick={handleBrowserLogin}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Open Garmin browser →
            </button>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={loading}
          className="text-sm text-gray-600 underline disabled:opacity-40"
        >
          ← Back
        </button>
        {isAuthenticated && !validating && (
          <button
            onClick={onNext}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Review and push →
          </button>
        )}
      </div>
    </div>
  )
}
