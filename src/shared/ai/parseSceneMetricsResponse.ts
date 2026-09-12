import { z } from 'zod'
import { extractJson } from './extractJson'
import type { RawSceneMetric } from './types'

const rawSceneMetricSchema = z.object({
  sceneId: z.string(),
  emotionalIntensity: z.number().min(0).max(100),
  dramaticTension: z.number().min(0).max(100),
  attentionCapture: z.number().min(0).max(100),
  commercialPotential: z.number().min(0).max(100),
  dominantEmotion: z.string(),
})

export class InvalidSceneMetricsResponseError extends Error {
  constructor() {
    super('The AI provider did not return valid scene metrics. Try again.')
    this.name = 'InvalidSceneMetricsResponseError'
  }
}

export function parseSceneMetricsResponse(rawText: string): RawSceneMetric[] {
  let data: unknown
  try {
    data = JSON.parse(extractJson(rawText))
  } catch {
    throw new InvalidSceneMetricsResponseError()
  }

  const parsed = z.array(rawSceneMetricSchema).safeParse(data)
  if (!parsed.success) {
    throw new InvalidSceneMetricsResponseError()
  }
  return parsed.data
}
