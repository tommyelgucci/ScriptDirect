import { mergeAttributes, Node } from '@tiptap/core'
import type { BlockType } from '../../../entities/block'

/**
 * Tab-cycle order for Bitácora's block types. See blockTypeCycling.ts for
 * how Tab/Shift-Tab move through it.
 */
export const BLOCK_TYPE_ORDER: BlockType[] = ['heading', 'action', 'character', 'parenthetical', 'dialogue']

function createBlockTypeNode(name: BlockType) {
  return Node.create({
    name,
    group: 'block',
    content: 'text*',

    addAttributes() {
      if (name !== 'heading') {
        return {}
      }
      // Stable scene id, round-tripped as the scene's [[id:scn_xxxx]] Fountain
      // note rather than as visible text — see fountainTiptap.ts.
      return { sceneId: { default: null } }
    },

    parseHTML() {
      return [{ tag: `div[data-block-type="${name}"]` }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-block-type': name, class: `block block--${name}` }),
        0,
      ]
    },
  })
}

export const HeadingBlockNode = createBlockTypeNode('heading')
export const ActionBlockNode = createBlockTypeNode('action')
export const CharacterBlockNode = createBlockTypeNode('character')
export const ParentheticalBlockNode = createBlockTypeNode('parenthetical')
export const DialogueBlockNode = createBlockTypeNode('dialogue')
