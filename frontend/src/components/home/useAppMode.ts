import { useCallback, useMemo, useState } from 'react'
import { AppModeEnum } from './appMode'

/**
 * Top-level mode selection. Not persisted — every load starts at the menu (the
 * Hevy key still persists, so the user lands on the menu, not the connect screen).
 */
export function useAppMode() {
  const [mode, setMode] = useState<AppModeEnum>(AppModeEnum.Menu)

  const showMenu = useCallback(() => setMode(AppModeEnum.Menu), [])
  const showGarmin = useCallback(() => setMode(AppModeEnum.Garmin), [])
  const showCsv = useCallback(() => setMode(AppModeEnum.Csv), [])

  return useMemo(
    () => ({ mode, showMenu, showGarmin, showCsv }),
    [mode, showMenu, showGarmin, showCsv],
  )
}
