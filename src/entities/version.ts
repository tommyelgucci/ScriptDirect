import { z } from 'zod'
import { isoTimestampSchema } from './common'
import { idSchema } from './id'

/** A snapshot of a full Episode's Fountain content at a point in time. */
export const versionSchema = z.object({
  id: idSchema('ver'),
  episodeId: idSchema('ep'),
  createdAt: isoTimestampSchema,
  label: z.string().optional(),
  fountainContent: z.string(),
})
export type Version = z.infer<typeof versionSchema>
