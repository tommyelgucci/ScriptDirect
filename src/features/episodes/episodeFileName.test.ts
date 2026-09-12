import { describe, expect, it } from 'vitest'
import { episodeLabel, formatEpisodeFountainFileName, parseSeasonAndEpisode } from './episodeFileName'

describe('formatEpisodeFountainFileName', () => {
  it('pads season and episode numbers to two digits', () => {
    expect(formatEpisodeFountainFileName(1, 10)).toBe('s01e10.fountain')
  })

  it('does not truncate numbers wider than two digits', () => {
    expect(formatEpisodeFountainFileName(12, 123)).toBe('s12e123.fountain')
  })
})

describe('parseSeasonAndEpisode', () => {
  it('parses a well-formed episode file name', () => {
    expect(parseSeasonAndEpisode('s01e10.fountain')).toEqual({ season: 1, episodeNumber: 10 })
  })

  it('returns null for a file name that does not follow the convention', () => {
    expect(parseSeasonAndEpisode('script.fountain')).toBeNull()
  })
})

describe('episodeLabel', () => {
  it('formats a season/episode file name as a human label', () => {
    expect(episodeLabel('s01e10.fountain')).toBe('Temporada 1, Episodio 10')
  })

  it('falls back to the raw file name for a legacy single-script project', () => {
    expect(episodeLabel('script.fountain')).toBe('script.fountain')
  })
})
