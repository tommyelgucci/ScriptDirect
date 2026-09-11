import type { JSONContent } from '@tiptap/core'

export interface SceneListItem {
  sceneId: string | null
  heading: string
}

export function extractSceneList(doc: JSONContent): SceneListItem[] {
  return (doc.content ?? [])
    .filter((node) => node.type === 'heading')
    .map((node) => ({
      sceneId: (node.attrs?.sceneId as string | null | undefined) ?? null,
      heading: (node.content ?? []).map((child) => child.text ?? '').join('') || '(sin título)',
    }))
}
