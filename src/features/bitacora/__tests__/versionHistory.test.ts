import { describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../../shared/fs/types'
import { createVersionSnapshot, diffFountainText, listVersions, readVersionContent } from '../versionHistory'

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

describe('listVersions', () => {
  it('returns an empty list before any snapshot has been saved', async () => {
    expect(await listVersions(fakeFileSystem(), 'script.fountain')).toEqual([])
  })

  it('starts fresh instead of throwing when the index is invalid', async () => {
    const fileSystem = fakeFileSystem({ readVersionsIndexJson: async () => '{"not":"an array"}' })
    expect(await listVersions(fileSystem, 'script.fountain')).toEqual([])
  })

  // Codex's review (PRs #5, #7, #16, #19) flagged that JSON.parse throwing on
  // syntactically invalid (not just schema-invalid) JSON skipped this same
  // fallback, leaving the history screen stuck loading.
  it('starts fresh instead of throwing when the index is truncated/malformed JSON', async () => {
    const fileSystem = fakeFileSystem({ readVersionsIndexJson: async () => '{"truncated' })
    expect(await listVersions(fileSystem, 'script.fountain')).toEqual([])
  })
})

describe('createVersionSnapshot', () => {
  it('writes the snapshot content and prepends a new entry to the index', async () => {
    const writeVersionFountain = vi.fn(async (_fileName: string, _versionFileName: string, _content: string) => {})
    const writeVersionsIndexJson = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({ writeVersionFountain, writeVersionsIndexJson })

    const entry = await createVersionSnapshot(fileSystem, 'script.fountain', 'INT. KITCHEN - DAY', 'Draft 2')

    expect(entry.label).toBe('Draft 2')
    expect(entry.id).toMatch(/^ver_/)
    expect(writeVersionFountain).toHaveBeenCalledWith('script.fountain', entry.fileName, 'INT. KITCHEN - DAY')

    const [, indexContent] = writeVersionsIndexJson.mock.calls[0]
    expect(JSON.parse(indexContent)).toEqual([entry])
  })

  it('puts newer snapshots first, ahead of existing ones', async () => {
    const existingEntry = { id: 'ver_existingexist', createdAt: new Date(0).toISOString(), fileName: 'old.fountain' }
    const writeVersionsIndexJson = vi.fn(async (_fileName: string, _content: string) => {})
    const fileSystem = fakeFileSystem({
      readVersionsIndexJson: async () => JSON.stringify([existingEntry]),
      writeVersionsIndexJson,
    })

    await createVersionSnapshot(fileSystem, 'script.fountain', 'text', undefined)

    const [, indexContent] = writeVersionsIndexJson.mock.calls[0]
    const saved = JSON.parse(indexContent)
    expect(saved).toHaveLength(2)
    expect(saved[1]).toEqual(existingEntry)
  })
})

describe('readVersionContent', () => {
  it('reads the snapshot file named in the entry', async () => {
    const readVersionFountain = vi.fn(async (_fileName: string, _versionFileName: string) => 'saved content')
    const fileSystem = fakeFileSystem({ readVersionFountain })

    const content = await readVersionContent(fileSystem, 'script.fountain', {
      id: 'ver_aaaaaaaaaaaa',
      createdAt: new Date().toISOString(),
      fileName: 'snap.fountain',
    })

    expect(content).toBe('saved content')
    expect(readVersionFountain).toHaveBeenCalledWith('script.fountain', 'snap.fountain')
  })
})

describe('diffFountainText', () => {
  it('reports unchanged, removed, and added lines', () => {
    const changes = diffFountainText('a\nb\nc\n', 'a\nx\nc\n')

    expect(changes.map((change) => ({ added: !!change.added, removed: !!change.removed, value: change.value }))).toEqual([
      { added: false, removed: false, value: 'a\n' },
      { added: false, removed: true, value: 'b\n' },
      { added: true, removed: false, value: 'x\n' },
      { added: false, removed: false, value: 'c\n' },
    ])
  })
})
