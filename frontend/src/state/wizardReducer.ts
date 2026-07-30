import { ActionTypeEnum } from './enums'
import type { WizardActionType, WizardStateType } from './types'

export const initialState: WizardStateType = {
  step: 1,

  hevyApiKey: '',
  hevyUsername: null,

  routines: [],
  selectedRoutineIds: [],

  mappings: {},

  garminEmail: '',
  garminPassword: '',
  garminToken: null,
  garminSessionId: null,
  workoutNamePrefix: '',

  pushResults: [],
}

export function wizardReducer(state: WizardStateType, action: WizardActionType): WizardStateType {
  switch (action.type) {
    case ActionTypeEnum.HevyKeyChanged:
      return { ...state, hevyApiKey: action.key, hevyUsername: null }

    case ActionTypeEnum.HevyValidated:
      return { ...state, hevyUsername: action.username }

    case ActionTypeEnum.RoutinesLoaded:
      return { ...state, routines: action.routines, selectedRoutineIds: [] }

    case ActionTypeEnum.RoutineToggled: {
      const selected = state.selectedRoutineIds.includes(action.id)
        ? state.selectedRoutineIds.filter((id) => id !== action.id)
        : [...state.selectedRoutineIds, action.id]
      return { ...state, selectedRoutineIds: selected }
    }

    case ActionTypeEnum.AllRoutinesToggled:
      return {
        ...state,
        selectedRoutineIds: action.selected ? state.routines.map((r) => r.id) : [],
      }

    case ActionTypeEnum.MappingUpdated:
      return {
        ...state,
        mappings: { ...state.mappings, [action.hevyName]: action.mapping },
      }

    case ActionTypeEnum.MappingsBulkLoaded:
      return { ...state, mappings: { ...state.mappings, ...action.mappings } }

    case ActionTypeEnum.GarminEmailChanged:
      return { ...state, garminEmail: action.email }

    case ActionTypeEnum.GarminPasswordChanged:
      return { ...state, garminPassword: action.password }

    case ActionTypeEnum.GarminMfaPending:
      return { ...state, garminSessionId: action.sessionId }

    case ActionTypeEnum.GarminMfaCancelled:
      return { ...state, garminSessionId: null }

    case ActionTypeEnum.GarminSessionExpired:
      return { ...state, garminToken: null, garminSessionId: null }

    case ActionTypeEnum.GarminAuthenticated:
      return {
        ...state,
        garminToken: action.token,
        garminPassword: '',
        garminSessionId: null,
      }

    case ActionTypeEnum.WorkoutPrefixChanged:
      return { ...state, workoutNamePrefix: action.prefix }

    case ActionTypeEnum.PushResultAdded:
      return { ...state, pushResults: [...state.pushResults, action.result] }

    case ActionTypeEnum.NextStep:
      return { ...state, step: Math.min(state.step + 1, 5) as WizardStateType['step'] }

    case ActionTypeEnum.PrevStep:
      return { ...state, step: Math.max(state.step - 1, 1) as WizardStateType['step'] }

    case ActionTypeEnum.Reset:
      return initialState

    default:
      return state
  }
}
