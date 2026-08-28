import { MappingSourceEnum } from '@/state'
import type { ExerciseMappingType } from '@/state'
import { CheckIcon, XIcon } from '@/components/ui'
import { isGood } from '../mapping'

interface Props {
  title: string
  mapping: ExerciseMappingType | undefined
  editing: boolean
  onClick: () => void
}

export function ExerciseRow({ title, mapping: m, editing, onClick }: Props) {
  const good = isGood(m)
  const tone = !m
    ? 'hover:bg-surface-muted'
    : good
      ? 'bg-success-bg hover:bg-success-bg-hover'
      : 'bg-warning-bg hover:bg-warning-bg-hover'

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${tone} ${editing ? 'ring-2 ring-inset ring-accent' : ''}`}
    >
      <div className="shrink-0">
        {m ? (
          good ? (
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-success" />
          ) : (
            <XIcon className="h-3.5 w-3.5 shrink-0 text-warning" />
          )
        ) : (
          <div className="h-3.5 w-3.5 rounded-full bg-surface-muted animate-pulse" />
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{title}</span>
      <span className="shrink-0 text-sm text-fg-subtle">→</span>
      <span
        className={`min-w-0 flex-1 truncate text-right text-sm ${
          good ? 'text-fg-muted' : m ? 'text-warning' : 'italic text-fg-subtle'
        }`}
      >
        {m ? m.garminDisplayName : 'resolving…'}
      </span>
      {m && (
        <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-fg-subtle">
          {m.garminCategory}
        </span>
      )}
      {m?.source === MappingSourceEnum.Manual && (
        <span className="shrink-0 rounded bg-accent-muted px-1.5 py-0.5 text-xs text-accent-text">edited</span>
      )}
    </button>
  )
}
