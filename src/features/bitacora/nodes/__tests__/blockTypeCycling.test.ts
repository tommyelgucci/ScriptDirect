import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import { describe, expect, it } from 'vitest'
import { BlockTypeCycling } from '../blockTypeCycling'
import {
  ActionBlockNode,
  CharacterBlockNode,
  DialogueBlockNode,
  HeadingBlockNode,
  ParentheticalBlockNode,
} from '../blockTypeNode'

function createTestEditor(content: object) {
  return new Editor({
    extensions: [
      Document,
      Text,
      HeadingBlockNode,
      ActionBlockNode,
      CharacterBlockNode,
      ParentheticalBlockNode,
      DialogueBlockNode,
      BlockTypeCycling,
    ],
    content,
  })
}

function firstNodeType(editor: Editor): string {
  return editor.state.doc.firstChild!.type.name
}

describe('BlockTypeCycling', () => {
  it('cycles Tab forward through the fixed order, wrapping back to heading', () => {
    const editor = createTestEditor({ type: 'doc', content: [{ type: 'action', content: [] }] })

    expect(firstNodeType(editor)).toBe('action')
    editor.commands.cycleBlockType(1)
    expect(firstNodeType(editor)).toBe('character')
    editor.commands.cycleBlockType(1)
    expect(firstNodeType(editor)).toBe('parenthetical')
    editor.commands.cycleBlockType(1)
    expect(firstNodeType(editor)).toBe('dialogue')
    editor.commands.cycleBlockType(1)
    expect(firstNodeType(editor)).toBe('heading')
    editor.commands.cycleBlockType(1)
    expect(firstNodeType(editor)).toBe('action')

    editor.destroy()
  })

  it('cycles Shift-Tab backward', () => {
    const editor = createTestEditor({ type: 'doc', content: [{ type: 'action', content: [] }] })

    editor.commands.cycleBlockType(-1)
    expect(firstNodeType(editor)).toBe('heading')
    editor.commands.cycleBlockType(-1)
    expect(firstNodeType(editor)).toBe('dialogue')

    editor.destroy()
  })

  it('assigns a fresh sceneId every time a block becomes a heading', () => {
    const editor = createTestEditor({ type: 'doc', content: [{ type: 'action', content: [] }] })

    editor.commands.cycleBlockType(-1) // action -> heading
    const firstSceneId = editor.state.doc.firstChild!.attrs.sceneId as string
    expect(firstSceneId).toMatch(/^scn_[a-z0-9]+$/)

    editor.commands.cycleBlockType(1) // heading -> action
    editor.commands.cycleBlockType(-1) // action -> heading again
    const secondSceneId = editor.state.doc.firstChild!.attrs.sceneId as string

    expect(secondSceneId).toMatch(/^scn_[a-z0-9]+$/)
    expect(secondSceneId).not.toBe(firstSceneId)

    editor.destroy()
  })

  it('preserves text content across a type change', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [{ type: 'action', content: [{ type: 'text', text: 'INT. KITCHEN' }] }],
    })

    editor.commands.cycleBlockType(-1)
    expect(editor.state.doc.firstChild!.textContent).toBe('INT. KITCHEN')

    editor.destroy()
  })

  it('the Tab key itself (not just the command) cycles the block type', () => {
    const editor = createTestEditor({ type: 'doc', content: [{ type: 'action', content: [] }] })
    editor.commands.focus('end')

    editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))

    expect(firstNodeType(editor)).toBe('character')
    editor.destroy()
  })

  it('Enter after a heading starts a new Action block instead of another heading', () => {
    const editor = createTestEditor({
      type: 'doc',
      content: [{ type: 'heading', attrs: { sceneId: 'scn_test' }, content: [{ type: 'text', text: 'INT. KITCHEN' }] }],
    })
    editor.commands.focus('end')

    editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

    expect(editor.state.doc.childCount).toBe(2)
    expect(editor.state.doc.child(1).type.name).toBe('action')
    editor.destroy()
  })
})
