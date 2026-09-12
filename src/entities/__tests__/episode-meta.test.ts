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

  it('defaults beats to an empty array', () => {
    const result = episodeMetaSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.beats).toEqual([])
    }
  })

  it('accepts valid beats entries', () => {
    const result = episodeMetaSchema.safeParse({
      beats: [{ sceneId: 'scn_aaaaaaaaaaaa', act: 2, label: 'Midpoint' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a beats entry with an act outside 1-3', () => {
    const result = episodeMetaSchema.safeParse({
      beats: [{ sceneId: 'scn_aaaaaaaaaaaa', act: 4, label: 'Midpoint' }],
    })
    expect(result.success).toBe(false)
  })
})
