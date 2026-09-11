import { z } from 'zod'
import { idSchema } from './id'

export const locationSchema = z.object({
  id: idSchema('loc'),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  description: z.string().optional(),
  /** Scene appearances are derived from parsing, not hand-maintained. */
  sceneIds: z.array(idSchema('scn')).default([]),
})
export type Location = z.infer<typeof locationSchema>
