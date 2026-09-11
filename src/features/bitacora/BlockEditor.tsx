import type { Editor, JSONContent } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import History from '@tiptap/extension-history'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect } from 'react'
import './BlockEditor.css'
import { BlockTypeCycling } from './nodes/blockTypeCycling'
import {
  ActionBlockNode,
  CharacterBlockNode,
  DialogueBlockNode,
  HeadingBlockNode,
  ParentheticalBlockNode,
} from './nodes/blockTypeNode'

interface BlockEditorProps {
  content: JSONContent
  onChange: (doc: JSONContent) => void
  onEditorReady?: (editor: Editor | null) => void
}

export function BlockEditor({ content, onChange, onEditorReady }: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Text,
      History,
      HeadingBlockNode,
      ActionBlockNode,
      CharacterBlockNode,
      ParentheticalBlockNode,
      DialogueBlockNode,
      BlockTypeCycling,
    ],
    content,
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getJSON())
    },
  })

  useEffect(() => {
    onEditorReady?.(editor ?? null)
    return () => onEditorReady?.(null)
  }, [editor, onEditorReady])

  return <EditorContent editor={editor} className="block-editor" />
}
