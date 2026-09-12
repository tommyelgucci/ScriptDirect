import type { JSONContent } from '@tiptap/core'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { tiptapDocToFountainText } from './fountainTiptap'
import { syncCharacters } from './syncCharacters'
import { syncLocations } from './syncLocations'

export async function saveDoc(
  fileSystem: ProjectFileSystem,
  episodeFileName: string,
  doc: JSONContent,
): Promise<void> {
  const text = ensureSceneIds(tiptapDocToFountainText(doc))
  await fileSystem.writeEpisodeFountain(episodeFileName, text)
  const scenes = parseFountainDocument(text)
  await syncCharacters(fileSystem, scenes)
  await syncLocations(fileSystem, scenes)
}
