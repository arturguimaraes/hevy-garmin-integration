import { useCallback, useReducer } from 'react'
import { ActionTypeEnum } from './enums'
import { loadSaved, saveCred } from './storage'
import { initialState, wizardReducer } from './wizardReducer'
import type { WizardActionType, WizardStateType } from './types'

function initState(): WizardStateType {
  const saved = loadSaved()
  return {
    ...initialState,
    ...saved,
    garminToken: saved.garminToken || null,
  }
}

export interface WizardControls {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  next: () => void
  back: () => void
}

/**
 * Wizard state + navigation. Credentials that change are mirrored into
 * localStorage (via saveCred) as a side-effect of dispatching.
 */
export function useWizard(): WizardControls {
  const [state, rawDispatch] = useReducer(wizardReducer, undefined, initState)

  const dispatch = useCallback((action: WizardActionType) => {
    switch (action.type) {
      case ActionTypeEnum.HevyKeyChanged:
        saveCred('hevyApiKey', action.key)
        break
      case ActionTypeEnum.GarminEmailChanged:
        saveCred('garminEmail', action.email)
        break
      case ActionTypeEnum.GarminPasswordChanged:
        saveCred('garminPassword', action.password)
        break
      case ActionTypeEnum.GarminAuthenticated:
        saveCred('garminToken', action.token)
        break
      case ActionTypeEnum.GarminSessionExpired:
        saveCred('garminToken', '')
        break
    }
    rawDispatch(action)
  }, [rawDispatch])

  const next = useCallback(() => dispatch({ type: ActionTypeEnum.NextStep }), [dispatch])
  const back = useCallback(() => dispatch({ type: ActionTypeEnum.PrevStep }), [dispatch])

  return { state, dispatch, next, back }
}
