/** How far back the workout-history export should reach. */
export enum HistoryRangeEnum {
  All = 'ALL',
  M3 = 'M3',
  M6 = 'M6',
  M12 = 'M12',
}

export const RANGE_OPTIONS: { value: HistoryRangeEnum; label: string }[] = [
  { value: HistoryRangeEnum.All, label: 'All time' },
  { value: HistoryRangeEnum.M3, label: 'Last 3 months' },
  { value: HistoryRangeEnum.M6, label: 'Last 6 months' },
  { value: HistoryRangeEnum.M12, label: 'Last 12 months' },
]

const MONTHS: Record<HistoryRangeEnum, number> = {
  [HistoryRangeEnum.All]: 0,
  [HistoryRangeEnum.M3]: 3,
  [HistoryRangeEnum.M6]: 6,
  [HistoryRangeEnum.M12]: 12,
}

/** ISO 8601 cutoff for the given range, or null for "all time". */
export function rangeToSince(range: HistoryRangeEnum): string | null {
  const months = MONTHS[range]
  if (!months) return null
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString()
}
