import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../shared/fs/types'
import { useAppStore } from '../shared/store/useAppStore'
import { HomeScreen } from './HomeScreen'

const { pickProjectFolder } = vi.hoisted(() => ({ pickProjectFolder: vi.fn() }))

vi.mock('../shared/fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../shared/fs')>()),
  pickProjectFolder,
}))

const { FileSystemAccessUnsupportedError } = await import('../shared/fs')

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
    ...overrides,
  }
}

function renderHomeScreen() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/editor" element={<p>Editor screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomeScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
    pickProjectFolder.mockReset()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
  })

  it('creates a project.json for a brand-new folder, opens the project, and navigates to the editor', async () => {
    const writeProjectJson = vi.fn(async () => {})
    const fileSystem = fakeFileSystem({ writeProjectJson })
    pickProjectFolder.mockResolvedValue(fileSystem)

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    await waitFor(() => expect(screen.getByText('Editor screen')).toBeInTheDocument())
    expect(writeProjectJson).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().project?.fileSystem).toBe(fileSystem)
    expect(useAppStore.getState().project?.episodeFileName).toBe('script.fountain')
  })

  it('opens an existing project without rewriting its project.json', async () => {
    const existingProject = JSON.stringify({
      id: 'proj_abc123456789',
      name: 'Existing',
      type: 'movie',
      uiLanguage: 'es',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      episodeIds: [],
    })
    const writeProjectJson = vi.fn(async () => {})
    pickProjectFolder.mockResolvedValue(
      fakeFileSystem({ readProjectJson: async () => existingProject, writeProjectJson }),
    )

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    await waitFor(() => expect(screen.getByText('Editor screen')).toBeInTheDocument())
    expect(writeProjectJson).not.toHaveBeenCalled()
  })

  it('shows a clear message when project.json is invalid, without navigating away', async () => {
    pickProjectFolder.mockResolvedValue(fakeFileSystem({ readProjectJson: async () => '{"not":"a project"}' }))

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no es válido/i)
    expect(screen.queryByText('Editor screen')).not.toBeInTheDocument()
  })

  it('shows the browser-unsupported message when the File System Access API is unavailable', async () => {
    pickProjectFolder.mockRejectedValue(new FileSystemAccessUnsupportedError())

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/chromium/i)
  })
})
