import type { JSONContent } from '@tiptap/core'
import type { Block, BlockType } from '../../entities/block'
import type { ParsedScene } from '../../shared/fountain'
import { formatSceneIdNote } from '../../shared/fountain'

/**
 * Converts parsed Fountain scenes into a Tiptap document. Each scene's
 * heading block carries the scene's stable id as a node attribute
 * (`sceneId`) rather than as a visible block — that id round-trips back
 * out as the scene's `[[id:scn_xxxx]]` note in `tiptapDocToFountainText`.
 */
export function scenesToTiptapDoc(scenes: ParsedScene[]): JSONContent {
  const nodes = scenes.flatMap((scene) => scene.blocks.map((block, index) => blockToNode(block, index === 0 ? scene.id : null)))

  return {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [{ type: 'action', content: [] }],
  }
}

function blockToNode(block: Block, sceneId: string | null): JSONContent {
  return {
    type: block.type,
    ...(block.type === 'heading' ? { attrs: { sceneId } } : {}),
    content: block.text ? [{ type: 'text', text: block.text }] : [],
  }
}

const DIALOGUE_CONTINUATION_TYPES = new Set<BlockType>(['character', 'parenthetical', 'dialogue'])

/**
 * Serializes a Tiptap document back to Fountain text, isolating each
 * heading's scene-id note with blank lines on both sides (required for
 * fountain-js — and any spec-compliant parser — to treat it as an inert
 * note rather than absorbing it into the next block; see
 * src/shared/fountain/README.md). A heading with no `sceneId` attribute
 * yet (a brand-new scene) is left untagged here; callers should run
 * `ensureSceneIds` on the result before persisting, as a safety net.
 */
export function tiptapDocToFountainText(doc: JSONContent): string {
  const nodes = doc.content ?? []
  const lines: string[] = []

  nodes.forEach((node, index) => {
    const previous = nodes[index - 1]
    const continuesDialogueBlock =
      previous !== undefined &&
      DIALOGUE_CONTINUATION_TYPES.has(previous.type as BlockType) &&
      (node.type === 'parenthetical' || node.type === 'dialogue')

    if (index > 0 && !continuesDialogueBlock) {
      lines.push('')
    }

    lines.push(nodeText(node))

    if (node.type === 'heading') {
      const sceneId = node.attrs?.sceneId as string | null | undefined
      if (sceneId) {
        lines.push('')
        lines.push(formatSceneIdNote(sceneId))
      }
    }
  })

  return lines.join('\n')
}

function nodeText(node: JSONContent): string {
  return (node.content ?? []).map((child) => child.text ?? '').join('')
}
