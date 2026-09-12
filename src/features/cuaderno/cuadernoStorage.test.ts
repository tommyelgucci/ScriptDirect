import { describe, expect, it, vi } from 'vitest'
import type { ProjectFileSystem } from '../../shared/fs/types'
import {
  createCuadernoDocument,
  deleteCuadernoDocument,
  listCuadernoDocuments,
  updateCuadernoDocument,
} from './cuadernoStorage'

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

describe('cuadernoStorage', () => {
  it('returns an empty list when cuaderno.json does not exist yet', async () => {
    expect(await listCuadernoDocuments(fakeFileSystem())).toEqual([])
  })

  it('creates a document with empty content and appends it to the existing list', async () => {
    const writeCuadernoJson = vi.fn(async (_content: string) => {})
    const fileSystem = fakeFileSystem({
      readCuadernoJson: async () =>
        JSON.stringify([
          {
            id: 'doc_existing00001',
            title: 'Existing',
            content: 'already here',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      writeCuadernoJson,
    })

    const updated = await createCuadernoDocument(fileSystem, 'Biografía de Rick')

    expect(updated).toHaveLength(2)
    const created = updated[1]
    expect(created.title).toBe('Biografía de Rick')
    expect(created.content).toBe('')
    expect(created.id).toMatch(/^doc_/)
    expect(writeCuadernoJson).toHaveBeenCalledTimes(1)
    expect(JSON.parse(writeCuadernoJson.mock.calls[0][0])).toHaveLength(2)
  })

  it('updates only the matching document, bumping its updatedAt', async () => {
    const original = {
      id: 'doc_target000001',
      title: 'Original title',
      content: 'Original content',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const untouched = { ...original, id: 'doc_other0000001', title: 'Other' }
    const fileSystem = fakeFileSystem({
      readCuadernoJson: async () => JSON.stringify([original, untouched]),
    })

    const updated = await updateCuadernoDocument(fileSystem, original.id, { content: 'New content' })

    const changed = updated.find((document) => document.id === original.id)
    expect(changed?.content).toBe('New content')
    expect(changed?.title).toBe('Original title')
    expect(changed?.updatedAt).not.toBe(original.updatedAt)
    expect(updated.find((document) => document.id === untouched.id)).toEqual(untouched)
  })

  it('deletes only the matching document', async () => {
    const keep = {
      id: 'doc_keep00000001',
      title: 'Keep me',
      content: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const remove = { ...keep, id: 'doc_remove000001', title: 'Remove me' }
    const fileSystem = fakeFileSystem({
      readCuadernoJson: async () => JSON.stringify([keep, remove]),
    })

    const updated = await deleteCuadernoDocument(fileSystem, remove.id)

    expect(updated).toEqual([keep])
  })
})
