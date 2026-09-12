import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import { useAppStore } from '../../shared/store/useAppStore'
import { RutaScreen } from './RutaScreen'

const SCRIPT = ensureSceneIds("INT. KITCHEN - DAY\n\nAction line.\n\nEXT. STREET - NIGHT\n\nMore action.")
const SCENES = parseFountainDocument(SCRIPT)

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

function renderRutaScreen() {
  return render(
    <MemoryRouter initialEntries={['/ruta']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/ruta" element={<RutaScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RutaScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    vi.unstubAllGlobals()
  })

  it('redirects to home when no project is open', async () => {
    renderRutaScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('lists every scene with an id, in script order, defaulting to act 1', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderRutaScreen()

    expect(await screen.findByText('INT. KITCHEN - DAY')).toBeInTheDocument()
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument()
    const actSelects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    expect(actSelects.every((select) => select.value === '1')).toBe(true)
  })

  it('loads previously saved beats', async () => {
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readEpisodeMeta: async () =>
          JSON.stringify({ beats: [{ sceneId: SCENES[1].id, act: 3, label: 'Climax' }] }),
      }),
      episodeFileName: 'script.fountain',
    })

    renderRutaScreen()

    const label = await screen.findByLabelText('Beat de EXT. STREET - NIGHT')
    expect(label).toHaveValue('Climax')
    expect(screen.getByLabelText('Acto de EXT. STREET - NIGHT')).toHaveValue('3')
  })

  it('persists an act change immediately, keeping other rows intact', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ writeEpisodeMeta }),
      episodeFileName: 'script.fountain',
    })

    renderRutaScreen()
    const actSelect = await screen.findByLabelText('Acto de INT. KITCHEN - DAY')
    await userEvent.selectOptions(actSelect, '2')

    await waitFor(() => expect(writeEpisodeMeta).toHaveBeenCalledTimes(1))
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    const saved = JSON.parse(savedJson)
    expect(saved.beats).toEqual([
      { sceneId: SCENES[0].id, act: 2, label: '' },
      { sceneId: SCENES[1].id, act: 1, label: '' },
    ])
  })

  it('persists a beat label on blur', async () => {
    const writeEpisodeMeta = vi.fn(async (_fileName: string, _content: string) => {})
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ writeEpisodeMeta }),
      episodeFileName: 'script.fountain',
    })

    renderRutaScreen()
    const labelInput = await screen.findByLabelText('Beat de INT. KITCHEN - DAY')
    await userEvent.type(labelInput, 'Inciting incident')
    await userEvent.tab()

    await waitFor(() => expect(writeEpisodeMeta).toHaveBeenCalledTimes(1))
    const [, savedJson] = writeEpisodeMeta.mock.calls[0]
    expect(JSON.parse(savedJson).beats[0].label).toBe('Inciting incident')
  })
})
