import { ActionTypeEnum, useWizard } from '@/state'
import { HevyGate } from '@/components/hevy'
import { AppModeEnum, HomeMenu, useAppMode } from '@/components/home'
import { CsvExport } from '@/components/csv-export'
import { Header } from '@/components/layout/Header'
import { WizardStep } from '@/components/steps/WizardStep'
import { Footer } from '@/components/layout/Footer'

export default function App() {
  const { state, dispatch, next, back } = useWizard()
  const { mode, showMenu, showGarmin, showCsv } = useAppMode()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header mode={mode} wizardStep={state.step} onBackToMenu={showMenu} />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <HevyGate>
          {mode === AppModeEnum.Menu && (
            <HomeMenu
              onSyncToGarmin={() => {
                dispatch({ type: ActionTypeEnum.Reset })
                showGarmin()
              }}
              onExportCsv={showCsv}
            />
          )}
          {mode === AppModeEnum.Garmin && (
            <WizardStep
              state={state}
              dispatch={dispatch}
              onNext={next}
              onBack={back}
              onExit={showMenu}
            />
          )}
          {mode === AppModeEnum.Csv && <CsvExport onBack={showMenu} />}
        </HevyGate>
      </main>

      <Footer />
    </div>
  )
}
