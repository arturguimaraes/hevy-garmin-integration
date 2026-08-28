import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HistoryRangeEnum, rangeToSince } from './range'

describe('rangeToSince', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for "all time"', () => {
    expect(rangeToSince(HistoryRangeEnum.All)).toBeNull()
  })

  it('subtracts 3 months', () => {
    expect(rangeToSince(HistoryRangeEnum.M3)?.slice(0, 10)).toBe('2026-05-28')
  })

  it('subtracts 12 months', () => {
    expect(rangeToSince(HistoryRangeEnum.M12)?.slice(0, 10)).toBe('2025-08-28')
  })

  it('produces an ISO 8601 string', () => {
    expect(rangeToSince(HistoryRangeEnum.M6)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
