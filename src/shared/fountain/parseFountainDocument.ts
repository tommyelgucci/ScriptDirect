import { Fountain } from 'fountain-js'
import type { Block, BlockType } from '../../entities/block'
import { createId } from '../../entities/id'
import { parseSceneIdFromNoteText } from './sceneId'

/**
 * The runtime representation of one scene, built by walking fountain-js
 * tokens. `id` is null until `ensureSceneIds` has tagged the source text —
 * callers that need a fully-formed `Scene` (entities/scene.ts) should run
 * `ensureSceneIds` first and re-parse.
 */
export interface ParsedScene {
  id: string | null
  heading: string
  sceneNumber?: string
  blocks: Block[]
}

const TOKEN_TYPE_TO_BLOCK_TYPE: Partial<Record<string, BlockType>> = {
  action: 'action',
  character: 'character',
  dialogue: 'dialogue',
  parenthetical: 'parenthetical',
}

/**
 * Parses Fountain source into scenes. Content before the first scene
 * heading (e.g. a title page) is not modeled as a scene — ScriptDirect's
 * MVP scope starts at the first slugline.
 */
export function parseFountainDocument(source: string): ParsedScene[] {
  const { tokens } = new Fountain().parse(source, true)
  const scenes: ParsedScene[] = []
  let current: ParsedScene | null = null

  for (const token of tokens) {
    if (token.type === 'scene_heading') {
      if (current) {
        scenes.push(current)
      }
      const headingText = token.text ?? ''
      current = {
        id: null,
        heading: headingText,
        sceneNumber: token.scene_number,
        blocks: [{ id: createId('blk'), type: 'heading', text: headingText }],
      }
      continue
    }

    if (!current) {
      continue
    }

    if (token.type === 'note') {
      if (current.id === null) {
        current.id = parseSceneIdFromNoteText(token.text ?? '')
      }
      continue
    }

    const blockType = TOKEN_TYPE_TO_BLOCK_TYPE[token.type]
    if (blockType) {
      current.blocks.push({ id: createId('blk'), type: blockType, text: token.text ?? '' })
    }
  }

  if (current) {
    scenes.push(current)
  }

  return scenes
}
