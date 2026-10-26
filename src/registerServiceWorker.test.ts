import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './registerServiceWorker'

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('does nothing outside production builds', () => {
    const add = vi.spyOn(window, 'addEventListener')
    registerServiceWorker()
    expect(add).not.toHaveBeenCalledWith('load', expect.any(Function))
  })
})
