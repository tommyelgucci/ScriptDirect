import type { Editor, JSONContent } from '@tiptap/core'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BlockEditor } from './BlockEditor'

describe('BlockEditor', () => {
  it('reports the live editor instance and fires onChange when the doc is edited', async () => {
    const onChange = vi.fn()
    let liveEditor: Editor | null = null

    render(
      <BlockEditor
        content={{ type: 'doc', content: [{ type: 'action', content: [] }] }}
        onChange={onChange}
        onEditorReady={(editor) => {
          liveEditor = editor
        }}
      />,
    )

    expect(liveEditor).not.toBeNull()

    liveEditor!.commands.insertContent('Rain falls.')

    expect(onChange).toHaveBeenCalled()
    const lastDoc = onChange.mock.calls.at(-1)![0] as JSONContent
    expect(lastDoc.content?.[0].content?.[0].text).toBe('Rain falls.')
  })

  it('cycles the current block type via the live editor', () => {
    let liveEditor: Editor | null = null

    render(
      <BlockEditor
        content={{ type: 'doc', content: [{ type: 'action', content: [] }] }}
        onChange={() => {}}
        onEditorReady={(editor) => {
          liveEditor = editor
        }}
      />,
    )

    liveEditor!.commands.cycleBlockType(1)
    expect(liveEditor!.state.doc.firstChild!.type.name).toBe('character')
  })
})
