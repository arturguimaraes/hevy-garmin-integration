import { useCallback, useState } from 'react'
import { exportApi } from '@/api'
import { useHevy } from '@/components/hevy'
import { downloadFile } from '@/lib/download'
import { HistoryRangeEnum, rangeToSince } from './range'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface RunOptions {
  includeHistory: boolean
  includeRoutines: boolean
  range: HistoryRangeEnum
}

export function useCsvExport() {
  const { apiKey } = useHevy()
  const [exporting, setExporting] = useState(false)
  const [preparing, setPreparing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])

  const run = useCallback(
    async ({ includeHistory, includeRoutines, range }: RunOptions) => {
      setExporting(true)
      setError(null)
      setDone([])
      try {
        const downloaded: string[] = []

        if (includeHistory) {
          setPreparing('workout history')
          const { blob, filename } = await exportApi.workouts(apiKey, rangeToSince(range))
          downloadFile(filename, blob)
          downloaded.push(filename)
        }

        if (includeHistory && includeRoutines) await sleep(350)

        if (includeRoutines) {
          setPreparing('routines')
          const { blob, filename } = await exportApi.routines(apiKey)
          downloadFile(filename, blob)
          downloaded.push(filename)
        }

        setDone(downloaded)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setPreparing(null)
        setExporting(false)
      }
    },
    [apiKey],
  )

  return { exporting, preparing, error, done, run }
}
