import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'
import { hevy } from '@/api'

/** Validates a Hevy API key, stores the username, and advances on success. */
export function useHevyValidation(
  dispatch: React.Dispatch<WizardActionType>,
  onSuccess: () => void,
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function validate(apiKey: string) {
    const key = apiKey.trim()
    if (!key) return
    setLoading(true)
    setError(null)
    try {
      const res = await hevy.validate(key)
      dispatch({ type: ActionTypeEnum.HevyValidated, username: res.username })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, validate }
}
