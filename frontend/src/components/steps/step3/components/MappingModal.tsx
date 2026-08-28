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
      <div className="border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{snap.hevyName}</span>
          <span className="shrink-0 text-gray-400">→</span>
          <span className="min-w-0 flex-1 truncate text-right text-gray-600">
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
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchError && <p className="mt-1 text-xs text-red-600">{searchError}</p>}
        <p className="mt-2 text-xs font-medium text-gray-400">
          {showingSearch
            ? 'Search results'
            : snap.suggestionsLoading
              ? 'Loading suggestions…'
              : 'Suggested matches'}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-100">
        {searching && <div className="px-5 py-3 text-xs text-gray-400">Searching…</div>}
        {!searching && list.length === 0 && (
          <div className="px-5 py-3 text-xs text-gray-400">
            {showingSearch ? 'No matches' : 'No suggestions'}
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {list.map((c) => {
            const selected =
              snap.current?.garminExercise === c.exercise && snap.current?.garminCategory === c.category
            return (
              <button
                key={`${c.category}/${c.exercise}/${c.name}`}
                onClick={() => onPick(candidateToMapping(snap.hevyName, c, MappingSourceEnum.Manual))}
                className={`flex w-full items-center gap-2 px-5 py-2.5 text-left text-sm hover:bg-blue-50 ${selected ? 'bg-blue-50' : ''}`}
              >
                <span className="min-w-0 flex-1 truncate text-gray-700">{c.name}</span>
                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
                  {c.category}
                </span>
                {selected && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-600" />}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
