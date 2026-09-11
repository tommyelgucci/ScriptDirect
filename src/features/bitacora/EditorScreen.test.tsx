import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { EditorScreen } from './EditorScreen'
import { scenesToTiptapDoc } from './fountainTiptap'
import { saveDoc } from './saveDoc'

function fakeFileSystem(overrides: Partial<ProjectFileSystem> = {}): ProjectFileSystem {
  return {
    projectName: 'My Project',
    readProjectJson: async () => null,
    writeProjectJson: async () => {},
    readCharactersJson: async () => null,
    writeCharactersJson: async () => {},
    listEpisodeFountainFileNames: async () => [],
    readEpisodeFountain: async () => '',
    writeEpisodeFountain: async () => {},
    readEpisodeMeta: async () => null,
    writeEpisodeMeta: async () => {},
    ...overrides,
  }
}

function renderEditorScreen() {
  return render(
    <MemoryRouter initialEntries={['/editor']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/editor" element={<EditorScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('saveDoc', () => {
  it('runs ensureSceneIds on the serialized text before writing it', async () => {
    const writeEpisodeFountain = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({ writeEpisodeFountain })
    const doc = scenesToTiptapDoc([])
    // Simulate a brand-new, untagged heading reaching save.
    doc.content = [{ type: 'heading', attrs: { sceneId: null }, content: [{ type: 'text', text: 'INT. KITCHEN' }] }]

    await saveDoc(fileSystem, 'script.fountain', doc)

    expect(writeEpisodeFountain).toHaveBeenCalledTimes(1)
    const [fileName, text] = writeEpisodeFountain.mock.calls[0]
    expect(fileName).toBe('script.fountain')
    expect(text).toContain('[[id:scn_')
  })
})

describe('EditorScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
  })

  it('redirects to home when no project is open', async () => {
    renderEditorScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('loads an existing script and lists its scenes in the sidebar', async () => {
    const fileSystem = fakeFileSystem({
      readEpisodeFountain: async () =>
        "INT. KITCHEN - DAY\n\n[[id:scn_abc123456789]]\n\nAction line.",
    })
    useAppStore.getState().openProject({ fileSystem, episodeFileName: 'script.fountain' })

    renderEditorScreen()

    const sidebar = await screen.findByRole('navigation', { name: 'Escenas' })
    expect(within(sidebar).getByText('INT. KITCHEN - DAY')).toBeInTheDocument()
    expect(screen.getByText('My Project')).toBeInTheDocument()
  })

  it('starts a brand-new project with an empty script and no scenes', async () => {
    const fileSystem = fakeFileSystem({
      readEpisodeFountain: async () => {
        throw new DOMException('script.fountain not found', 'NotFoundError')
      },
    })
    useAppStore.getState().openProject({ fileSystem, episodeFileName: 'script.fountain' })

    renderEditorScreen()

    expect(await screen.findByText('Todavía no hay escenas.')).toBeInTheDocument()
  })

  it('shows a clear error message when the script fails to load for another reason', async () => {
    const fileSystem = fakeFileSystem({
      readEpisodeFountain: async () => {
        throw new Error('disk on fire')
      },
    })
    useAppStore.getState().openProject({ fileSystem, episodeFileName: 'script.fountain' })

    renderEditorScreen()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo abrir/i)
  })

  it('closing the project navigates back to home', async () => {
    const fileSystem = fakeFileSystem({ readEpisodeFountain: async () => '' })
    useAppStore.getState().openProject({ fileSystem, episodeFileName: 'script.fountain' })

    renderEditorScreen()
    await userEvent.click(await screen.findByRole('button', { name: /cerrar proyecto/i }))

    expect(await screen.findByText('Home screen')).toBeInTheDocument()
    expect(useAppStore.getState().project).toBeNull()
  })
})
