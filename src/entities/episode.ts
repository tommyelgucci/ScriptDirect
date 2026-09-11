import { z } from 'zod'
import { idSchema } from './id'

/** Matches the `episodes/s01e10.fountain` naming convention from ARCHITECTURE.md. */
export const fountainFileNameSchema = z.string().regex(/^[\w.-]+\.fountain$/, 'Expected a *.fountain file name')

export const episodeSchema = z.object({
  id: idSchema('ep'),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  seasonNumber: z.number().int().positive().optional(),
  episodeNumber: z.number().int().positive().optional(),
  fountainFileName: fountainFileNameSchema,
  sceneIds: z.array(idSchema('scn')).default([]),
})
export type Episode = z.infer<typeof episodeSchema>
