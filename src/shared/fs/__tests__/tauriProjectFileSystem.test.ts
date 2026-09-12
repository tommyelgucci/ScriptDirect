import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TauriProjectFileSystem } from '../tauriProjectFileSystem'

const { exists, mkdir, readDir, readTextFile, writeTextFile } = vi.hoisted(() => ({
  exists: vi.fn(),
  mkdir: vi.fn(),
  readDir: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}))

vi.mock('@tauri-apps/api/path', () => ({ join: async (...segments: string[]) => segments.join('/') }))
vi.mock('@tauri-apps/plugin-fs', () => ({ exists, mkdir, readDir, readTextFile, writeTextFile }))

describe('TauriProjectFileSystem', () => {
  beforeEach(() => {
    exists.mockReset().mockResolvedValue(false)
    mkdir.mockReset().mockResolvedValue(undefined)
    readDir.mockReset().mockResolvedValue([])
    readTextFile.mockReset().mockResolvedValue('')
    writeTextFile.mockReset().mockResolvedValue(undefined)
  })

  it('derives the project name from the last segment of the root path', () => {
    expect(new TauriProjectFileSystem('/home/writer/my-project').projectName).toBe('my-project')
    expect(new TauriProjectFileSystem('/home/writer/my-project/').projectName).toBe('my-project')
    expect(new TauriProjectFileSystem('C:\\Users\\writer\\my-project').projectName).toBe('my-project')
  })

  it('reads project.json when it exists', async () => {
    exists.mockResolvedValue(true)
    readTextFile.mockResolvedValue('{"id":"proj_1"}')

    const content = await new TauriProjectFileSystem('/root').readProjectJson()

    expect(exists).toHaveBeenCalledWith('/root/project.json')
    expect(content).toBe('{"id":"proj_1"}')
  })

  it('returns null reading project.json when it does not exist', async () => {
    const content = await new TauriProjectFileSystem('/root').readProjectJson()
    expect(content).toBeNull()
    expect(readTextFile).not.toHaveBeenCalled()
  })

  it('writes project.json under the root path', async () => {
    await new TauriProjectFileSystem('/root').writeProjectJson('{}')
    expect(writeTextFile).toHaveBeenCalledWith('/root/project.json', '{}')
  })

  it('creates the episodes directory before writing an episode fountain file', async () => {
    await new TauriProjectFileSystem('/root').writeEpisodeFountain('script.fountain', 'INT. KITCHEN - DAY')
    expect(mkdir).toHaveBeenCalledWith('/root/episodes', { recursive: true })
    expect(writeTextFile).toHaveBeenCalledWith('/root/episodes/script.fountain', 'INT. KITCHEN - DAY')
  })

  it('throws a NotFoundError DOMException reading a missing episode fountain file', async () => {
    await expect(new TauriProjectFileSystem('/root').readEpisodeFountain('script.fountain')).rejects.toMatchObject({
      name: 'NotFoundError',
    })
  })

  it('lists .fountain files in the episodes directory, sorted', async () => {
    exists.mockResolvedValue(true)
    readDir.mockResolvedValue([
      { name: 's01e02.fountain', isFile: true, isDirectory: false, isSymlink: false },
      { name: 's01e01.fountain', isFile: true, isDirectory: false, isSymlink: false },
      { name: 'notes.txt', isFile: true, isDirectory: false, isSymlink: false },
      { name: 'subdir', isFile: false, isDirectory: true, isSymlink: false },
    ])

    const names = await new TauriProjectFileSystem('/root').listEpisodeFountainFileNames()

    expect(names).toEqual(['s01e01.fountain', 's01e02.fountain'])
  })

  it('returns an empty list when the episodes directory does not exist yet', async () => {
    const names = await new TauriProjectFileSystem('/root').listEpisodeFountainFileNames()
    expect(names).toEqual([])
    expect(readDir).not.toHaveBeenCalled()
  })

  it('reads and writes episode meta next to the fountain file', async () => {
    exists.mockResolvedValue(true)
    readTextFile.mockResolvedValue('{"analysisReport":null}')

    const meta = await new TauriProjectFileSystem('/root').readEpisodeMeta('s01e01.fountain')
    expect(exists).toHaveBeenCalledWith('/root/episodes/s01e01.meta.json')
    expect(meta).toBe('{"analysisReport":null}')

    await new TauriProjectFileSystem('/root').writeEpisodeMeta('s01e01.fountain', '{}')
    expect(writeTextFile).toHaveBeenCalledWith('/root/episodes/s01e01.meta.json', '{}')
  })

  it('creates the version snapshot directory before writing one', async () => {
    await new TauriProjectFileSystem('/root').writeVersionFountain('s01e01.fountain', '2026-01-01.fountain', 'text')
    expect(mkdir).toHaveBeenCalledWith('/root/versions/s01e01', { recursive: true })
    expect(writeTextFile).toHaveBeenCalledWith('/root/versions/s01e01/2026-01-01.fountain', 'text')
  })

  it('throws a NotFoundError DOMException reading a missing version snapshot', async () => {
    await expect(
      new TauriProjectFileSystem('/root').readVersionFountain('s01e01.fountain', '2026-01-01.fountain'),
    ).rejects.toMatchObject({ name: 'NotFoundError' })
  })
})
