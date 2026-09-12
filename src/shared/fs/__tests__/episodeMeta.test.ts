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
    readCuadernoJson: async () => null,
    writeCuadernoJson: async () => {},
    readVersionsIndexJson: async () => null,
    writeVersionsIndexJson: async () => {},
    readVersionFountain: async () => '',
    writeVersionFountain: async () => {},
    listEpisodeFountainFileNames: async () => [],
    readEpisodeFountain: async () => '',
    writeEpisodeFountain: async () => {},
    readEpisodeMeta: async () => null,
    writeEpisodeMeta: async () => {},
    ...overrides,
  }
}

const sceneMetric = {
  sceneId: 'scn_aaaaaaaaaaaa',
  emotionalIntensity: 80,
  dramaticTension: 60,
  attentionCapture: 90,
  commercialPotential: 40,
  dominantEmotion: 'fear',
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
    expect(meta).toEqual({ analysisReport: null, sceneMetrics: [], beats: [] })
  })

  it('returns schema defaults when the sidecar file is malformed', async () => {
    const meta = await readEpisodeMeta(
      fakeFileSystem({ readEpisodeMeta: async () => '{"sceneMetrics": "nope"}' }),
      'script.fountain',
    )
    expect(meta).toEqual({ analysisReport: null, sceneMetrics: [], beats: [] })
  })

  it('parses an existing sidecar file', async () => {
    const meta = await readEpisodeMeta(
      fakeFileSystem({ readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: [sceneMetric], beats: [beat] }) }),
      'script.fountain',
    )
    expect(meta.sceneMetrics).toEqual([sceneMetric])
    expect(meta.beats).toEqual([beat])
  })
})

describe('updateEpisodeMeta', () => {
  it('merges a patch into the existing meta instead of overwriting the whole file', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: [sceneMetric], beats: [beat] }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { analysisReport })

    expect(writeEpisodeMeta).toHaveBeenCalledTimes(1)
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
    expect(saved.sceneMetrics).toEqual([sceneMetric])
    expect(saved.beats).toEqual([beat])
  })

  it('merges the other way too: updating sceneMetrics preserves an existing analysisReport and beats', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ analysisReport, beats: [beat] }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { sceneMetrics: [sceneMetric] })

    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.sceneMetrics).toEqual([sceneMetric])
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
    expect(saved.beats).toEqual([beat])
  })

  it('merges beats in without disturbing an existing analysisReport and sceneMetrics', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ analysisReport, sceneMetrics: [sceneMetric] }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { beats: [beat] })

    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.beats).toEqual([beat])
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
    expect(saved.sceneMetrics).toEqual([sceneMetric])
  })
})
