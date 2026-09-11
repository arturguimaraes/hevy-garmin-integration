/**
 * Hevy API key persistence.
 *
 * Stored in localStorage under `hg:hevyApiKey` (same `hg:` prefix as the rest of
 * the app). The key never leaves the browser except as a per-request header to
 * the local backend, which proxies it to Hevy. The ISO timestamp under
 * `hg:hevyApiKeySavedAt` records when the key was last saved, for display only.
 */

const STORAGE_KEY = 'hg:hevyApiKey'
const SAVED_AT_KEY = 'hg:hevyApiKeySavedAt'

export function loadHevyKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveHevyKey(key: string) {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key)
      localStorage.setItem(SAVED_AT_KEY, new Date().toISOString())
    } else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(SAVED_AT_KEY)
    }
  } catch {
    // Storage disabled (private mode) — the key just won't persist.
  }
}

export function loadHevyKeySavedAt(): string | null {
  try {
    return localStorage.getItem(SAVED_AT_KEY)
  } catch {
    return null
  }
}
