import { z } from 'zod'
import { analysisReportSchema } from './analysis-report'
import { sceneMetricSchema } from './scene-metric'

/**
 * The shape of an episode's sidecar `*.meta.json` file (see
 * ARCHITECTURE.md's "hybrid Fountain + JSON" storage format). Holds
 * whatever a `.fountain` file can't express: the latest Brújula analysis
 * and Pulso's per-scene metrics today; future sidecar data (beats) extends
 * this same shape.
 */
export const episodeMetaSchema = z.object({
  analysisReport: analysisReportSchema.nullable().default(null),
  sceneMetrics: z.array(sceneMetricSchema).default([]),
})
export type EpisodeMeta = z.infer<typeof episodeMetaSchema>
