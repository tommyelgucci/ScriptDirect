import { z } from 'zod'
import { idSchema } from './id'

export const characterGroupSchema = z.enum(['protagonist', 'antagonist', 'supporting', 'extra'])
export type CharacterGroup = z.infer<typeof characterGroupSchema>

export const characterSchema = z.object({
  id: idSchema('chr'),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  group: characterGroupSchema,
  description: z.string().optional(),
  /** Scene appearances are derived from parsing, not hand-maintained. */
  sceneIds: z.array(idSchema('scn')).default([]),
})
export type Character = z.infer<typeof characterSchema>
