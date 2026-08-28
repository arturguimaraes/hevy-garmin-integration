import { useEffect, useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'
import { hevy } from '@/api'

/** Loads the user's Hevy routines once, unless they're already in wizard state. */
export function useRoutines(
  apiKey: string,
  alreadyLoaded: boolean,
  dispatch: React.Dispatch<WizardActionType>,
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (alreadyLoaded) return
    setLoading(true)
    setError(null)
    hevy
      .routines(apiKey)
      .then((res) => dispatch({ type: ActionTypeEnum.RoutinesLoaded, routines: res.routines }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { loading, error }
}
