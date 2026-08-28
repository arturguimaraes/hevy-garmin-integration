import { useHevy } from '@/components/hevy'

interface Props {
  onSyncToGarmin: () => void
  onExportCsv: () => void
}

interface TaskCardProps {
  title: string
  description: string
  onClick: () => void
}

function TaskCard({ title, description, onClick }: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border bg-surface p-5 text-left shadow-sm transition-colors hover:bg-surface-muted"
    >
      <span className="block text-base font-semibold text-fg">{title}</span>
      <span className="mt-1 block text-sm text-fg-subtle">{description}</span>
    </button>
  )
}

export function HomeMenu({ onSyncToGarmin, onExportCsv }: Props) {
  const { username, forget } = useHevy()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-fg">What would you like to do?</h2>
        <p className="mt-1 text-xs text-fg-subtle">
          Connected to Hevy{username ? ` as ${username}` : ''}.{' '}
          <button type="button" className="underline hover:text-fg" onClick={forget}>
            Forget
          </button>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TaskCard
          title="Sync to Garmin"
          description="Turn your Hevy routines into scheduled Garmin Connect workouts."
          onClick={onSyncToGarmin}
        />
        <TaskCard
          title="Export to CSV"
          description="Download your workout history and/or routines as CSV, ready to drop into a Claude project."
          onClick={onExportCsv}
        />
      </div>
    </div>
  )
}
