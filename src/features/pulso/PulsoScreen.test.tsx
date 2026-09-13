import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { writeApiKey } from '../../shared/ai/apiKeyStorage'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import { useAppStore } from '../../shared/store/useAppStore'
import { PulsoScreen } from './PulsoScreen'
import { projectSchema } from '../../entities/project'

const SCRIPT = ensureSceneIds("INT. KITCHEN - DAY\n\nAction line.\n\nEXT. STREET - NIGHT\n\nMore action.")
const SCENE_IDS = parseFountainDocument(SCRIPT).map((scene) => scene.id!)

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
    readEpisodeFountain: async () => SCRIPT,
    writeEpisodeFountain: async () => {},
    readEpisodeMeta: async () => null,
    writeEpisodeMeta: async () => {},
    ...overrides,
  }
}

function projectWithProvider() {
  return JSON.stringify(
    projectSchema.parse({
      id: 'proj_abc123456789',
      name: 'Existing',
      type: 'movie',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiProvider: { provider: 'anthropic', model: 'claude-sonnet-5' },
    }),
  )
}

function renderPulsoScreen() {
  return render(
    <MemoryRouter initialEntries={['/pulso']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/pulso" element={<PulsoScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PulsoScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('redirects to home when no project is open', async () => {
    renderPulsoScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('asks the user to configure a provider before analyzing', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderPulsoScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/configura un proveedor/i)
  })

  it('asks for an API key when a provider is configured but no key is stored', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readProjectJson: async () => projectWithProvider() }),
      episodeFileName: 'script.fountain',
    })

    renderPulsoScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/falta la clave/i)
  })

  it('analyzes the script, renders the chart, and persists scene metrics without erasing an existing analysis report', async () => {
    writeApiKey('anthropic', 'sk-ant-test')
    const rawMetrics = SCENE_IDS.map((sceneId, index) => ({
      sceneId,
      emotionalIntensity: 50 + index,
      dramaticTension: 40 + index,
      attentionCapture: 60 + index,
      commercialPotential: 30 + index,
      dominantEmotion: 'fear',
    }))
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ content: [{ text: JSON.stringify(rawMetrics) }] }))),
    )
    const existingAnalysisReport = {
      id: 'rpt_aaaaaaaaaaaa',
      createdAt: new Date().toISOString(),
      strengths: [],
      mainIssues: [],
      missingOrExcess: [],
      rewritePlan: [],
    }
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readProjectJson: async () => projectWithProvider(),
        readEpisodeMeta: async () => JSON.stringify({ analysisReport: existingAnalysisReport }),
        writeEpisodeMeta,
      }),
      episodeFileName: 'script.fountain',
    })

    renderPulsoScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(await screen.findByTestId('pulso-chart')).toBeInTheDocument()
    expect(writeEpisodeMeta).toHaveBeenCalledTimes(1)
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.sceneMetrics).toHaveLength(SCENE_IDS.length)
    expect(saved.analysisReport.id).toBe('rpt_aaaaaaaaaaaa')
  })

  function existingMetrics() {
    return SCENE_IDS.map((sceneId, index) => ({
      sceneId,
      emotionalIntensity: 50 + index,
      dramaticTension: 40 + index,
      attentionCapture: 60 + index,
      commercialPotential: 30 + index,
      dominantEmotion: 'miedo',
    }))
  }

  it('lets the writer hand-correct one scene score without re-running the AI analysis', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: existingMetrics() }),
        writeEpisodeMeta,
      }),
      episodeFileName: 'script.fountain',
    })

    renderPulsoScreen()

    const rows = await screen.findAllByRole('row')
    await userEvent.click(within(rows[1]).getByRole('button', { name: 'Editar' }))

    fireEvent.change(screen.getByRole('slider', { name: 'Intensidad emocional' }), { target: { value: '99' } })
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await within((await screen.findAllByRole('row'))[1]).findByText('99')).toBeInTheDocument()
    expect(writeEpisodeMeta).toHaveBeenCalledTimes(1)
    const saved = JSON.parse(writeEpisodeMeta.mock.calls[0][1])
    expect(saved.sceneMetrics[0].emotionalIntensity).toBe(99)
    expect(saved.sceneMetrics[0].dramaticTension).toBe(existingMetrics()[0].dramaticTension) // untouched
  })

  it('lets the writer dismiss a single scene analysis, after confirming', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: existingMetrics() }),
        writeEpisodeMeta,
      }),
      episodeFileName: 'script.fountain',
    })

    renderPulsoScreen()

    const rows = await screen.findAllByRole('row')
    expect(rows).toHaveLength(3) // header + 2 scenes
    await userEvent.click(within(rows[1]).getByRole('button', { name: 'Descartar' }))

    expect(await screen.findAllByRole('row')).toHaveLength(2) // header + 1 remaining scene
    const saved = JSON.parse(writeEpisodeMeta.mock.calls[0][1])
    expect(saved.sceneMetrics).toHaveLength(1)
    expect(saved.sceneMetrics[0].sceneId).toBe(SCENE_IDS[1])

    vi.restoreAllMocks()
  })

  it('keeps a scene analysis when dismissing is not confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: existingMetrics() }),
        writeEpisodeMeta,
      }),
      episodeFileName: 'script.fountain',
    })

    renderPulsoScreen()

    const rows = await screen.findAllByRole('row')
    await userEvent.click(within(rows[1]).getByRole('button', { name: 'Descartar' }))

    expect(await screen.findAllByRole('row')).toHaveLength(3)
    expect(writeEpisodeMeta).not.toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  // Codex's review flagged that re-analyzing while a scene's editor is open
  // reuses that same SceneMetricEditor instance (same sceneId key), so its
  // local draft kept showing the pre-reanalysis values — saving it would
  // silently overwrite the fresh AI result with stale data.
  it('closes an open scene editor when re-analyzing replaces its metrics', async () => {
    writeApiKey('anthropic', 'sk-ant-test')
    const rawMetrics = SCENE_IDS.map((sceneId, index) => ({
      sceneId,
      emotionalIntensity: 90 + index, // a fresh score, different from the one in the open editor below
      dramaticTension: 40 + index,
      attentionCapture: 60 + index,
      commercialPotential: 30 + index,
      dominantEmotion: 'alivio',
    }))
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ content: [{ text: JSON.stringify(rawMetrics) }] }))),
    )
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readProjectJson: async () => projectWithProvider(),
        readEpisodeMeta: async () => JSON.stringify({ sceneMetrics: existingMetrics() }),
      }),
      episodeFileName: 'script.fountain',
    })

    renderPulsoScreen()

    const rows = await screen.findAllByRole('row')
    await userEvent.click(within(rows[1]).getByRole('button', { name: 'Editar' }))
    expect(screen.getByRole('slider', { name: 'Intensidad emocional' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Volver a analizar' }))
    await waitFor(() => expect(screen.getByRole('cell', { name: '90' })).toBeInTheDocument())

    expect(screen.queryByRole('slider', { name: 'Intensidad emocional' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(1 + SCENE_IDS.length) // header + one row per scene, no editor row open

    vi.restoreAllMocks()
  })
})
