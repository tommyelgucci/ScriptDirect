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

  it('defaults sceneMetrics to an empty array', () => {
    const result = episodeMetaSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sceneMetrics).toEqual([])
    }
  })

  it('accepts valid sceneMetrics entries', () => {
    const result = episodeMetaSchema.safeParse({
      sceneMetrics: [
        {
          sceneId: 'scn_aaaaaaaaaaaa',
          emotionalIntensity: 80,
          dramaticTension: 60,
          attentionCapture: 90,
          commercialPotential: 40,
          dominantEmotion: 'fear',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a sceneMetrics entry with an out-of-range score', () => {
    const result = episodeMetaSchema.safeParse({
      sceneMetrics: [
        {
          sceneId: 'scn_aaaaaaaaaaaa',
          emotionalIntensity: 200,
          dramaticTension: 60,
          attentionCapture: 90,
          commercialPotential: 40,
          dominantEmotion: 'fear',
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
