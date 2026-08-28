import { useEffect, useState } from 'react'
import { MappingSourceEnum } from '@/state'
import type { ExerciseMappingType, MatchCandidateType } from '@/state'
import { mapping } from '@/api'
import { CheckIcon, Modal } from '@/components/ui'
import { candidateToMapping, type EditTarget } from '../mapping'

interface Props {
  target: EditTarget | null
  current: ExerciseMappingType | undefined
  suggestions: MatchCandidateType[] | undefined
  suggestionsLoading: boolean
  onPick: (mapping: ExerciseMappingType) => void
  onClose: () => void
}

export function MappingModal({ target, current, suggestions, suggestionsLoading, onPick, onClose }: Props) {
  // Keep the last opened target/data so content stays put during the close animation.
  const [snap, setSnap] = useState<{
    hevyName: string
    current: ExerciseMappingType | undefined
    suggestions: MatchCandidateType[] | undefined
    suggestionsLoading: boolean
  }>({ hevyName: '', current: undefined, suggestions: undefined, suggestionsLoading: false })

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MatchCandidateType[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (target) {
      setSnap({ hevyName: target.hevyName, current, suggestions, suggestionsLoading })
    }
  }, [target, current, suggestions, suggestionsLoading])

  useEffect(() => {
    setQuery('')
    setResults([])
    setSearchError(null)
  }, [target?.rowId])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearchError(null)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      mapping
        .search(q)
        .then(({ entries }) => {
          if (cancelled) return
          setResults(
            entries.map((e) => ({ name: e.name, category: e.category, exercise: e.exercise, score: 1 })),
          )
          setSearchError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setSearchError(err instanceof Error ? err.message : 'Search failed')
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const showingSearch = query.trim().length >= 2
  const list = showingSearch ? results : snap.suggestions ?? []

  return (
    <Modal open={target !== null} onClose={onClose} title="Change Garmin exercise">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-medium text-fg">{snap.hevyName}</span>
          <span className="shrink-0 text-fg-subtle">→</span>
          <span className="min-w-0 flex-1 truncate text-right text-fg-muted">
            {snap.current ? snap.current.garminDisplayName : '—'}
          </span>
        </div>
      </div>

      <div className="px-5 py-3">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Garmin's exercise catalog…"
          className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {searchError && <p className="mt-1 text-xs text-danger">{searchError}</p>}
        <p className="mt-2 text-xs font-medium text-fg-subtle">
          {showingSearch
            ? 'Search results'
            : snap.suggestionsLoading
              ? 'Loading suggestions…'
              : 'Suggested matches'}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
        {searching && <div className="px-5 py-3 text-xs text-fg-subtle">Searching…</div>}
        {!searching && list.length === 0 && (
          <div className="px-5 py-3 text-xs text-fg-subtle">
            {showingSearch ? 'No matches' : 'No suggestions'}
          </div>
        )}
        <div className="divide-y divide-border">
          {list.map((c) => {
            const selected =
              snap.current?.garminExercise === c.exercise && snap.current?.garminCategory === c.category
            return (
              <button
                key={`${c.category}/${c.exercise}/${c.name}`}
                onClick={() => onPick(candidateToMapping(snap.hevyName, c, MappingSourceEnum.Manual))}
                className={`flex w-full items-center gap-2 px-5 py-2.5 text-left text-sm hover:bg-accent-muted ${selected ? 'bg-accent-muted' : ''}`}
              >
                <span className="min-w-0 flex-1 truncate text-fg-muted">{c.name}</span>
                <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-fg-subtle">
                  {c.category}
                </span>
                {selected && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-success" />}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
