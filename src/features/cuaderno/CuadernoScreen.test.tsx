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
        <Route path="/editor" element={<p>Editor screen</p>} />
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

  // Codex's review of PR #22: content only persisted on blur, and closing
  // the tab/window (or otherwise unmounting) while the field is still
  // focused never fires blur, so the edit was silently dropped despite
  // Chromium/Tauri otherwise autosaving to real disk. Unmounting directly
  // (rather than clicking a link to navigate away) is deliberate: a click
  // on another element naturally blurs the previously focused field first,
  // which would make the old, buggy onBlur-only code pass this test too.
  it('flushes a pending edit when the component unmounts, without ever blurring the field', async () => {
    const writeCuadernoJson = vi.fn(async (_content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readCuadernoJson: async () => JSON.stringify([EXISTING_DOCUMENT]),
        writeCuadernoJson,
      }),
      episodeFileName: 'script.fountain',
    })

    const { unmount } = renderCuadernoScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Biografía de Rick' }))
    await userEvent.type(screen.getByLabelText('Contenido del documento'), ' Más texto.')
    unmount()

    await waitFor(() => expect(writeCuadernoJson).toHaveBeenCalledTimes(1))
    expect(JSON.parse(writeCuadernoJson.mock.calls[0][0])[0].content).toBe(
      'Un genio alcohólico y nihilista. Más texto.',
    )
  })

  // Clicking another document's button naturally blurs the field first (a
  // real interaction, not the unmount-without-blur gap above), so this was
  // never actually broken — it just confirms the new debounce/flush
  // plumbing doesn't regress it.
  it('still saves one document before switching to another on click', async () => {
    const other = { ...EXISTING_DOCUMENT, id: 'doc_other00000001', title: 'Otro documento', content: 'Otro contenido' }
    const writeCuadernoJson = vi.fn(async (_content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readCuadernoJson: async () => JSON.stringify([EXISTING_DOCUMENT, other]),
        writeCuadernoJson,
      }),
      episodeFileName: 'script.fountain',
    })

    renderCuadernoScreen()
    await userEvent.click(await screen.findByRole('button', { name: 'Biografía de Rick' }))
    await userEvent.type(screen.getByLabelText('Contenido del documento'), ' Más texto.')
    await userEvent.click(screen.getByRole('button', { name: 'Otro documento' }))

    await waitFor(() => expect(writeCuadernoJson).toHaveBeenCalledTimes(1))
    const saved = JSON.parse(writeCuadernoJson.mock.calls[0][0])
    expect(saved.find((document: { id: string }) => document.id === EXISTING_DOCUMENT.id).content).toBe(
      'Un genio alcohólico y nihilista. Más texto.',
    )
    expect(screen.getByLabelText('Contenido del documento')).toHaveValue('Otro contenido')
  })
})
