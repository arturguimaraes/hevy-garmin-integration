/**
 * Hevy API key persistence.
 *
 * Stored in localStorage under `hg:hevyApiKey` (same `hg:` prefix as the rest of
 * the app). The key never leaves the browser except as a per-request header to
 * the local backend, which proxies it to Hevy.
 */

const STORAGE_KEY = 'hg:hevyApiKey'

export function loadHevyKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveHevyKey(key: string) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage disabled (private mode) — the key just won't persist.
  }
}
