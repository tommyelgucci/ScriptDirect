import { z } from 'zod'
import { characterSchema, type Character } from '../../entities/character'
import { createId } from '../../entities/id'
import type { ParsedScene } from '../../shared/fountain'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { safeParseJson } from '../../shared/json/safeParseJson'

const CHARACTER_EXTENSION_PATTERN = /\s*\([^)]*\)\s*$/

/** Strips cue extensions like "(V.O.)" or "(CONT'D)" so "MORTY (V.O.)" and "MORTY" merge into one character. */
function normalizeCharacterName(rawText: string): string {
  return rawText.replace(CHARACTER_EXTENSION_PATTERN, '').trim()
}

/**
 * Character appearances are derived from the script, not hand-maintained
 * (see ARCHITECTURE.md). This walks every CHARACTER block, groups by
 * normalized name, and merges the result into whatever characters.json
 * already has — preserving manually-set fields (group, description,
 * aliases) and only updating sceneIds. A character no longer appearing in
 * the script keeps its record, with sceneIds cleared, rather than being
 * deleted.
 */
export function mergeExtractedCharacters(existing: Character[], scenes: ParsedScene[]): Character[] {
  const appearances = new Map<string, Set<string>>()

  for (const scene of scenes) {
    if (!scene.id) {
      continue
    }
    for (const block of scene.blocks) {
      if (block.type !== 'character' || !block.text.trim()) {
        continue
      }
      const name = normalizeCharacterName(block.text)
      if (!name) {
        continue
      }
      const sceneIds = appearances.get(name) ?? new Set<string>()
      sceneIds.add(scene.id)
      appearances.set(name, sceneIds)
    }
  }

  const byNormalizedName = new Map(existing.map((character) => [normalizeCharacterName(character.name), character]))
  const merged: Character[] = []

  for (const [name, sceneIds] of appearances) {
    const current = byNormalizedName.get(name)
    byNormalizedName.delete(name)
    merged.push(
      current
        ? { ...current, sceneIds: Array.from(sceneIds) }
        : characterSchema.parse({
            id: createId('chr'),
            name,
            group: 'supporting',
            sceneIds: Array.from(sceneIds),
          }),
    )
  }

  for (const remaining of byNormalizedName.values()) {
    merged.push({ ...remaining, sceneIds: [] })
  }

  return merged
}

export async function syncCharacters(fileSystem: ProjectFileSystem, scenes: ParsedScene[]): Promise<void> {
  const existingJson = await fileSystem.readCharactersJson()
  let existing: Character[] = []
  if (existingJson) {
    const parsed = safeParseJson(z.array(characterSchema), existingJson)
    if (parsed.success) {
      existing = parsed.data
    } else {
      console.warn('characters.json is invalid; starting fresh from script auto-extraction.', parsed.error)
    }
  }

  const merged = mergeExtractedCharacters(existing, scenes)
  await fileSystem.writeCharactersJson(JSON.stringify(merged, null, 2))
}
