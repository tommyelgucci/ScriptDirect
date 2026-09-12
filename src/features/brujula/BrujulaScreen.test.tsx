import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { episodeMetaSchema } from '../../entities/episode-meta'
import { projectSchema } from '../../entities/project'
import { writeApiKey } from '../../shared/ai/apiKeyStorage'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { BrujulaScreen } from './BrujulaScreen'

function fakeFileSystem(overrides: Partial<ProjectFileSystem> = {}): ProjectFileSystem {
  return {
    projectName: 'My Project',
    readProjectJson: async () => null,
    writeProjectJson: async () => {},
    readCharactersJson: async () => null,
    writeCharactersJson: async () => {},
    listEpisodeFountainFileNames: async () => [],
    readEpisodeFountain: async () => 'INT. KITCHEN - DAY\n\nAction line.',
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

function renderBrujulaScreen() {
  return render(
    <MemoryRouter initialEntries={['/brujula']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/brujula" element={<BrujulaScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BrujulaScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('redirects to home when no project is open', async () => {
    renderBrujulaScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('asks the user to configure a provider before analyzing', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderBrujulaScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/configura un proveedor/i)
  })

  it('asks for an API key when a provider is configured but no key is stored', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readProjectJson: async () => projectWithProvider() }),
      episodeFileName: 'script.fountain',
    })

    renderBrujulaScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/falta la clave/i)
  })

  it('analyzes the script, renders findings by section, and persists the report', async () => {
    writeApiKey('anthropic', 'sk-ant-test')
    const sections = {
      strengths: ['Strong hook.'],
      mainIssues: ['Sagging second act.'],
      missingOrExcess: [],
      rewritePlan: [],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ content: [{ text: JSON.stringify(sections) }] }))),
    )
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readProjectJson: async () => projectWithProvider(), writeEpisodeMeta }),
      episodeFileName: 'script.fountain',
    })

    renderBrujulaScreen()
    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(await screen.findByText('Strong hook.')).toBeInTheDocument()
    expect(screen.getByText('Sagging second act.')).toBeInTheDocument()
    expect(writeEpisodeMeta).toHaveBeenCalledTimes(1)
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    expect(episodeMetaSchema.parse(JSON.parse(savedJson)).analysisReport?.strengths[0].text).toBe('Strong hook.')
  })

  it('lets the writer mark a finding as accepted or dismissed, and persists the change', async () => {
    const savedReport = {
      id: 'rpt_aaaaaaaaaaaa',
      createdAt: new Date().toISOString(),
      strengths: [{ id: 'fnd_aaaaaaaaaaaa', text: 'Strong hook.', reviewState: 'unreviewed' as const }],
      mainIssues: [],
      missingOrExcess: [],
      rewritePlan: [],
    }
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readEpisodeMeta: async () => JSON.stringify({ analysisReport: savedReport }),
        writeEpisodeMeta,
      }),
      episodeFileName: 'script.fountain',
    })

    renderBrujulaScreen()
    const findingItem = await screen.findByText('Strong hook.')
    const acceptButton = findingItem.closest('li')!.querySelector('button')!
    await userEvent.click(acceptButton)

    await waitFor(() => expect(writeEpisodeMeta).toHaveBeenCalledTimes(1))
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    expect(JSON.parse(savedJson).analysisReport.strengths[0].reviewState).toBe('accepted')
  })
})
