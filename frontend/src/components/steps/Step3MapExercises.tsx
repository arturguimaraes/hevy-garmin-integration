import { useEffect, useState } from 'react'
import { ActionTypeEnum, MappingSourceEnum } from '../../state/enums'
import type {
  ExerciseMappingType,
  MatchCandidateType,
  WizardActionType,
  WizardStateType,
} from '../../state/types'
import { mapping } from '../../api/client'
import { Modal } from '../ui/Modal'

interface Props {
  state: WizardStateType
  dispatch: React.Dispatch<WizardActionType>
  onNext: () => void
  onBack: () => void
}

const GOOD_MATCH_THRESHOLD = 0.5

function isGood(m: ExerciseMappingType | undefined): m is ExerciseMappingType {
  return m !== undefined && (m.source === MappingSourceEnum.Manual || m.score >= GOOD_MATCH_THRESHOLD)
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-green-600">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-amber-500">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function candidateToMapping(
  hevyName: string,
  c: MatchCandidateType,
  source: MappingSourceEnum,
): ExerciseMappingType {
  return {
    hevyName,
    garminCategory: c.category,
    garminExercise: c.exercise,
    garminDisplayName: c.name,
    score: c.score,
    source,
  }
}

interface EditTarget {
  rowId: string
  hevyName: string
}

interface MappingModalProps {
  target: EditTarget | null
  current: ExerciseMappingType | undefined
  suggestions: MatchCandidateType[] | undefined
  suggestionsLoading: boolean
  onPick: (mapping: ExerciseMappingType) => void
  onClose: () => void
}

function MappingModal({ target, current, suggestions, suggestionsLoading, onPick, onClose }: MappingModalProps) {
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
                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500">
                  {c.category}
                </span>
                {selected && <CheckIcon />}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export function Step3MapExercises({ state, dispatch, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [candidates, setCandidates] = useState<Record<string, MatchCandidateType[]>>({})
  const [candidatesLoading, setCandidatesLoading] = useState<string | null>(null)

  const selectedRoutines = state.routines.filter((r) =>
    state.selectedRoutineIds.includes(r.id),
  )

  const uniqueExercises = [
    ...new Set(selectedRoutines.flatMap((r) => r.exercises.map((e) => e.title))),
  ].sort()

  useEffect(() => {
    const unmapped = uniqueExercises.filter((name) => !(name in state.mappings))
    if (unmapped.length === 0) return

    setLoading(true)
    setError(null)
    mapping
      .resolve(unmapped)
      .then(({ matches }) => {
        const bulk: Record<string, ExerciseMappingType> = {}
        const cand: Record<string, MatchCandidateType[]> = {}
        for (const { hevyName, top } of matches) {
          cand[hevyName] = top
          if (top.length > 0) {
            bulk[hevyName] = candidateToMapping(hevyName, top[0], MappingSourceEnum.Auto)
          }
        }
        setCandidates((prev) => ({ ...prev, ...cand }))
        dispatch({ type: ActionTypeEnum.MappingsBulkLoaded, mappings: bulk })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }, [uniqueExercises.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  function openEditor(rowId: string, name: string) {
    setEditing({ rowId, hevyName: name })
    if (!(name in candidates)) {
      setCandidatesLoading(name)
      mapping
        .resolve([name])
        .then(({ matches }) => {
          const top = matches[0]?.top ?? []
          setCandidates((prev) => ({ ...prev, [name]: top }))
        })
        .catch(() => setCandidates((prev) => ({ ...prev, [name]: [] })))
        .finally(() => setCandidatesLoading((cur) => (cur === name ? null : cur)))
    }
  }

  const resolved = uniqueExercises.filter((name) => name in state.mappings)
  const goodCount = resolved.filter((name) => isGood(state.mappings[name])).length
  const badCount = resolved.length - goodCount

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Map exercises</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each Hevy exercise is matched to the closest Garmin equivalent. Click any row to review
          the match and pick a different Garmin exercise.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">Failed to resolve mappings: {error}</p>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Matching exercises…</div>
      ) : (
        <>
          {/* Global summary */}
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">{uniqueExercises.length} exercises</span>
            <span className="text-green-700">{goodCount} matched</span>
            {badCount > 0 && (
              <span className="text-amber-600">{badCount} need review</span>
            )}
          </div>

          {/* Per-routine cards */}
          <div className="space-y-4">
            {selectedRoutines.map((routine) => {
              const routineGood = routine.exercises.filter((ex) =>
                isGood(state.mappings[ex.title]),
              ).length
              const routineBad = routine.exercises.length - routineGood

              return (
                <div key={routine.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-900">{routine.title}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-700">{routineGood} ✓</span>
                      {routineBad > 0 && (
                        <span className="text-amber-600">{routineBad} ⚠</span>
                      )}
                    </div>
                  </div>

                  {/* Exercise rows */}
                  <div className="divide-y divide-gray-100">
                    {routine.exercises.map((ex, exIndex) => {
                      const rowId = `${routine.id}::${exIndex}`
                      const m = state.mappings[ex.title]
                      const good = isGood(m)
                      const isEditing = editing?.rowId === rowId
                      return (
                        <button
                          key={rowId}
                          onClick={() => openEditor(rowId, ex.title)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 ${isEditing ? 'bg-gray-50' : ''}`}
                        >
                          <div className="shrink-0">
                            {m ? (good ? <CheckIcon /> : <XIcon />) : (
                              <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
                            )}
                          </div>
                          <span className="text-sm text-gray-700 min-w-0 truncate flex-1">
                            {ex.title}
                          </span>
                          <span className="text-gray-400 text-sm shrink-0">→</span>
                          <span className={`text-sm min-w-0 truncate flex-1 text-right ${good ? 'text-gray-700' : m ? 'text-amber-700' : 'text-gray-400 italic'}`}>
                            {m ? m.garminDisplayName : 'resolving…'}
                          </span>
                          {m && (
                            <span className="shrink-0 rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 font-mono">
                              {m.garminCategory}
                            </span>
                          )}
                          {m && m.source === MappingSourceEnum.Manual && (
                            <span className="shrink-0 rounded px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600">
                              edited
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <MappingModal
        target={editing}
        current={editing ? state.mappings[editing.hevyName] : undefined}
        suggestions={editing ? candidates[editing.hevyName] : undefined}
        suggestionsLoading={editing ? candidatesLoading === editing.hevyName : false}
        onPick={(mp) => {
          if (editing) {
            dispatch({ type: ActionTypeEnum.MappingUpdated, hevyName: editing.hevyName, mapping: mp })
          }
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-600 underline">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect Garmin →
        </button>
      </div>
    </div>
  )
}
