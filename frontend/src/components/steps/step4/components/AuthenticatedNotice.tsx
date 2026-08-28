import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'

export function AuthenticatedNotice({ dispatch }: { dispatch: React.Dispatch<WizardActionType> }) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
        ✓ Authenticated with Garmin Connect
      </div>
      <p className="text-xs text-fg-subtle">
        <button
          type="button"
          className="underline hover:text-fg"
          onClick={() => dispatch({ type: ActionTypeEnum.GarminSessionExpired })}
        >
          Sign in with a different account
        </button>
      </p>
    </div>
  )
}
