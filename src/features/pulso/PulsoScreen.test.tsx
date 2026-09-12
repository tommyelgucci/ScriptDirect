import { render, screen } from '@testing-library/react'
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
})
