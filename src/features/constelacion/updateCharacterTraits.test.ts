import { describe, expect, it, vi } from 'vitest'
import { characterSchema } from '../../entities/character'
import { createId } from '../../entities/id'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { updateCharacterTraits } from './updateCharacterTraits'

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

describe('updateCharacterTraits', () => {
  it('sets traits on the matching character, leaving others untouched', async () => {
    const morty = characterSchema.parse({ id: createId('chr'), name: 'MORTY', group: 'protagonist', sceneIds: [] })
    const summer = characterSchema.parse({ id: createId('chr'), name: 'SUMMER', group: 'supporting', sceneIds: [] })
    const writeCharactersJson = vi.fn(async (_content: string) => {})
    const fileSystem = fakeFileSystem({
      readCharactersJson: async () => JSON.stringify([morty, summer]),
      writeCharactersJson,
    })

    const updated = await updateCharacterTraits(fileSystem, morty.id, { empathy: 70 })

    expect(updated.find((c) => c.id === morty.id)?.traits).toEqual({ empathy: 70 })
    expect(updated.find((c) => c.id === summer.id)?.traits).toBeUndefined()
    expect(writeCharactersJson).toHaveBeenCalledTimes(1)
  })

  it('returns an empty list when characters.json does not exist yet', async () => {
    const updated = await updateCharacterTraits(fakeFileSystem(), 'chr_missing', { empathy: 50 })
    expect(updated).toEqual([])
  })
})
