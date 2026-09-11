import { z } from 'zod'
import { scoreSchema } from './common'
import { idSchema } from './id'

/** Pulso: per-scene emotional/tension metrics. One SceneMetric per Scene. */
export const sceneMetricSchema = z.object({
  sceneId: idSchema('scn'),
  emotionalIntensity: scoreSchema,
  dramaticTension: scoreSchema,
  attentionCapture: scoreSchema,
  commercialPotential: scoreSchema,
  dominantEmotion: z.string().min(1),
})
export type SceneMetric = z.infer<typeof sceneMetricSchema>
