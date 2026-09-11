import { describe, expect, it } from 'vitest'
import { createId, idSchema } from '../id'

describe('id', () => {
  it('creates prefixed, lowercase-alphanumeric ids', () => {
    const id = createId('scn')
    expect(id).toMatch(/^scn_[a-z0-9]+$/)
  })

  it('creates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createId('scn')))
    expect(ids.size).toBe(50)
  })

  it('accepts an id with the matching prefix', () => {
    const result = idSchema('scn').safeParse('scn_7f2a9c1b3d0e')
    expect(result.success).toBe(true)
  })

  it('rejects an id with the wrong prefix', () => {
    const result = idSchema('scn').safeParse('chr_7f2a9c1b3d0e')
    expect(result.success).toBe(false)
  })

  it('rejects a malformed id with a clear error message', () => {
    const result = idSchema('scn').safeParse('not-an-id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('scn_')
    }
  })
})
