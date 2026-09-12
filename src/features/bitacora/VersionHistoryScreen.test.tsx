import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { VersionHistoryScreen } from './VersionHistoryScreen'

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

function renderVersionHistoryScreen() {
  return render(
    <MemoryRouter initialEntries={['/historial']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/editor" element={<p>Editor screen</p>} />
        <Route path="/historial" element={<VersionHistoryScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VersionHistoryScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    vi.restoreAllMocks()
  })

  it('redirects to home when no project is open', async () => {
    renderVersionHistoryScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('shows an empty state when no version has been saved yet', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderVersionHistoryScreen()

    expect(await screen.findByText(/todavía no has guardado ninguna versión/i)).toBeInTheDocument()
  })

  it('lists saved versions with their label', async () => {
    const index = JSON.stringify([
      { id: 'ver_aaaaaaaaaaaa', createdAt: '2026-08-18T12:00:00.000Z', label: 'Segundo borrador', fileName: 'a.fountain' },
    ])
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readVersionsIndexJson: async () => index }),
      episodeFileName: 'script.fountain',
    })

    renderVersionHistoryScreen()

    expect(await screen.findByText(/segundo borrador/i)).toBeInTheDocument()
  })

  it('shows a line diff against the current script when toggled', async () => {
    const index = JSON.stringify([{ id: 'ver_aaaaaaaaaaaa', createdAt: '2026-08-18T12:00:00.000Z', fileName: 'a.fountain' }])
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readVersionsIndexJson: async () => index,
        readEpisodeFountain: async () => 'INT. KITCHEN - DAY\n\nNew action.',
        readVersionFountain: async () => 'INT. KITCHEN - DAY\n\nOld action.',
      }),
      episodeFileName: 'script.fountain',
    })

    renderVersionHistoryScreen()
    await userEvent.click(await screen.findByRole('button', { name: /ver diferencias/i }))

    expect(await screen.findByText(/old action/i)).toBeInTheDocument()
    expect(screen.getByText(/new action/i)).toBeInTheDocument()
  })

  it('restoring a version snapshots the current script first, then writes the old content and navigates to the editor', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const index = JSON.stringify([{ id: 'ver_aaaaaaaaaaaa', createdAt: '2026-08-18T12:00:00.000Z', fileName: 'a.fountain' }])
    const writeEpisodeFountain = vi.fn(async (_fileName: string, _content: string) => {})
    const writeVersionFountain = vi.fn(async (_fileName: string, _versionFileName: string, _content: string) => {})

    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readVersionsIndexJson: async () => index,
        readEpisodeFountain: async () => 'INT. KITCHEN - DAY\n\nCurrent.',
        readVersionFountain: async () => 'INT. KITCHEN - DAY\n\nOld.',
        writeEpisodeFountain,
        writeVersionFountain,
      }),
      episodeFileName: 'script.fountain',
    })

    renderVersionHistoryScreen()
    await userEvent.click(await screen.findByRole('button', { name: /restaurar/i }))

    expect(await screen.findByText('Editor screen')).toBeInTheDocument()
    expect(writeVersionFountain).toHaveBeenCalled() // snapshot of current content, taken before restoring
    expect(writeEpisodeFountain).toHaveBeenCalled()
    const [, restoredContent] = writeEpisodeFountain.mock.calls.at(-1)!
    expect(restoredContent).toContain('Old.')
  })

  it('does nothing when the user cancels the restore confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const index = JSON.stringify([{ id: 'ver_aaaaaaaaaaaa', createdAt: '2026-08-18T12:00:00.000Z', fileName: 'a.fountain' }])
    const writeEpisodeFountain = vi.fn(async (_fileName: string, _content: string) => {})

    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readVersionsIndexJson: async () => index, writeEpisodeFountain }),
      episodeFileName: 'script.fountain',
    })

    renderVersionHistoryScreen()
    await userEvent.click(await screen.findByRole('button', { name: /restaurar/i }))

    expect(writeEpisodeFountain).not.toHaveBeenCalled()
    expect(screen.queryByText('Editor screen')).not.toBeInTheDocument()
  })
})
