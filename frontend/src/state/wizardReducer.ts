import type { WizardAction, WizardState } from './types'

export const initialState: WizardState = {
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

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'HEVY_KEY_CHANGED':
      return { ...state, hevyApiKey: action.key, hevyUsername: null }

    case 'HEVY_VALIDATED':
      return { ...state, hevyUsername: action.username }

    case 'ROUTINES_LOADED':
      return { ...state, routines: action.routines, selectedRoutineIds: [] }

    case 'ROUTINE_TOGGLED': {
      const selected = state.selectedRoutineIds.includes(action.id)
        ? state.selectedRoutineIds.filter((id) => id !== action.id)
        : [...state.selectedRoutineIds, action.id]
      return { ...state, selectedRoutineIds: selected }
    }

    case 'ALL_ROUTINES_TOGGLED':
      return {
        ...state,
        selectedRoutineIds: action.selected ? state.routines.map((r) => r.id) : [],
      }

    case 'MAPPING_UPDATED':
      return {
        ...state,
        mappings: { ...state.mappings, [action.hevyName]: action.mapping },
      }

    case 'MAPPINGS_BULK_LOADED':
      return { ...state, mappings: { ...state.mappings, ...action.mappings } }

    case 'GARMIN_EMAIL_CHANGED':
      return { ...state, garminEmail: action.email }

    case 'GARMIN_PASSWORD_CHANGED':
      return { ...state, garminPassword: action.password }

    case 'GARMIN_MFA_PENDING':
      return { ...state, garminSessionId: action.sessionId }

    case 'GARMIN_AUTHENTICATED':
      return {
        ...state,
        garminToken: action.token,
        garminPassword: '', // clear password as soon as we have a token
        garminSessionId: null,
      }

    case 'WORKOUT_PREFIX_CHANGED':
      return { ...state, workoutNamePrefix: action.prefix }

    case 'PUSH_RESULT_ADDED':
      return { ...state, pushResults: [...state.pushResults, action.result] }

    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 5) as WizardState['step'] }

    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) as WizardState['step'] }

    case 'RESET':
      return initialState

    default:
      return state
  }
}
