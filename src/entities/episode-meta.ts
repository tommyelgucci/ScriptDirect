import { z } from 'zod'
import { analysisReportSchema } from './analysis-report'
import { beatSchema } from './beat'

/**
 * The shape of an episode's sidecar `*.meta.json` file (see
 * ARCHITECTURE.md's "hybrid Fountain + JSON" storage format). Holds
 * whatever a `.fountain` file can't express: the latest Brújula analysis
 * and Ruta's act/beat assignments today; future sidecar data (scene
 * metrics) extends this same shape.
 */
export const episodeMetaSchema = z.object({
  analysisReport: analysisReportSchema.nullable().default(null),
  beats: z.array(beatSchema).default([]),
})
export type EpisodeMeta = z.infer<typeof episodeMetaSchema>
