/**
 * Theme preference: type, persistence, and resolution.
 *
 * Persisted in localStorage under `hg:theme` (same `hg:` prefix as the wizard's
 * saved credentials, but this is a non-sensitive UI preference). When unset or
 * invalid the app defaults to dark — matching the static `data-theme="dark"` and
 * the pre-paint resolver script in index.html.
 */

export type ThemeType = 'system' | 'light' | 'dark'
export type ResolvedThemeType = 'light' | 'dark'

export const THEME_OPTIONS: { value: ThemeType; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const STORAGE_KEY = 'hg:theme'
const DEFAULT_THEME: ThemeType = 'dark'

function isTheme(value: unknown): value is ThemeType {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function loadTheme(): ThemeType {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return isTheme(raw) ? raw : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(theme: ThemeType) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage disabled (private mode) — the choice just won't persist.
  }
}

export const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolveTheme(theme: ThemeType): ResolvedThemeType {
  if (theme !== 'system') return theme
  return darkQuery().matches ? 'dark' : 'light'
}

/** Write the resolved theme to <html data-theme>, which drives the CSS tokens. */
export function applyTheme(resolved: ResolvedThemeType) {
  document.documentElement.dataset.theme = resolved
}
