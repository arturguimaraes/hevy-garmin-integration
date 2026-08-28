import type { WizardStateType } from '@/state'
import { ConfigMenu } from '@/components/config'

const STEP_LABELS = [
  'Connect Hevy',
  'Routines',
  'Map exercises',
  'Connect Garmin',
  'Review & push',
]

interface Props {
  step: WizardStateType['step']
}

export function Header({ step }: Props) {
  return (
    <header className="bg-surface border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-fg">Hevy → Garmin Connect</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-fg-subtle">
              Step {step} of {STEP_LABELS.length}
            </span>
            <ConfigMenu />
          </div>
        </div>

        {/* Step progress bar */}
        <div className="mt-3 flex gap-1">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1
            const done = stepNum < step
            const current = stepNum === step
            return (
              <div key={label} className="flex-1">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    done ? 'bg-accent' : current ? 'bg-accent/50' : 'bg-border'
                  }`}
                />
                <p
                  className={`mt-1 text-center text-xs truncate ${
                    current ? 'text-accent-text font-medium' : 'text-fg-subtle'
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
  )
}
