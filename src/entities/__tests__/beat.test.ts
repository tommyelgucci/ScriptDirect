import { describe, expect, it } from 'vitest'
import { beatSchema } from '../beat'

describe('beatSchema', () => {
  it('accepts a valid beat', () => {
    const result = beatSchema.safeParse({ sceneId: 'scn_aaaaaaaaaaaa', act: 2, label: 'Midpoint' })
    expect(result.success).toBe(true)
  })

  it('defaults label to an empty string', () => {
    const result = beatSchema.safeParse({ sceneId: 'scn_aaaaaaaaaaaa', act: 1 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.label).toBe('')
    }
  })

  it('rejects an act outside 1-3', () => {
    const result = beatSchema.safeParse({ sceneId: 'scn_aaaaaaaaaaaa', act: 4 })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed sceneId', () => {
    const result = beatSchema.safeParse({ sceneId: 'not-a-scene-id', act: 1 })
    expect(result.success).toBe(false)
  })
})
