import { describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../types'
import { readEpisodeMeta, updateEpisodeMeta } from '../episodeMeta'

function fakeFileSystem(overrides: Partial<ProjectFileSystem> = {}): ProjectFileSystem {
  return {
    projectName: 'My Project',
    readProjectJson: async () => null,
    writeProjectJson: async () => {},
    readCharactersJson: async () => null,
    writeCharactersJson: async () => {},
    readLocationsJson: async () => null,
    writeLocationsJson: async () => {},
    listEpisodeFountainFileNames: async () => [],
    readEpisodeFountain: async () => '',
    writeEpisodeFountain: async () => {},
    readEpisodeMeta: async () => null,
    writeEpisodeMeta: async () => {},
    readVersionsIndexJson: async () => null,
    writeVersionsIndexJson: async () => {},
    readVersionFountain: async () => '',
    writeVersionFountain: async () => {},
    ...overrides,
  }
}

const beat = { sceneId: 'scn_aaaaaaaaaaaa', act: 2 as const, label: 'Midpoint' }

const analysisReport = {
  id: 'rpt_aaaaaaaaaaaa',
  createdAt: new Date().toISOString(),
  strengths: [],
  mainIssues: [],
  missingOrExcess: [],
  rewritePlan: [],
}

describe('readEpisodeMeta', () => {
  it('returns schema defaults when there is no sidecar file yet', async () => {
    const meta = await readEpisodeMeta(fakeFileSystem(), 'script.fountain')
    expect(meta).toEqual({ analysisReport: null, beats: [] })
  })

  it('returns schema defaults when the sidecar file is malformed', async () => {
    const meta = await readEpisodeMeta(fakeFileSystem({ readEpisodeMeta: async () => '{"beats": "nope"}' }), 'script.fountain')
    expect(meta).toEqual({ analysisReport: null, beats: [] })
  })

  it('parses an existing sidecar file', async () => {
    const meta = await readEpisodeMeta(
      fakeFileSystem({ readEpisodeMeta: async () => JSON.stringify({ beats: [beat] }) }),
      'script.fountain',
    )
    expect(meta.beats).toEqual([beat])
  })
})

describe('updateEpisodeMeta', () => {
  it('merges a patch into the existing meta instead of overwriting the whole file', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ beats: [beat] }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { analysisReport })

    expect(writeEpisodeMeta).toHaveBeenCalledTimes(1)
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
    expect(saved.beats).toEqual([beat])
  })

  it('merges the other way too: updating beats preserves an existing analysisReport', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ analysisReport }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { beats: [beat] })

    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.beats).toEqual([beat])
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
  })
})
