import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { EpisodesScreen } from './EpisodesScreen'

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

function renderEpisodesScreen() {
  return render(
    <MemoryRouter initialEntries={['/episodios']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/episodios" element={<EpisodesScreen />} />
        <Route path="/editor" element={<p>Editor screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EpisodesScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    vi.unstubAllGlobals()
  })

  it('redirects to home when no project is open', async () => {
    renderEpisodesScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('shows an empty state for a brand-new project with no episodes yet', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderEpisodesScreen()

    expect(await screen.findByText('Todavía no hay episodios en este proyecto.')).toBeInTheDocument()
  })

  it('lists existing episodes with a human-readable label', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ listEpisodeFountainFileNames: async () => ['s01e01.fountain', 'script.fountain'] }),
      episodeFileName: 'script.fountain',
    })

    renderEpisodesScreen()

    expect(await screen.findByRole('button', { name: 'Temporada 1, Episodio 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'script.fountain' })).toBeInTheDocument()
  })

  it('opens an existing episode into Bitácora', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ listEpisodeFountainFileNames: async () => ['s01e01.fountain'] }),
      episodeFileName: 'script.fountain',
    })

    renderEpisodesScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Temporada 1, Episodio 1' }))

    await waitFor(() => expect(screen.getByText('Editor screen')).toBeInTheDocument())
    expect(useAppStore.getState().project?.episodeFileName).toBe('s01e01.fountain')
  })

  it('creates a new episode from season and episode numbers, then opens it', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderEpisodesScreen()
    await screen.findByText('Todavía no hay episodios en este proyecto.')

    await userEvent.clear(screen.getByLabelText('Temporada'))
    await userEvent.type(screen.getByLabelText('Temporada'), '2')
    await userEvent.clear(screen.getByLabelText('Episodio'))
    await userEvent.type(screen.getByLabelText('Episodio'), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Crear episodio' }))

    await waitFor(() => expect(screen.getByText('Editor screen')).toBeInTheDocument())
    expect(useAppStore.getState().project?.episodeFileName).toBe('s02e05.fountain')
  })

  it('rejects creating a duplicate episode', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ listEpisodeFountainFileNames: async () => ['s01e01.fountain'] }),
      episodeFileName: 'script.fountain',
    })

    renderEpisodesScreen()
    await screen.findByRole('button', { name: 'Temporada 1, Episodio 1' })
    await userEvent.click(screen.getByRole('button', { name: 'Crear episodio' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya existe un episodio/i)
    expect(screen.queryByText('Editor screen')).not.toBeInTheDocument()
  })
})
