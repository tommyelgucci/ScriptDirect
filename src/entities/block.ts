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

/**
 * Character, Parenthetical, and Dialogue blocks stay adjacent — no blank
 * line — when they continue the same dialogue exchange. Shared by the
 * Fountain serializer (fountainTiptap.ts) and the PDF exporter so the two
 * renderings of "is this block part of the same chunk as the previous
 * one" never drift apart.
 */
export const DIALOGUE_CONTINUATION_BLOCK_TYPES = new Set<BlockType>(['character', 'parenthetical', 'dialogue'])
