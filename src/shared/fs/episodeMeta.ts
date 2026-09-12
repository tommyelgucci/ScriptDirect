import { episodeMetaSchema, type EpisodeMeta } from '../../entities/episode-meta'
import type { ProjectFileSystem } from './types'

/** Parses an episode's sidecar meta file, defaulting every field when it doesn't exist yet. */
export async function readEpisodeMeta(
  fileSystem: ProjectFileSystem,
  fountainFileName: string,
): Promise<EpisodeMeta> {
  const json = await fileSystem.readEpisodeMeta(fountainFileName)
  if (!json) {
    return episodeMetaSchema.parse({})
  }
  const parsed = episodeMetaSchema.safeParse(JSON.parse(json))
  return parsed.success ? parsed.data : episodeMetaSchema.parse({})
}

/**
 * Reads the existing episode meta, merges in `patch`, and writes the result
 * back. `analysisReport` (Brújula) and `sceneMetrics` (Pulso) live in the
 * same sidecar file, so writing one field from scratch would silently reset
 * the other to its schema default — this always reads first to avoid that.
 */
export async function updateEpisodeMeta(
  fileSystem: ProjectFileSystem,
  fountainFileName: string,
  patch: Partial<EpisodeMeta>,
): Promise<EpisodeMeta> {
  const current = await readEpisodeMeta(fileSystem, fountainFileName)
  const next = episodeMetaSchema.parse({ ...current, ...patch })
  await fileSystem.writeEpisodeMeta(fountainFileName, JSON.stringify(next, null, 2))
  return next
}
