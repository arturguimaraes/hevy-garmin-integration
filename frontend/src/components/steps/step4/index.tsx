import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType, WizardStateType } from '@/state'
import { todayIso } from './buildWorkouts'
import { usePushWorkouts } from './usePushWorkouts'
import { WorkoutRow } from './components/WorkoutRow'
import { SessionExpiredNotice } from './components/SessionExpiredNotice'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onBack: () => void
  /** Leave the wizard and return to the home menu. */
  onExit: () => void
}

export function Step4ReviewPush({ state, dispatch, onBack, onExit }: Props) {
  const selectedRoutines = state.routines.filter((r) => state.selectedRoutineIds.includes(r.id))

  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(selectedRoutines.map((r) => [r.id, r.title])),
  )
  const [dates, setDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(selectedRoutines.map((r) => [r.id, todayIso()])),
  )

  const { pushing, pushError, sessionExpired, relogging, push, reconnect } = usePushWorkouts(dispatch)

  const hasPushResults = state.pushResults.length > 0
  const allDone =
    hasPushResults &&
    selectedRoutines.every((r) => state.pushResults.some((p) => p.title === r.title))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">Review and push</h2>
        <p className="mt-1 text-sm text-fg-subtle">
          Pick a date for each workout, then push all {selectedRoutines.length} to Garmin Connect.
        </p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {selectedRoutines.map((routine) => (
          <WorkoutRow
            key={routine.id}
            name={names[routine.id] ?? routine.title}
            date={dates[routine.id] ?? todayIso()}
            result={state.pushResults.find((r) => r.title === routine.title)}
            pushing={pushing}
            exerciseCount={routine.exercises.length}
            onNameChange={(v) => setNames((prev) => ({ ...prev, [routine.id]: v }))}
            onDateChange={(v) => setDates((prev) => ({ ...prev, [routine.id]: v }))}
          />
        ))}
      </div>

      {sessionExpired && <SessionExpiredNotice relogging={relogging} onReconnect={reconnect} />}

      {pushError && <p className="text-sm text-danger">{pushError}</p>}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={pushing}
          className="text-sm text-fg-muted underline disabled:opacity-50"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          {allDone && (
            <button
              onClick={() => {
                dispatch({ type: ActionTypeEnum.Reset })
                onExit()
              }}
              className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-fg-muted shadow-sm hover:bg-surface-muted"
            >
              Start over
            </button>
          )}
          <button
            onClick={() =>
              push({
                token: state.garminToken!,
                routines: selectedRoutines,
                mappings: state.mappings,
                names,
                dates,
              })
            }
            disabled={pushing}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pushing ? 'Pushing…' : allDone ? 'Push again' : 'Push to Garmin'}
          </button>
        </div>
      </div>
    </div>
  )
}
