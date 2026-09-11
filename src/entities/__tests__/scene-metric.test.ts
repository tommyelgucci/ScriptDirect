import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { sceneMetricSchema } from '../scene-metric'

describe('sceneMetricSchema', () => {
  it('accepts valid scores', () => {
    const result = sceneMetricSchema.safeParse({
      sceneId: createId('scn'),
      emotionalIntensity: 80,
      dramaticTension: 65,
      attentionCapture: 90,
      commercialPotential: 40,
      dominantEmotion: 'fear',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a score above 100', () => {
    const result = sceneMetricSchema.safeParse({
      sceneId: createId('scn'),
      emotionalIntensity: 150,
      dramaticTension: 65,
      attentionCapture: 90,
      commercialPotential: 40,
      dominantEmotion: 'fear',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative score', () => {
    const result = sceneMetricSchema.safeParse({
      sceneId: createId('scn'),
      emotionalIntensity: -1,
      dramaticTension: 65,
      attentionCapture: 90,
      commercialPotential: 40,
      dominantEmotion: 'fear',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing dominant emotion', () => {
    const result = sceneMetricSchema.safeParse({
      sceneId: createId('scn'),
      emotionalIntensity: 80,
      dramaticTension: 65,
      attentionCapture: 90,
      commercialPotential: 40,
      dominantEmotion: '',
    })
    expect(result.success).toBe(false)
  })
})
