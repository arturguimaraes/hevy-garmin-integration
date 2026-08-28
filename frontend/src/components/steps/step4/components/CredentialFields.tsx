import { useState } from 'react'
import { ActionTypeEnum } from '@/state'
import type { WizardActionType } from '@/state'
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from '@/components/ui'

interface Props {
  email: string
  password: string
  dispatch: React.Dispatch<WizardActionType>
  copied: string | null
  onCopy: (key: string, text: string) => void
}

/**
 * Garmin email + password inputs. These aren't submitted anywhere — they're
 * saved locally purely so the user can copy them into the login browser.
 */
export function CredentialFields({ email, password, dispatch, copied, onCopy }: Props) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="garmin-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative mt-1 flex">
          <input
            id="garmin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => dispatch({ type: ActionTypeEnum.GarminEmailChanged, email: e.target.value })}
            className="block w-full rounded-l-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="your@email.com"
          />
          <CopyButton
            label="email"
            active={copied === 'email'}
            disabled={!email}
            onClick={() => onCopy('email', email)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="garmin-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative mt-1 flex">
          <div className="relative flex-1">
            <input
              id="garmin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                dispatch({ type: ActionTypeEnum.GarminPasswordChanged, password: e.target.value })
              }
              className="block w-full rounded-l-md border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <CopyButton
            label="password"
            active={copied === 'password'}
            disabled={!password}
            onClick={() => onCopy('password', password)}
          />
        </div>
      </div>
    </div>
  )
}

interface CopyButtonProps {
  label: string
  active: boolean
  disabled: boolean
  onClick: () => void
}

function CopyButton({ label, active, disabled, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Copy ${label}`}
      className="flex items-center gap-1 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
    >
      {active ? <CheckIcon /> : <CopyIcon />}
      {active ? 'Copied' : 'Copy'}
    </button>
  )
}
