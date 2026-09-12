import { describe, expect, it } from 'vitest'
import { episodeMetaSchema } from '../episode-meta'

describe('episodeMetaSchema', () => {
  it('defaults analysisReport to null', () => {
    const result = episodeMetaSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.analysisReport).toBeNull()
    }
  })

  it('rejects a malformed analysisReport', () => {
    const result = episodeMetaSchema.safeParse({ analysisReport: { id: 'not-valid' } })
    expect(result.success).toBe(false)
  })
})
