import type { WizardActionType, WizardStateType } from '@/state'
import { Step1ConnectHevy } from './step1'
import { Step2ChooseRoutines } from './step2'
import { Step3MapExercises } from './step3'
import { Step4ConnectGarmin } from './step4'
import { Step5ReviewPush } from './step5'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

/** Renders the wizard step matching state.step. */
export function WizardStep({ state, dispatch, onNext, onBack }: Props) {
  switch (state.step) {
    case 1:
      return <Step1ConnectHevy state={state} dispatch={dispatch} onNext={onNext} />
    case 2:
      return <Step2ChooseRoutines state={state} dispatch={dispatch} onNext={onNext} onBack={onBack} />
    case 3:
      return <Step3MapExercises state={state} dispatch={dispatch} onNext={onNext} onBack={onBack} />
    case 4:
      return <Step4ConnectGarmin state={state} dispatch={dispatch} onNext={onNext} onBack={onBack} />
    case 5:
      return <Step5ReviewPush state={state} dispatch={dispatch} onBack={onBack} />
    default:
      return null
  }
}
