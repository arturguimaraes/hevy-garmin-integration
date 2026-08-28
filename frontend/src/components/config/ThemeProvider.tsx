import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  applyTheme,
  darkQuery,
  loadTheme,
  resolveTheme,
  saveTheme,
  type ResolvedThemeType,
  type ThemeType,
} from './theme'

interface ThemeContextValue {
  /** The user's preference: 'system' | 'light' | 'dark'. */
  theme: ThemeType
  /** What 'system' currently resolves to — always 'light' or 'dark'. */
  resolvedTheme: ResolvedThemeType
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(loadTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedThemeType>(() =>
    resolveTheme(loadTheme()),
  )

  // Apply on mount and whenever the preference changes.
  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [theme])

  // While on 'system', follow live OS appearance changes.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = darkQuery()
    const onChange = () => {
      const resolved: ResolvedThemeType = mq.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: ThemeType) => {
    saveTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
