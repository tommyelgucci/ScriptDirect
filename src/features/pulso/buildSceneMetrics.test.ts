import { describe, expect, it } from 'vitest'
import type { RawSceneMetric } from '../../shared/ai/types'
import { buildSceneMetrics } from './buildSceneMetrics'

function rawMetric(overrides: Partial<RawSceneMetric> = {}): RawSceneMetric {
  return {
    sceneId: 'scn_aaaaaaaaaaaa',
    emotionalIntensity: 80,
    dramaticTension: 60,
    attentionCapture: 90,
    commercialPotential: 40,
    dominantEmotion: 'fear',
    ...overrides,
  }
}

describe('buildSceneMetrics', () => {
  it('keeps entries whose sceneId matches a real scene', () => {
    const result = buildSceneMetrics([rawMetric()], new Set(['scn_aaaaaaaaaaaa']))
    expect(result).toEqual([rawMetric()])
  })

  it('drops entries the model invented for a scene id that does not exist in the script', () => {
    const result = buildSceneMetrics([rawMetric({ sceneId: 'scn_bbbbbbbbbbbb' })], new Set(['scn_aaaaaaaaaaaa']))
    expect(result).toEqual([])
  })

  it('drops a duplicate entry for a scene id already used', () => {
    const result = buildSceneMetrics(
      [rawMetric(), rawMetric({ dominantEmotion: 'joy' })],
      new Set(['scn_aaaaaaaaaaaa']),
    )
    expect(result).toHaveLength(1)
    expect(result[0].dominantEmotion).toBe('fear')
  })

  it('drops an entry with an out-of-range score', () => {
    const result = buildSceneMetrics([rawMetric({ emotionalIntensity: 150 })], new Set(['scn_aaaaaaaaaaaa']))
    expect(result).toEqual([])
  })
})
