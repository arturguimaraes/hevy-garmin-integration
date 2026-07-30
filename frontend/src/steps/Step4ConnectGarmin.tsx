import { useState } from 'react'
import type { WizardAction, WizardState } from '../state/types'
import { garmin } from '../api/client'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  onNext: () => void
  onBack: () => void
}

export function Step4ConnectGarmin({ state, dispatch, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')

  const needsMfa = state.garminSessionId !== null
  const isAuthenticated = state.garminToken !== null

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      const res = await garmin.login(state.garminEmail, state.garminPassword)
      if (res.status === 'mfa_required' && res.sessionId) {
        dispatch({ type: 'GARMIN_MFA_PENDING', sessionId: res.sessionId })
      } else if (res.status === 'ok' && res.token) {
        dispatch({ type: 'GARMIN_AUTHENTICATED', token: res.token })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleMfa() {
    if (!state.garminSessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await garmin.mfa(state.garminSessionId, mfaCode.trim())
      dispatch({ type: 'GARMIN_AUTHENTICATED', token: res.token })
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
          Your credentials go directly from this machine to Garmin's servers. They
          are held in memory only for the duration of this request and are never
          written to disk or sent anywhere else.{' '}
          <a
            href="https://github.com/arturguimaraes/hevy-garmin-integration/blob/main/backend/app/routes/garmin.py"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            See the source
          </a>
          .
        </p>
      </div>

      {isAuthenticated ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Authenticated with Garmin Connect
        </div>
      ) : needsMfa ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Garmin sent a verification code to your registered device or email.
          </p>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            If you don't receive a code within a minute, Garmin may be rate-limiting this IP.{' '}
            <button
              onClick={() => dispatch({ type: 'GARMIN_MFA_CANCELLED' })}
              className="underline hover:text-amber-900"
            >
              Go back and wait before retrying.
            </button>
          </div>
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
              Verification code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMfa()}
              className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleMfa}
            disabled={!mfaCode.trim() || loading}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Verify →'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="garmin-email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="garmin-email"
              type="email"
              autoComplete="username"
              value={state.garminEmail}
              onChange={(e) => dispatch({ type: 'GARMIN_EMAIL_CHANGED', email: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="garmin-password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="garmin-password"
              type="password"
              autoComplete="current-password"
              value={state.garminPassword}
              onChange={(e) =>
                dispatch({ type: 'GARMIN_PASSWORD_CHANGED', password: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={!state.garminEmail || !state.garminPassword || loading}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        {isAuthenticated && (
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
