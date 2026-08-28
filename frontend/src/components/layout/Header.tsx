import type { WizardStateType } from '../../state/types'

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
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Hevy → Garmin Connect</h1>
          <span className="text-sm text-gray-400">
            Step {step} of {STEP_LABELS.length}
          </span>
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
                    done ? 'bg-blue-600' : current ? 'bg-blue-300' : 'bg-gray-200'
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
  )
}
