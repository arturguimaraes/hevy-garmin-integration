import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { ExerciseMappingType, HevyRoutineType, WizardActionType } from '@/state'
import { garmin } from '@/api'
import { buildExercises, todayIso } from './buildWorkouts'

interface PushParams {
  token: string
  routines: HevyRoutineType[]
  mappings: Record<string, ExerciseMappingType>
  names: Record<string, string>
  dates: Record<string, string>
}

/** Uploads the selected workouts to Garmin, with session-expiry recovery. */
export function usePushWorkouts(dispatch: React.Dispatch<WizardActionType>) {
  const [pushing, setPushing] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [relogging, setRelogging] = useState(false)

  async function push({ token, routines, mappings, names, dates }: PushParams) {
    setPushing(true)
    setPushError(null)
    dispatch({ type: ActionTypeEnum.PushResultsCleared })

    try {
      const workouts = routines.map((routine) => ({
        title: (names[routine.id] ?? routine.title).trim() || routine.title,
        date: dates[routine.id] ?? todayIso(),
        exercises: buildExercises(routine, mappings),
      }))
      const { results } = await garmin.push(token, workouts)
      for (const result of results) {
        dispatch({ type: ActionTypeEnum.PushResultAdded, result })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Push failed'
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('no longer valid')) {
        setSessionExpired(true)
        dispatch({ type: ActionTypeEnum.GarminSessionExpired })
      } else {
        setPushError(msg)
      }
    } finally {
      setPushing(false)
    }
  }

  async function reconnect() {
    setRelogging(true)
    setSessionExpired(false)
    try {
      const res = await garmin.browserLogin()
      dispatch({ type: ActionTypeEnum.GarminAuthenticated, token: res.token })
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Login failed')
      setSessionExpired(true)
    } finally {
      setRelogging(false)
    }
  }

  return { pushing, pushError, sessionExpired, relogging, push, reconnect }
}
