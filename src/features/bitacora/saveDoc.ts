import type { JSONContent } from '@tiptap/core'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { syncCharacters } from './syncCharacters'
import { tiptapDocToFountainText } from './fountainTiptap'

export async function saveDoc(
  fileSystem: ProjectFileSystem,
  episodeFileName: string,
  doc: JSONContent,
): Promise<void> {
  const text = ensureSceneIds(tiptapDocToFountainText(doc))
  await fileSystem.writeEpisodeFountain(episodeFileName, text)
  await syncCharacters(fileSystem, parseFountainDocument(text))
}
