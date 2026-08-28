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
    ? 'hover:bg-gray-50'
    : good
      ? 'bg-green-50 hover:bg-green-100'
      : 'bg-amber-50 hover:bg-amber-100'

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${tone} ${editing ? 'ring-2 ring-inset ring-blue-500' : ''}`}
    >
      <div className="shrink-0">
        {m ? (
          good ? (
            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-600" />
          ) : (
            <XIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          )
        ) : (
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{title}</span>
      <span className="shrink-0 text-sm text-gray-400">→</span>
      <span
        className={`min-w-0 flex-1 truncate text-right text-sm ${
          good ? 'text-gray-700' : m ? 'text-amber-700' : 'italic text-gray-400'
        }`}
      >
        {m ? m.garminDisplayName : 'resolving…'}
      </span>
      {m && (
        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
          {m.garminCategory}
        </span>
      )}
      {m?.source === MappingSourceEnum.Manual && (
        <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">edited</span>
      )}
    </button>
  )
}
