import type { WizardActionType, WizardStateType } from '@/state'
import { Step1ChooseRoutines } from './step1'
import { Step2MapExercises } from './step2'
import { Step3ConnectGarmin } from './step3'
import { Step4ReviewPush } from './step4'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
  /** Leave the wizard and return to the home menu. */
  onExit: () => void
}

/** Renders the wizard step matching state.step. */
export function WizardStep({ state, dispatch, onNext, onBack, onExit }: Props) {
  switch (state.step) {
    case 1:
      return <Step1ChooseRoutines state={state} dispatch={dispatch} onNext={onNext} />
    case 2:
      return <Step2MapExercises state={state} dispatch={dispatch} onNext={onNext} onBack={onBack} />
    case 3:
      return <Step3ConnectGarmin state={state} dispatch={dispatch} onNext={onNext} onBack={onBack} />
    case 4:
      return <Step4ReviewPush state={state} dispatch={dispatch} onBack={onBack} onExit={onExit} />
    default:
      return null
  }
}
