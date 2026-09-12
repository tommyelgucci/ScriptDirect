import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../shared/fs/types'
import { useAppStore } from '../shared/store/useAppStore'
import { HomeScreen } from './HomeScreen'

const { pickProjectFolder, pickProjectZipFile } = vi.hoisted(() => ({
  pickProjectFolder: vi.fn(),
  pickProjectZipFile: vi.fn(),
}))

vi.mock('../shared/fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../shared/fs')>()),
  pickProjectFolder,
  pickProjectZipFile,
}))

const { FileSystemAccessUnsupportedError, ZipProjectFileSystem } = await import('../shared/fs')

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

function renderHomeScreen() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/episodios" element={<p>Episodes screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomeScreen (Chromium: File System Access API available)', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
    pickProjectFolder.mockReset()
    ;(window as { showDirectoryPicker?: unknown }).showDirectoryPicker = async () => {
      throw new Error('not used — pickProjectFolder is mocked directly in these tests')
    }
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker
  })

  it('creates a project.json for a brand-new folder, opens the project, and navigates to the editor', async () => {
    const writeProjectJson = vi.fn(async () => {})
    const fileSystem = fakeFileSystem({ writeProjectJson })
    pickProjectFolder.mockResolvedValue(fileSystem)

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    await waitFor(() => expect(screen.getByText('Episodes screen')).toBeInTheDocument())
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

    await waitFor(() => expect(screen.getByText('Episodes screen')).toBeInTheDocument())
    expect(writeProjectJson).not.toHaveBeenCalled()
  })

  it('shows a clear message when project.json is invalid, without navigating away', async () => {
    pickProjectFolder.mockResolvedValue(fakeFileSystem({ readProjectJson: async () => '{"not":"a project"}' }))

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no es válido/i)
    expect(screen.queryByText('Episodes screen')).not.toBeInTheDocument()
  })

  it('shows the browser-unsupported message if pickProjectFolder throws anyway', async () => {
    pickProjectFolder.mockRejectedValue(new FileSystemAccessUnsupportedError())

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /abrir carpeta de proyecto/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/\.zip/i)
  })
})

describe('HomeScreen (Safari/Firefox: ZIP fallback)', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
    pickProjectZipFile.mockReset()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    vi.restoreAllMocks()
  })

  it('shows the .zip import/create UI instead of the folder picker button', () => {
    renderHomeScreen()

    expect(screen.queryByRole('button', { name: /abrir carpeta de proyecto/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /importar proyecto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear nuevo proyecto/i })).toBeInTheDocument()
  })

  it('imports a project from a previously exported .zip and navigates to the editor', async () => {
    const exported = ZipProjectFileSystem.createEmpty('From Zip')
    await exported.writeProjectJson(
      JSON.stringify({
        id: 'proj_abc123456789',
        name: 'From Zip',
        type: 'movie',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    )
    const zipBytes = await exported.exportZip()
    pickProjectZipFile.mockResolvedValue(new File([new Uint8Array(zipBytes)], 'From Zip.zip', { type: 'application/zip' }))

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /importar proyecto/i }))

    await waitFor(() => expect(screen.getByText('Episodes screen')).toBeInTheDocument())
    expect(useAppStore.getState().project?.fileSystem).toBeInstanceOf(ZipProjectFileSystem)
    expect(useAppStore.getState().project?.fileSystem.projectName).toBe('From Zip')
  })

  it('shows a clear message when the .zip has no project.json', async () => {
    const emptyZip = await ZipProjectFileSystem.createEmpty('Empty').exportZip()
    pickProjectZipFile.mockResolvedValue(new File([new Uint8Array(emptyZip)], 'Empty.zip', { type: 'application/zip' }))

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /importar proyecto/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/project\.json/i)
    expect(screen.queryByText('Episodes screen')).not.toBeInTheDocument()
  })

  it('shows a clear message when the file is not a valid .zip', async () => {
    pickProjectZipFile.mockResolvedValue(new File(['not a zip'], 'broken.zip', { type: 'application/zip' }))

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /importar proyecto/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo leer/i)
  })

  it('does nothing when the .zip picker is dismissed', async () => {
    pickProjectZipFile.mockResolvedValue(null)

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /importar proyecto/i }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.queryByText('Episodes screen')).not.toBeInTheDocument()
  })

  it('creates a new in-memory project from a prompted name and navigates to the editor', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('My New Project')

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /crear nuevo proyecto/i }))

    await waitFor(() => expect(screen.getByText('Episodes screen')).toBeInTheDocument())
    const fileSystem = useAppStore.getState().project?.fileSystem
    expect(fileSystem).toBeInstanceOf(ZipProjectFileSystem)
    expect(fileSystem?.projectName).toBe('My New Project')
    expect(await fileSystem?.readProjectJson()).not.toBeNull()
  })

  it('does nothing when the new-project name prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null)

    renderHomeScreen()
    await userEvent.click(screen.getByRole('button', { name: /crear nuevo proyecto/i }))

    expect(useAppStore.getState().project).toBeNull()
    expect(screen.queryByText('Episodes screen')).not.toBeInTheDocument()
  })
})
