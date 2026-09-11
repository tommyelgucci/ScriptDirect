import { describe, expect, it } from 'vitest'
import { ChromiumProjectFileSystem } from '../chromiumProjectFileSystem'
import { InvalidFountainFileNameError } from '../errors'
import { MockDirectoryHandle } from './mockDirectoryHandle'

function createFileSystem() {
  const root = new MockDirectoryHandle('my-project') as unknown as FileSystemDirectoryHandle
  return new ChromiumProjectFileSystem(root)
}

describe('ChromiumProjectFileSystem', () => {
  it('exposes the root folder name', () => {
    const fs = createFileSystem()
    expect(fs.projectName).toBe('my-project')
  })

  it('returns null for project.json before it has ever been written', async () => {
    const fs = createFileSystem()
    expect(await fs.readProjectJson()).toBeNull()
  })

  it('round-trips project.json', async () => {
    const fs = createFileSystem()
    await fs.writeProjectJson('{"name":"My Project"}')
    expect(await fs.readProjectJson()).toBe('{"name":"My Project"}')
  })

  it('round-trips characters.json', async () => {
    const fs = createFileSystem()
    await fs.writeCharactersJson('[]')
    expect(await fs.readCharactersJson()).toBe('[]')
  })

  it('returns null for locations.json before it has ever been written', async () => {
    const fs = createFileSystem()
    expect(await fs.readLocationsJson()).toBeNull()
  })

  it('round-trips locations.json', async () => {
    const fs = createFileSystem()
    await fs.writeLocationsJson('[]')
    expect(await fs.readLocationsJson()).toBe('[]')
  })

  it('lists no episodes before the episodes folder exists', async () => {
    const fs = createFileSystem()
    expect(await fs.listEpisodeFountainFileNames()).toEqual([])
  })

  it('creates the episodes folder on first write and round-trips a fountain file', async () => {
    const fs = createFileSystem()
    await fs.writeEpisodeFountain('s01e10.fountain', 'INT. KITCHEN - LATER\n\nShe waits.')
    expect(await fs.readEpisodeFountain('s01e10.fountain')).toBe('INT. KITCHEN - LATER\n\nShe waits.')
    expect(await fs.listEpisodeFountainFileNames()).toEqual(['s01e10.fountain'])
  })

  it('lists only .fountain files, sorted, ignoring sidecar .meta.json files', async () => {
    const fs = createFileSystem()
    await fs.writeEpisodeFountain('s01e11.fountain', '')
    await fs.writeEpisodeFountain('s01e10.fountain', '')
    await fs.writeEpisodeMeta('s01e10.fountain', '{}')
    expect(await fs.listEpisodeFountainFileNames()).toEqual(['s01e10.fountain', 's01e11.fountain'])
  })

  it('returns null for an episode with no sidecar metadata yet', async () => {
    const fs = createFileSystem()
    await fs.writeEpisodeFountain('s01e10.fountain', '')
    expect(await fs.readEpisodeMeta('s01e10.fountain')).toBeNull()
  })

  it('round-trips episode sidecar metadata', async () => {
    const fs = createFileSystem()
    await fs.writeEpisodeFountain('s01e10.fountain', '')
    await fs.writeEpisodeMeta('s01e10.fountain', '{"scenes":[]}')
    expect(await fs.readEpisodeMeta('s01e10.fountain')).toBe('{"scenes":[]}')
  })

  it('rejects a non-.fountain file name with a clear error', async () => {
    const fs = createFileSystem()
    await expect(fs.readEpisodeMeta('s01e10.txt')).rejects.toThrow(InvalidFountainFileNameError)
  })

  it('throws a NotFoundError reading a fountain file that does not exist', async () => {
    const fs = createFileSystem()
    await expect(fs.readEpisodeFountain('missing.fountain')).rejects.toMatchObject({ name: 'NotFoundError' })
  })

  it('returns null for the versions index before any snapshot has been saved', async () => {
    const fs = createFileSystem()
    expect(await fs.readVersionsIndexJson('script.fountain')).toBeNull()
  })

  it('round-trips the versions index and a version snapshot, scoped per episode', async () => {
    const fs = createFileSystem()
    await fs.writeVersionsIndexJson('script.fountain', '[{"id":"ver_a"}]')
    await fs.writeVersionFountain('script.fountain', '2026-08-18T12-00-00-000Z.fountain', 'INT. KITCHEN - DAY')

    expect(await fs.readVersionsIndexJson('script.fountain')).toBe('[{"id":"ver_a"}]')
    expect(await fs.readVersionFountain('script.fountain', '2026-08-18T12-00-00-000Z.fountain')).toBe(
      'INT. KITCHEN - DAY',
    )
  })

  it('throws a NotFoundError reading a version snapshot that does not exist', async () => {
    const fs = createFileSystem()
    await expect(fs.readVersionFountain('script.fountain', 'missing.fountain')).rejects.toMatchObject({
      name: 'NotFoundError',
    })
  })
})
