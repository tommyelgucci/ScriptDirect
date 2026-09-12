const SEASON_EPISODE_PATTERN = /^s(\d+)e(\d+)$/i

/** "s01e10.fountain" per ARCHITECTURE.md's naming convention. */
export function formatEpisodeFountainFileName(season: number, episodeNumber: number): string {
  return `s${String(season).padStart(2, '0')}e${String(episodeNumber).padStart(2, '0')}.fountain`
}

export interface SeasonAndEpisode {
  season: number
  episodeNumber: number
}

/** Parses "s01e10.fountain" -> { season: 1, episodeNumber: 10 }, or null if it doesn't match the convention. */
export function parseSeasonAndEpisode(fountainFileName: string): SeasonAndEpisode | null {
  const base = fountainFileName.replace(/\.fountain$/, '')
  const match = SEASON_EPISODE_PATTERN.exec(base)
  if (!match) {
    return null
  }
  return { season: Number(match[1]), episodeNumber: Number(match[2]) }
}

/** A human-readable label for an episode list, falling back to the raw file name for legacy/single-script projects. */
export function episodeLabel(fountainFileName: string): string {
  const parsed = parseSeasonAndEpisode(fountainFileName)
  return parsed ? `Temporada ${parsed.season}, Episodio ${parsed.episodeNumber}` : fountainFileName
}
