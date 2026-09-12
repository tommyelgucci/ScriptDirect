import { describe, expect, it } from 'vitest'
import { ZipProjectFileSystem } from '../zipProjectFileSystem'

describe('ZipProjectFileSystem', () => {
  it('starts empty: every read returns null (or throws NotFoundError for episodes/versions)', async () => {
    const fileSystem = ZipProjectFileSystem.createEmpty('New Project')

    expect(fileSystem.projectName).toBe('New Project')
    expect(await fileSystem.readProjectJson()).toBeNull()
    expect(await fileSystem.readCharactersJson()).toBeNull()
    expect(await fileSystem.readLocationsJson()).toBeNull()
    expect(await fileSystem.listEpisodeFountainFileNames()).toEqual([])
    await expect(fileSystem.readEpisodeFountain('script.fountain')).rejects.toMatchObject({ name: 'NotFoundError' })
  })

  it('round-trips project.json, characters.json, and locations.json through a real export/import', async () => {
    const original = ZipProjectFileSystem.createEmpty('Round Trip')
    await original.writeProjectJson('{"id":"proj_1"}')
    await original.writeCharactersJson('{"characters":[]}')
    await original.writeLocationsJson('{"locations":[]}')

    const imported = await ZipProjectFileSystem.importZip(await original.exportZip(), 'Round Trip')

    expect(await imported.readProjectJson()).toBe('{"id":"proj_1"}')
    expect(await imported.readCharactersJson()).toBe('{"characters":[]}')
    expect(await imported.readLocationsJson()).toBe('{"locations":[]}')
  })

  it('round-trips episode fountain files and their sidecar meta', async () => {
    const original = ZipProjectFileSystem.createEmpty('Episodes')
    await original.writeEpisodeFountain('s01e01.fountain', 'INT. KITCHEN - DAY')
    await original.writeEpisodeMeta('s01e01.fountain', '{"analysisReport":null}')

    const imported = await ZipProjectFileSystem.importZip(await original.exportZip(), 'Episodes')

    expect(await imported.readEpisodeFountain('s01e01.fountain')).toBe('INT. KITCHEN - DAY')
    expect(await imported.readEpisodeMeta('s01e01.fountain')).toBe('{"analysisReport":null}')
    expect(await imported.listEpisodeFountainFileNames()).toEqual(['s01e01.fountain'])
  })

  it('lists only .fountain files directly under episodes/, sorted', async () => {
    const fileSystem = ZipProjectFileSystem.createEmpty('Episodes')
    await fileSystem.writeEpisodeFountain('s01e02.fountain', '')
    await fileSystem.writeEpisodeFountain('s01e01.fountain', '')
    await fileSystem.writeEpisodeMeta('s01e01.fountain', '{}')

    expect(await fileSystem.listEpisodeFountainFileNames()).toEqual(['s01e01.fountain', 's01e02.fountain'])
  })

  it('round-trips version snapshots under versions/<episode base name>/', async () => {
    const original = ZipProjectFileSystem.createEmpty('Versions')
    await original.writeVersionsIndexJson('s01e01.fountain', '{"snapshots":[]}')
    await original.writeVersionFountain('s01e01.fountain', '2026-08-18T14-30-00-000Z.fountain', 'INT. OLD - DAY')

    const imported = await ZipProjectFileSystem.importZip(await original.exportZip(), 'Versions')

    expect(await imported.readVersionsIndexJson('s01e01.fountain')).toBe('{"snapshots":[]}')
    expect(await imported.readVersionFountain('s01e01.fountain', '2026-08-18T14-30-00-000Z.fountain')).toBe(
      'INT. OLD - DAY',
    )
  })

  it('throws a NotFoundError DOMException reading a missing version snapshot', async () => {
    const fileSystem = ZipProjectFileSystem.createEmpty('Versions')
    await expect(
      fileSystem.readVersionFountain('s01e01.fountain', '2026-08-18T14-30-00-000Z.fountain'),
    ).rejects.toMatchObject({ name: 'NotFoundError' })
  })

  it('never confuses two episodes with similar names in the version snapshot path', async () => {
    const fileSystem = ZipProjectFileSystem.createEmpty('Versions')
    await fileSystem.writeVersionFountain('s01e01.fountain', 'v1.fountain', 'episode one')
    await fileSystem.writeVersionFountain('s01e10.fountain', 'v1.fountain', 'episode ten')

    expect(await fileSystem.readVersionFountain('s01e01.fountain', 'v1.fountain')).toBe('episode one')
    expect(await fileSystem.readVersionFountain('s01e10.fountain', 'v1.fountain')).toBe('episode ten')
  })
})
