import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'

export function AuthenticatedNotice({ dispatch }: { dispatch: React.Dispatch<WizardActionType> }) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        ✓ Authenticated with Garmin Connect
      </div>
      <p className="text-xs text-gray-400">
        <button
          type="button"
          className="underline hover:text-gray-600"
          onClick={() => dispatch({ type: ActionTypeEnum.GarminSessionExpired })}
        >
          Sign in with a different account
        </button>
      </p>
    </div>
  )
}
