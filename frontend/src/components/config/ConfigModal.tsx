import { Modal } from '@/components/ui'
import { ThemeControl } from './ThemeControl'

interface Props {
  open: boolean
  onClose: () => void
}

/** App settings. Currently just appearance; sections are added here as settings grow. */
export function ConfigModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6 px-5 py-4">
        <ThemeControl />
      </div>
    </Modal>
  )
}
