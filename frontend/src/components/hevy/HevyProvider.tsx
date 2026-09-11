import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { hevy } from '@/api'
import { loadHevyKey, loadHevyKeySavedAt, saveHevyKey } from './hevyStorage'

export interface HevyConnectionType {
  /** The validated (or persisted) Hevy API key. Empty when disconnected. */
  apiKey: string
  /** ISO timestamp of when the current key was saved. Null when disconnected. */
  savedAt: string | null
  /** Hevy username — the backend always returns null today, so treat as optional. */
  username: string | null
  status: 'disconnected' | 'connected'
  /** True while a connect() call is in flight. */
  validating: boolean
  error: string | null
  connect: (key: string) => Promise<void>
  forget: () => void
}

const HevyContext = createContext<HevyConnectionType | null>(null)

export function HevyProvider({ children }: { children: React.ReactNode }) {
  // A persisted key means "connected" optimistically — the backend can't return
  // a username anyway, and re-validating on every load would just add latency.
  const [apiKey, setApiKey] = useState<string>(loadHevyKey)
  const [savedAt, setSavedAt] = useState<string | null>(loadHevyKeySavedAt)
  const [username, setUsername] = useState<string | null>(null)
  const [status, setStatus] = useState<'disconnected' | 'connected'>(() =>
    loadHevyKey() ? 'connected' : 'disconnected',
  )
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async (raw: string) => {
    const key = raw.trim()
    if (!key) return
    setValidating(true)
    setError(null)
    try {
      const res = await hevy.validate(key)
      saveHevyKey(key)
      setApiKey(key)
      setSavedAt(loadHevyKeySavedAt())
      setUsername(res.username)
      setStatus('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setValidating(false)
    }
  }, [])

  const forget = useCallback(() => {
    saveHevyKey('')
    setApiKey('')
    setSavedAt(null)
    setUsername(null)
    setError(null)
    setStatus('disconnected')
  }, [])

  const value = useMemo<HevyConnectionType>(
    () => ({ apiKey, savedAt, username, status, validating, error, connect, forget }),
    [apiKey, savedAt, username, status, validating, error, connect, forget],
  )

  return <HevyContext.Provider value={value}>{children}</HevyContext.Provider>
}

export function useHevy(): HevyConnectionType {
  const ctx = useContext(HevyContext)
  if (!ctx) throw new Error('useHevy must be used within <HevyProvider>')
  return ctx
}
