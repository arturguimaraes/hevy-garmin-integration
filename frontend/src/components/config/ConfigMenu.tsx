import { useState } from 'react'
import { GearIcon } from '@/components/ui'
import { ConfigModal } from './ConfigModal'

/** The gear button (header, top-right) and its settings modal. */
export function ConfigMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Settings"
        aria-haspopup="dialog"
        className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
      >
        <GearIcon className="h-4 w-4" />
      </button>
      <ConfigModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
