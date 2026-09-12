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
    expect(meta).toEqual({ analysisReport: null, sceneMetrics: [] })
  })

  it('returns schema defaults when the sidecar file is malformed', async () => {
    const meta = await readEpisodeMeta(fakeFileSystem({ readEpisodeMeta: async () => '{"sceneMetrics": "nope"}' }), 'script.fountain')
    expect(meta).toEqual({ analysisReport: null, sceneMetrics: [] })
  })

  it('parses an existing sidecar file', async () => {
    const meta = await readEpisodeMeta(
      fakeFileSystem({ readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: [sceneMetric] }) }),
      'script.fountain',
    )
    expect(meta.sceneMetrics).toEqual([sceneMetric])
  })
})

describe('updateEpisodeMeta', () => {
  it('merges a patch into the existing meta instead of overwriting the whole file', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: [sceneMetric] }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { analysisReport })

    expect(writeEpisodeMeta).toHaveBeenCalledTimes(1)
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
    expect(saved.sceneMetrics).toEqual([sceneMetric])
  })

  it('merges the other way too: updating sceneMetrics preserves an existing analysisReport', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readEpisodeMeta: async () => JSON.stringify({ analysisReport }),
      writeEpisodeMeta,
    })

    await updateEpisodeMeta(fileSystem, 'script.fountain', { sceneMetrics: [sceneMetric] })

    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.sceneMetrics).toEqual([sceneMetric])
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
  })
})
