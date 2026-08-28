import { useWizard } from '@/state'
import { Header } from '@/components/layout/Header'
import { WizardStep } from '@/components/steps/WizardStep'
import { Footer } from '@/components/layout/Footer'

export default function App() {
  const { state, dispatch, next, back } = useWizard()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header step={state.step} />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <WizardStep state={state} dispatch={dispatch} onNext={next} onBack={back} />
      </main>

      <Footer />
    </div>
  )
}
