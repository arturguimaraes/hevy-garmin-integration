import { useCallback, useReducer } from 'react'
import { initialState, wizardReducer } from './state/wizardReducer'
import { loadSaved, saveCred } from './state/storage'
import type { WizardAction } from './state/types'
import { Step1ConnectHevy } from './steps/Step1ConnectHevy'
import { Step2ChooseRoutines } from './steps/Step2ChooseRoutines'
import { Step3MapExercises } from './steps/Step3MapExercises'
import { Step4ConnectGarmin } from './steps/Step4ConnectGarmin'
import { Step5ReviewPush } from './steps/Step5ReviewPush'

const STEP_LABELS = [
  'Connect Hevy',
  'Routines',
  'Map exercises',
  'Connect Garmin',
  'Review & push',
]

function initState() {
  const saved = loadSaved()
  return {
    ...initialState,
    ...saved,
    garminToken: saved.garminToken || null,
  }
}

export default function App() {
  const [state, rawDispatch] = useReducer(wizardReducer, undefined, initState)

  const dispatch = useCallback(
    (action: WizardAction) => {
      if (action.type === 'HEVY_KEY_CHANGED') saveCred('hevyApiKey', action.key)
      if (action.type === 'GARMIN_EMAIL_CHANGED') {
        saveCred('garminEmail', action.email)
        if (action.email) saveCred('garminToken', '') // credential change invalidates saved token
      }
      if (action.type === 'GARMIN_PASSWORD_CHANGED') {
        saveCred('garminPassword', action.password)
        if (action.password) saveCred('garminToken', '') // credential change invalidates saved token
      }
      if (action.type === 'GARMIN_AUTHENTICATED') saveCred('garminToken', action.token)
      if (action.type === 'GARMIN_SESSION_EXPIRED') saveCred('garminToken', '')
      rawDispatch(action)
    },
    [rawDispatch],
  )

  function next() {
    dispatch({ type: 'NEXT_STEP' })
  }
  function back() {
    dispatch({ type: 'PREV_STEP' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Hevy → Garmin Connect</h1>
            <span className="text-sm text-gray-400">
              Step {state.step} of {STEP_LABELS.length}
            </span>
          </div>

          {/* Step progress bar */}
          <div className="mt-3 flex gap-1">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1
              const done = stepNum < state.step
              const current = stepNum === state.step
              return (
                <div key={label} className="flex-1">
                  <div
                    className={`h-1 rounded-full transition-colors ${
                      done
                        ? 'bg-blue-600'
                        : current
                          ? 'bg-blue-300'
                          : 'bg-gray-200'
                    }`}
                  />
                  <p
                    className={`mt-1 text-center text-xs truncate ${
                      current ? 'text-blue-600 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {state.step === 1 && (
          <Step1ConnectHevy state={state} dispatch={dispatch} onNext={next} />
        )}
        {state.step === 2 && (
          <Step2ChooseRoutines state={state} dispatch={dispatch} onNext={next} onBack={back} />
        )}
        {state.step === 3 && (
          <Step3MapExercises state={state} dispatch={dispatch} onNext={next} onBack={back} />
        )}
        {state.step === 4 && (
          <Step4ConnectGarmin state={state} dispatch={dispatch} onNext={next} onBack={back} />
        )}
        {state.step === 5 && (
          <Step5ReviewPush state={state} dispatch={dispatch} onBack={back} />
        )}
      </main>
    </div>
  )
}
