import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadFile } from './download'

describe('downloadFile', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clickSpy.mockRestore()
  })

  it('creates an anchor, clicks it once, and revokes the URL', () => {
    downloadFile('hevy-routines-2026-08-28.csv', new Blob(['a,b,c']))

    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    expect(document.querySelector('a')).toBeNull() // removed after click
  })
})
