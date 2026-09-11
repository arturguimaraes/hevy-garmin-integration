import { Modal } from '@/components/ui'
import { HevyKeyControl } from '@/components/hevy'
import { ThemeControl } from './ThemeControl'

interface Props {
  open: boolean
  onClose: () => void
}

/** App settings: appearance and connected accounts. */
export function ConfigModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6 px-5 py-4">
        <ThemeControl />
        <HevyKeyControl />
      </div>
    </Modal>
  )
}
