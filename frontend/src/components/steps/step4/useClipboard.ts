import { useState } from 'react'

/** Copies text to the clipboard and flashes `key` for `ms` so the UI can show "Copied". */
export function useClipboard(ms = 2000) {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(key: string, text: string) {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), ms)
  }

  return { copied, copy }
}
