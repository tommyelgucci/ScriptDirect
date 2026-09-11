import { z } from 'zod'
import { isoTimestampSchema } from './common'
import { idSchema } from './id'

export const findingReviewStateSchema = z.enum(['unreviewed', 'accepted', 'dismissed'])
export type FindingReviewState = z.infer<typeof findingReviewStateSchema>

export const findingSchema = z.object({
  id: idSchema('fnd'),
  text: z.string().min(1),
  reviewState: findingReviewStateSchema.default('unreviewed'),
})
export type Finding = z.infer<typeof findingSchema>

/** Brújula: AI narrative analysis report, with fixed sections. */
export const analysisReportSchema = z.object({
  id: idSchema('rpt'),
  createdAt: isoTimestampSchema,
  strengths: z.array(findingSchema).default([]),
  mainIssues: z.array(findingSchema).default([]),
  missingOrExcess: z.array(findingSchema).default([]),
  rewritePlan: z.array(findingSchema).default([]),
})
export type AnalysisReport = z.infer<typeof analysisReportSchema>
