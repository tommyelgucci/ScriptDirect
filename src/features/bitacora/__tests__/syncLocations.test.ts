import { describe, expect, it, vi } from 'vitest'
import { locationSchema } from '../../../entities/location'
import { createId } from '../../../entities/id'
import { parseFountainDocument } from '../../../shared/fountain'
import type { ProjectFileSystem } from '../../../shared/fs/types'
import { extractLocationName, mergeExtractedLocations, syncLocations } from '../syncLocations'

const SCRIPT = `INT. MORTY'S HOME - KITCHEN - LATER

[[id:scn_aaaaaaaaaaaa]]

Morty stares at the knife.

EXT. STREET - NIGHT

[[id:scn_bbbbbbbbbbbb]]

Rain falls.

INT. MORTY'S HOME - KITCHEN - LATER

[[id:scn_cccccccccccc]]

He puts the knife down.`

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

describe('extractLocationName', () => {
  it('drops the INT./EXT. prefix and the trailing time-of-day segment', () => {
    expect(extractLocationName("INT. MORTY'S HOME - KITCHEN - LATER")).toBe("MORTY'S HOME - KITCHEN")
    expect(extractLocationName('EXT. STREET - NIGHT')).toBe('STREET')
  })

  it('handles a heading with no time-of-day segment', () => {
    expect(extractLocationName('INT. KITCHEN')).toBe('KITCHEN')
  })

  it('handles a combined INT./EXT. prefix', () => {
    expect(extractLocationName('INT./EXT. CAR - DAY')).toBe('CAR')
  })
})

describe('mergeExtractedLocations', () => {
  it('extracts locations with their derived scene appearances, merging repeated headings', () => {
    const scenes = parseFountainDocument(SCRIPT)
    const merged = mergeExtractedLocations([], scenes)

    const kitchen = merged.find((l) => l.name === "MORTY'S HOME - KITCHEN")
    const street = merged.find((l) => l.name === 'STREET')

    expect(kitchen?.sceneIds).toEqual(['scn_aaaaaaaaaaaa', 'scn_cccccccccccc'])
    expect(street?.sceneIds).toEqual(['scn_bbbbbbbbbbbb'])
  })

  it('preserves manually-set fields on an existing location while updating sceneIds', () => {
    const existing = locationSchema.parse({
      id: createId('loc'),
      name: 'STREET',
      description: 'Rundown neighborhood.',
      sceneIds: [],
    })
    const merged = mergeExtractedLocations([existing], parseFountainDocument(SCRIPT))

    const street = merged.find((l) => l.id === existing.id)
    expect(street?.description).toBe('Rundown neighborhood.')
    expect(street?.sceneIds).toEqual(['scn_bbbbbbbbbbbb'])
  })

  it('keeps a location no longer appearing in the script, with sceneIds cleared', () => {
    const cutLocation = locationSchema.parse({ id: createId('loc'), name: 'ATTIC', sceneIds: ['scn_old'] })
    const merged = mergeExtractedLocations([cutLocation], parseFountainDocument(SCRIPT))

    const attic = merged.find((l) => l.id === cutLocation.id)
    expect(attic?.sceneIds).toEqual([])
  })
})

describe('syncLocations', () => {
  it('writes the merged location list to locations.json', async () => {
    const writeLocationsJson = vi.fn(async (_content: string) => {})
    const fileSystem = fakeFileSystem({ writeLocationsJson })

    await syncLocations(fileSystem, parseFountainDocument(SCRIPT))

    expect(writeLocationsJson).toHaveBeenCalledTimes(1)
    const written = JSON.parse(writeLocationsJson.mock.calls[0][0])
    expect(written.map((l: { name: string }) => l.name).sort()).toEqual(["MORTY'S HOME - KITCHEN", 'STREET'])
  })

  it('starts fresh instead of throwing when locations.json is invalid', async () => {
    const writeLocationsJson = vi.fn(async (_content: string) => {})
    const fileSystem = fakeFileSystem({
      readLocationsJson: async () => '{"not":"an array"}',
      writeLocationsJson,
    })

    await expect(syncLocations(fileSystem, parseFountainDocument(SCRIPT))).resolves.toBeUndefined()
    expect(writeLocationsJson).toHaveBeenCalledTimes(1)
  })
})
