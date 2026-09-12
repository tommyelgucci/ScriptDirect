import { z } from 'zod'
import { characterSchema, type Character, type CharacterTraits } from '../../entities/character'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { safeParseJson } from '../../shared/json/safeParseJson'

/** Updates one character's hand-set trait sliders and returns the full updated list. */
export async function updateCharacterTraits(
  fileSystem: ProjectFileSystem,
  characterId: string,
  traits: CharacterTraits,
): Promise<Character[]> {
  const json = await fileSystem.readCharactersJson()
  const parsed = json ? safeParseJson(z.array(characterSchema), json) : null
  const characters = parsed?.success ? parsed.data : []

  const updated = characters.map((character) => (character.id === characterId ? { ...character, traits } : character))

  await fileSystem.writeCharactersJson(JSON.stringify(updated, null, 2))
  return updated
}
