import { z } from 'zod'
import { analysisReportSchema } from './analysis-report'

/**
 * The shape of an episode's sidecar `*.meta.json` file (see
 * ARCHITECTURE.md's "hybrid Fountain + JSON" storage format). Holds
 * whatever a `.fountain` file can't express. Currently just the latest
 * Brújula analysis; future sidecar data (beats, scene metrics) extends
 * this same shape.
 */
export const episodeMetaSchema = z.object({
  analysisReport: analysisReportSchema.nullable().default(null),
})
export type EpisodeMeta = z.infer<typeof episodeMetaSchema>
