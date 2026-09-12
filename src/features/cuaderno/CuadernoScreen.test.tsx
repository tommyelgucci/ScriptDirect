import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { CuadernoScreen } from './CuadernoScreen'

const EXISTING_DOCUMENT = {
  id: 'doc_existing00001',
  title: 'Biografía de Rick',
  content: 'Un genio alcohólico y nihilista.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

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

function renderCuadernoScreen() {
  return render(
    <MemoryRouter initialEntries={['/cuaderno']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/cuaderno" element={<CuadernoScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CuadernoScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
  })

  it('redirects to home when no project is open', async () => {
    renderCuadernoScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('shows an empty state when there are no documents yet', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderCuadernoScreen()

    expect(await screen.findByText('Todavía no hay documentos.')).toBeInTheDocument()
  })

  it('lists existing documents and opens one on click', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readCuadernoJson: async () => JSON.stringify([EXISTING_DOCUMENT]) }),
      episodeFileName: 'script.fountain',
    })

    renderCuadernoScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Biografía de Rick' }))

    expect(screen.getByLabelText('Título del documento')).toHaveValue('Biografía de Rick')
    expect(screen.getByLabelText('Contenido del documento')).toHaveValue('Un genio alcohólico y nihilista.')
  })

  it('creates a new document and selects it', async () => {
    const writeCuadernoJson = vi.fn(async (_content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ writeCuadernoJson }),
      episodeFileName: 'script.fountain',
    })

    renderCuadernoScreen()
    await screen.findByText('Todavía no hay documentos.')
    await userEvent.type(screen.getByPlaceholderText(/biograf[ií]a de rick/i), 'Notas de Constelación')
    await userEvent.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() => expect(writeCuadernoJson).toHaveBeenCalledTimes(1))
    expect(await screen.findByLabelText('Título del documento')).toHaveValue('Notas de Constelación')
  })

  it('saves a content edit on blur, without touching the title', async () => {
    const writeCuadernoJson = vi.fn(async (_content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readCuadernoJson: async () => JSON.stringify([EXISTING_DOCUMENT]),
        writeCuadernoJson,
      }),
      episodeFileName: 'script.fountain',
    })

    renderCuadernoScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Biografía de Rick' }))
    const contentField = screen.getByLabelText('Contenido del documento')
    await userEvent.type(contentField, ' Más texto.')
    await userEvent.tab()

    await waitFor(() => expect(writeCuadernoJson).toHaveBeenCalledTimes(1))
    const saved = JSON.parse(writeCuadernoJson.mock.calls[0][0])
    expect(saved[0].content).toBe('Un genio alcohólico y nihilista. Más texto.')
    expect(saved[0].title).toBe('Biografía de Rick')
  })

  it('deletes the selected document', async () => {
    const writeCuadernoJson = vi.fn(async (_content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readCuadernoJson: async () => JSON.stringify([EXISTING_DOCUMENT]),
        writeCuadernoJson,
      }),
      episodeFileName: 'script.fountain',
    })

    renderCuadernoScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Biografía de Rick' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar documento' }))

    await waitFor(() => expect(writeCuadernoJson).toHaveBeenCalledTimes(1))
    expect(JSON.parse(writeCuadernoJson.mock.calls[0][0])).toEqual([])
    expect(screen.getByText('Todavía no hay documentos.')).toBeInTheDocument()
  })
})
