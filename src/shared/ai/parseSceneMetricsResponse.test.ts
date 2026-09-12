import { describe, expect, it } from 'vitest'
import { InvalidSceneMetricsResponseError, parseSceneMetricsResponse } from './parseSceneMetricsResponse'

const VALID_ENTRY = {
  sceneId: 'scn_aaaaaaaaaaaa',
  emotionalIntensity: 80,
  dramaticTension: 60,
  attentionCapture: 90,
  commercialPotential: 40,
  dominantEmotion: 'fear',
}

describe('parseSceneMetricsResponse', () => {
  it('parses a plain JSON array response', () => {
    expect(parseSceneMetricsResponse(JSON.stringify([VALID_ENTRY]))).toEqual([VALID_ENTRY])
  })

  it('parses an array wrapped in a markdown code fence', () => {
    const text = `Here are the scores:\n\`\`\`json\n${JSON.stringify([VALID_ENTRY])}\n\`\`\``
    expect(parseSceneMetricsResponse(text)).toEqual([VALID_ENTRY])
  })

  it('throws InvalidSceneMetricsResponseError for unparseable text', () => {
    expect(() => parseSceneMetricsResponse('not json')).toThrow(InvalidSceneMetricsResponseError)
  })

  it('throws InvalidSceneMetricsResponseError when a score is out of range', () => {
    expect(() => parseSceneMetricsResponse(JSON.stringify([{ ...VALID_ENTRY, emotionalIntensity: 200 }]))).toThrow(
      InvalidSceneMetricsResponseError,
    )
  })
})
