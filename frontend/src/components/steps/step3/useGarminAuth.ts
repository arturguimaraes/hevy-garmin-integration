import { useEffect, useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'
import { garmin } from '@/api'

/** Validates a stored Garmin token on mount and drives the browser-login flow. */
export function useGarminAuth(token: string | null, dispatch: React.Dispatch<WizardActionType>) {
  const [validating, setValidating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setValidating(true)
    garmin
      .validateToken(token)
      .then(({ valid }) => {
        if (!valid) dispatch({ type: ActionTypeEnum.GarminSessionExpired })
      })
      .catch(() => dispatch({ type: ActionTypeEnum.GarminSessionExpired }))
      .finally(() => setValidating(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function login() {
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

  return { validating, loading, error, login }
}
