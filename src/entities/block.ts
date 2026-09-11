import { z } from 'zod'
import { idSchema } from './id'

/**
 * The five block types a writer cycles through with Tab in Bitácora.
 * Mirrors the Fountain elements ScriptDirect currently supports.
 */
export const blockTypeSchema = z.enum(['heading', 'action', 'character', 'dialogue', 'parenthetical'])
export type BlockType = z.infer<typeof blockTypeSchema>

export const blockSchema = z.object({
  id: idSchema('blk'),
  type: blockTypeSchema,
  text: z.string(),
})
export type Block = z.infer<typeof blockSchema>
