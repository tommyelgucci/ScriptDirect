import { describe, expect, it } from 'vitest'
import type { ProjectFileSystem } from '../fs/types'
import { useAppStore } from './useAppStore'

function fakeFileSystem(): ProjectFileSystem {
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
  }
}

describe('useAppStore', () => {
  it('defaults the UI language to Spanish', () => {
    expect(useAppStore.getState().uiLanguage).toBe('es')
  })

  it('updates the UI language', () => {
    useAppStore.getState().setUiLanguage('en')
    expect(useAppStore.getState().uiLanguage).toBe('en')

    useAppStore.getState().setUiLanguage('es')
    expect(useAppStore.getState().uiLanguage).toBe('es')
  })

  it('has no open project by default', () => {
    expect(useAppStore.getState().project).toBeNull()
  })

  it('opens and closes a project session', () => {
    const fileSystem = fakeFileSystem()
    useAppStore.getState().openProject({ fileSystem, episodeFileName: 'script.fountain' })

    expect(useAppStore.getState().project).toEqual({ fileSystem, episodeFileName: 'script.fountain' })

    useAppStore.getState().closeProject()
    expect(useAppStore.getState().project).toBeNull()
  })

  it('switches the open episode without reopening the folder', () => {
    const fileSystem = fakeFileSystem()
    useAppStore.getState().openProject({ fileSystem, episodeFileName: 's01e01.fountain' })

    useAppStore.getState().setEpisodeFileName('s01e02.fountain')

    expect(useAppStore.getState().project).toEqual({ fileSystem, episodeFileName: 's01e02.fountain' })
    useAppStore.getState().closeProject()
  })

  it('does nothing when no project is open', () => {
    useAppStore.getState().setEpisodeFileName('s01e02.fountain')
    expect(useAppStore.getState().project).toBeNull()
  })
})
