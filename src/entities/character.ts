import { z } from 'zod'
import { idSchema } from './id'

export const characterGroupSchema = z.enum(['protagonist', 'antagonist', 'supporting', 'extra'])
export type CharacterGroup = z.infer<typeof characterGroupSchema>

const traitScoreSchema = z.number().min(0).max(100)

/**
 * Character profile sliders (ROADMAP.md Phase 2+). Hand-set by the writer —
 * unlike sceneIds, these are never derived or auto-extracted. All optional,
 * since an auto-extracted character has none of these until the writer sets
 * them.
 */
export const characterTraitsSchema = z.object({
  empathy: traitScoreSchema.optional(),
  moralAmbiguity: traitScoreSchema.optional(),
  volatility: traitScoreSchema.optional(),
})
export type CharacterTraits = z.infer<typeof characterTraitsSchema>

export const characterSchema = z.object({
  id: idSchema('chr'),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  group: characterGroupSchema,
  description: z.string().optional(),
  /** Scene appearances are derived from parsing, not hand-maintained. */
  sceneIds: z.array(idSchema('scn')).default([]),
  traits: characterTraitsSchema.optional(),
})
export type Character = z.infer<typeof characterSchema>
