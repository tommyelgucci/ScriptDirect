import { z } from 'zod'
import { cuadernoDocumentSchema, type CuadernoDocument } from '../../entities/cuaderno-document'
import { createId } from '../../entities/id'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { safeParseJson } from '../../shared/json/safeParseJson'

async function readAll(fileSystem: ProjectFileSystem): Promise<CuadernoDocument[]> {
  const json = await fileSystem.readCuadernoJson()
  const parsed = json ? safeParseJson(z.array(cuadernoDocumentSchema), json) : null
  return parsed?.success ? parsed.data : []
}

async function writeAll(fileSystem: ProjectFileSystem, documents: CuadernoDocument[]): Promise<void> {
  await fileSystem.writeCuadernoJson(JSON.stringify(documents, null, 2))
}

export function listCuadernoDocuments(fileSystem: ProjectFileSystem): Promise<CuadernoDocument[]> {
  return readAll(fileSystem)
}

export async function createCuadernoDocument(
  fileSystem: ProjectFileSystem,
  title: string,
): Promise<CuadernoDocument[]> {
  const documents = await readAll(fileSystem)
  const now = new Date().toISOString()
  const document = cuadernoDocumentSchema.parse({
    id: createId('doc'),
    title,
    content: '',
    createdAt: now,
    updatedAt: now,
  })
  const updated = [...documents, document]
  await writeAll(fileSystem, updated)
  return updated
}

/** Renaming and editing content both go through this — only updatedAt needs recomputing either way. */
export async function updateCuadernoDocument(
  fileSystem: ProjectFileSystem,
  id: string,
  patch: { title?: string; content?: string },
): Promise<CuadernoDocument[]> {
  const documents = await readAll(fileSystem)
  const updated = documents.map((document) =>
    document.id === id ? { ...document, ...patch, updatedAt: new Date().toISOString() } : document,
  )
  await writeAll(fileSystem, updated)
  return updated
}

export async function deleteCuadernoDocument(fileSystem: ProjectFileSystem, id: string): Promise<CuadernoDocument[]> {
  const documents = await readAll(fileSystem)
  const updated = documents.filter((document) => document.id !== id)
  await writeAll(fileSystem, updated)
  return updated
}
