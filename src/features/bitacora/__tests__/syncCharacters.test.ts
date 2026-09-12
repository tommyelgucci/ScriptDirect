import { describe, expect, it, vi } from 'vitest'
import { characterSchema } from '../../../entities/character'
import { createId } from '../../../entities/id'
import { parseFountainDocument } from '../../../shared/fountain'
import type { ProjectFileSystem } from '../../../shared/fs/types'
import { mergeExtractedCharacters, syncCharacters } from '../syncCharacters'

const SCRIPT = `INT. KITCHEN - DAY

[[id:scn_aaaaaaaaaaaa]]

MORTY
You were never supposed to see that.

RICK (V.O.)
Nobody exists on purpose.

EXT. STREET - NIGHT

[[id:scn_bbbbbbbbbbbb]]

MORTY
Aw geez.`

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

describe('mergeExtractedCharacters', () => {
  it('extracts characters with their derived scene appearances', () => {
    const scenes = parseFountainDocument(SCRIPT)
    const merged = mergeExtractedCharacters([], scenes)

    const morty = merged.find((c) => c.name === 'MORTY')
    const rick = merged.find((c) => c.name === 'RICK')

    expect(morty?.sceneIds).toEqual(['scn_aaaaaaaaaaaa', 'scn_bbbbbbbbbbbb'])
    expect(rick?.sceneIds).toEqual(['scn_aaaaaaaaaaaa'])
  })

  it('merges a cue extension like "(V.O.)" into the same character as the bare name', () => {
    const scenes = parseFountainDocument(SCRIPT)
    const merged = mergeExtractedCharacters([], scenes)

    expect(merged.filter((c) => c.name === 'RICK')).toHaveLength(1)
  })

  it('preserves manually-set fields on an existing character while updating sceneIds', () => {
    const existing = characterSchema.parse({
      id: createId('chr'),
      name: 'MORTY',
      group: 'protagonist',
      description: 'The reluctant grandson.',
      sceneIds: [],
    })
    const scenes = parseFountainDocument(SCRIPT)
    const merged = mergeExtractedCharacters([existing], scenes)

    const morty = merged.find((c) => c.id === existing.id)
    expect(morty?.group).toBe('protagonist')
    expect(morty?.description).toBe('The reluctant grandson.')
    expect(morty?.sceneIds).toEqual(['scn_aaaaaaaaaaaa', 'scn_bbbbbbbbbbbb'])
  })

  it('keeps a character no longer appearing in the script, with sceneIds cleared', () => {
    const cutCharacter = characterSchema.parse({
      id: createId('chr'),
      name: 'SUMMER',
      group: 'supporting',
      sceneIds: ['scn_old'],
    })
    const merged = mergeExtractedCharacters([cutCharacter], parseFountainDocument(SCRIPT))

    const summer = merged.find((c) => c.id === cutCharacter.id)
    expect(summer).toBeDefined()
    expect(summer?.sceneIds).toEqual([])
  })
})

describe('syncCharacters', () => {
  it('writes the merged character list to characters.json', async () => {
    const writeCharactersJson = vi.fn(async (_content: string) => {})
    const fileSystem = fakeFileSystem({ writeCharactersJson })

    await syncCharacters(fileSystem, parseFountainDocument(SCRIPT))

    expect(writeCharactersJson).toHaveBeenCalledTimes(1)
    const written = JSON.parse(writeCharactersJson.mock.calls[0][0])
    expect(written.map((c: { name: string }) => c.name).sort()).toEqual(['MORTY', 'RICK'])
  })

  it('starts fresh instead of throwing when characters.json is invalid', async () => {
    const writeCharactersJson = vi.fn(async (_content: string) => {})
    const fileSystem = fakeFileSystem({
      readCharactersJson: async () => '{"not":"an array"}',
      writeCharactersJson,
    })

    await expect(syncCharacters(fileSystem, parseFountainDocument(SCRIPT))).resolves.toBeUndefined()
    expect(writeCharactersJson).toHaveBeenCalledTimes(1)
  })
})
