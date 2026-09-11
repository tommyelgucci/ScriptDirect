import { Extension } from '@tiptap/core'
import type { BlockType } from '../../../entities/block'
import { createSceneId } from '../../../shared/fountain'
import { BLOCK_TYPE_ORDER } from './blockTypeNode'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockTypeCycling: {
      cycleBlockType: (direction: 1 | -1) => ReturnType
    }
  }
}

/**
 * Final-Draft-style keyboard flow, simplified for the MVP:
 *
 * - Tab / Shift-Tab cycle the current block through BLOCK_TYPE_ORDER,
 *   rather than Final Draft's full context-sensitive element rules.
 * - Enter splits into a new block of the same type — except leaving a
 *   heading, where the next block defaults to Action (finishing a
 *   slugline and pressing Enter almost always means "start the action").
 *
 * Converting a block *into* heading always assigns it a fresh scene id
 * (BLOCK_TYPE_ORDER guarantees you can only arrive at heading by cycling
 * away from some other type, never by cycling in place) — see
 * fountainTiptap.ts for how that id round-trips to a Fountain note.
 */
export const BlockTypeCycling = Extension.create({
  name: 'blockTypeCycling',

  addCommands() {
    return {
      cycleBlockType:
        (direction: 1 | -1) =>
        ({ editor, chain }) => {
          const currentType = editor.state.selection.$from.parent.type.name as BlockType
          const currentIndex = BLOCK_TYPE_ORDER.indexOf(currentType)
          if (currentIndex === -1) {
            return false
          }

          const nextIndex = (currentIndex + direction + BLOCK_TYPE_ORDER.length) % BLOCK_TYPE_ORDER.length
          const nextType = BLOCK_TYPE_ORDER[nextIndex]
          const attrs = nextType === 'heading' ? { sceneId: createSceneId() } : undefined

          return chain().setNode(nextType, attrs).run()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.cycleBlockType(1),
      'Shift-Tab': () => this.editor.commands.cycleBlockType(-1),
      Enter: () => {
        const currentType = this.editor.state.selection.$from.parent.type.name as BlockType
        if (currentType !== 'heading') {
          return false
        }
        return this.editor.chain().splitBlock().setNode('action').run()
      },
    }
  },
})
