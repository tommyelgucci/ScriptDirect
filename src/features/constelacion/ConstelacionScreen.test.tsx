import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { characterSchema } from '../../entities/character'
import { createId } from '../../entities/id'
import { locationSchema } from '../../entities/location'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { ConstelacionScreen } from './ConstelacionScreen'

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

function renderConstelacionScreen() {
  return render(
    <MemoryRouter initialEntries={['/constelacion']}>
      <Routes>
        <Route path="/" element={<p>Home screen</p>} />
        <Route path="/constelacion" element={<ConstelacionScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConstelacionScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
  })

  it('redirects to home when no project is open', async () => {
    renderConstelacionScreen()
    expect(await screen.findByText('Home screen')).toBeInTheDocument()
  })

  it('shows empty states when there are no characters or locations yet', async () => {
    useAppStore.getState().openProject({ fileSystem: fakeFileSystem(), episodeFileName: 'script.fountain' })

    renderConstelacionScreen()

    expect(await screen.findByText('Todavía no hay personajes.')).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay locaciones.')).toBeInTheDocument()
  })

  it('renders characters and locations sorted by scene count, most-appeared first', async () => {
    const morty = characterSchema.parse({
      id: createId('chr'),
      name: 'MORTY',
      group: 'protagonist',
      sceneIds: ['scn_a', 'scn_b', 'scn_c'],
    })
    const summer = characterSchema.parse({
      id: createId('chr'),
      name: 'SUMMER',
      group: 'supporting',
      sceneIds: ['scn_a'],
    })
    const kitchen = locationSchema.parse({ id: createId('loc'), name: 'KITCHEN', sceneIds: ['scn_a', 'scn_b'] })

    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readCharactersJson: async () => JSON.stringify([summer, morty]),
        readLocationsJson: async () => JSON.stringify([kitchen]),
      }),
      episodeFileName: 'script.fountain',
    })

    renderConstelacionScreen()

    const characterRows = (await screen.findAllByRole('row')).slice(1) // skip header rows across both tables
    const firstDataRow = within(characterRows[0])
    expect(firstDataRow.getByText('MORTY')).toBeInTheDocument()
    expect(firstDataRow.getByText('3')).toBeInTheDocument()

    expect(screen.getByText('KITCHEN')).toBeInTheDocument()
  })
})
