import { z } from 'zod'
import { locationSchema, type Location } from '../../entities/location'
import { createId } from '../../entities/id'
import type { ParsedScene } from '../../shared/fountain'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { safeParseJson } from '../../shared/json/safeParseJson'

const SCENE_HEADING_PREFIX = /^\s*(?:int\.?\s*\/\s*ext\.?|i\.?\s*\/\s*e\.?|int\.?|ext\.?|est\.?)[.\s]+/i

/**
 * Extracts a location name from a scene heading, e.g.
 * "INT. MORTY'S HOME - KITCHEN - LATER" -> "MORTY'S HOME - KITCHEN"
 * (the last " - "-separated segment is treated as the time of day, not
 * part of the location). Basic heuristic, per ROADMAP.md — doesn't handle
 * every real-world heading variant.
 */
export function extractLocationName(headingText: string): string | null {
  const withoutPrefix = headingText.replace(SCENE_HEADING_PREFIX, '').trim()
  if (!withoutPrefix) {
    return null
  }
  const lastDashIndex = withoutPrefix.lastIndexOf(' - ')
  const location = lastDashIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, lastDashIndex)
  return location.trim() || null
}

/**
 * Location appearances are derived from the script, not hand-maintained
 * (see ARCHITECTURE.md) — same pattern as syncCharacters.ts. A location no
 * longer appearing in the script keeps its record, with sceneIds cleared,
 * rather than being deleted.
 */
export function mergeExtractedLocations(existing: Location[], scenes: ParsedScene[]): Location[] {
  const appearances = new Map<string, Set<string>>()

  for (const scene of scenes) {
    if (!scene.id) {
      continue
    }
    const name = extractLocationName(scene.heading)
    if (!name) {
      continue
    }
    const sceneIds = appearances.get(name) ?? new Set<string>()
    sceneIds.add(scene.id)
    appearances.set(name, sceneIds)
  }

  const byName = new Map(existing.map((location) => [location.name, location]))
  const merged: Location[] = []

  for (const [name, sceneIds] of appearances) {
    const current = byName.get(name)
    byName.delete(name)
    merged.push(
      current
        ? { ...current, sceneIds: Array.from(sceneIds) }
        : locationSchema.parse({ id: createId('loc'), name, sceneIds: Array.from(sceneIds) }),
    )
  }

  for (const remaining of byName.values()) {
    merged.push({ ...remaining, sceneIds: [] })
  }

  return merged
}

export async function syncLocations(fileSystem: ProjectFileSystem, scenes: ParsedScene[]): Promise<void> {
  const existingJson = await fileSystem.readLocationsJson()
  let existing: Location[] = []
  if (existingJson) {
    const parsed = safeParseJson(z.array(locationSchema), existingJson)
    if (parsed.success) {
      existing = parsed.data
    } else {
      console.warn('locations.json is invalid; starting fresh from script auto-extraction.', parsed.error)
    }
  }

  const merged = mergeExtractedLocations(existing, scenes)
  await fileSystem.writeLocationsJson(JSON.stringify(merged, null, 2))
}
