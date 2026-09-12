import type { Change } from 'diff'
import { diffLines } from 'diff'
import { z } from 'zod'
import { isoTimestampSchema } from '../../entities/common'
import { createId, idSchema } from '../../entities/id'
import type { ProjectFileSystem } from '../../shared/fs/types'

/**
 * A lightweight snapshot record — deliberately not entities/version.ts's
 * `Version` schema, which requires an `episodeId` (idSchema('ep')). The MVP
 * has no persisted Episode entity (see DEFAULT_EPISODE_FILE_NAME in
 * shared/store/useAppStore.ts): a project has exactly one script, and its
 * snapshots live under versions/<script base name>/, so the association is
 * already implicit in the file path. `entities/version.ts` stays the target
 * shape for when real multi-episode support (ROADMAP.md Phase 2+) lands.
 */
export const versionEntrySchema = z.object({
  id: idSchema('ver'),
  createdAt: isoTimestampSchema,
  label: z.string().optional(),
  fileName: z.string(),
})
export type VersionEntry = z.infer<typeof versionEntrySchema>

function versionFileNameFor(createdAt: string): string {
  return `${createdAt.replace(/:/g, '-')}.fountain`
}

export async function listVersions(fileSystem: ProjectFileSystem, episodeFileName: string): Promise<VersionEntry[]> {
  const json = await fileSystem.readVersionsIndexJson(episodeFileName)
  if (!json) {
    return []
  }
  const parsed = z.array(versionEntrySchema).safeParse(JSON.parse(json))
  if (!parsed.success) {
    console.warn('versions index.json is invalid; showing no history.', parsed.error)
    return []
  }
  return parsed.data
}

/** Saves a new snapshot of the given script text, newest first in the index. */
export async function createVersionSnapshot(
  fileSystem: ProjectFileSystem,
  episodeFileName: string,
  scriptText: string,
  label?: string,
): Promise<VersionEntry> {
  const createdAt = new Date().toISOString()
  const entry: VersionEntry = {
    id: createId('ver'),
    createdAt,
    label: label || undefined,
    fileName: versionFileNameFor(createdAt),
  }

  await fileSystem.writeVersionFountain(episodeFileName, entry.fileName, scriptText)

  const existing = await listVersions(fileSystem, episodeFileName)
  await fileSystem.writeVersionsIndexJson(episodeFileName, JSON.stringify([entry, ...existing], null, 2))

  return entry
}

export function readVersionContent(
  fileSystem: ProjectFileSystem,
  episodeFileName: string,
  version: VersionEntry,
): Promise<string> {
  return fileSystem.readVersionFountain(episodeFileName, version.fileName)
}

/** Line-level diff between two Fountain texts (e.g. a saved version vs. the current script). */
export function diffFountainText(oldText: string, newText: string): Change[] {
  return diffLines(oldText, newText)
}
