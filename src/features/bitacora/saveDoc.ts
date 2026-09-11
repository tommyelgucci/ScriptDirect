import type { JSONContent } from '@tiptap/core'
import { ensureSceneIds } from '../../shared/fountain'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { tiptapDocToFountainText } from './fountainTiptap'

export async function saveDoc(
  fileSystem: ProjectFileSystem,
  episodeFileName: string,
  doc: JSONContent,
): Promise<void> {
  const text = ensureSceneIds(tiptapDocToFountainText(doc))
  await fileSystem.writeEpisodeFountain(episodeFileName, text)
}
