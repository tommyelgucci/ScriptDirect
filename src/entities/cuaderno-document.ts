import { z } from 'zod'
import { isoTimestampSchema } from './common'
import { idSchema } from './id'

/**
 * Cuaderno (ARCHITECTURE.md's "Development documents") — free-form
 * per-project notes that live alongside the script: character bios,
 * worldbuilding, research, outlines, whatever doesn't fit a scene. Just a
 * title and a plain text body, deliberately unstructured. If a specific
 * kind of note earns its own structured screen later, the way Character
 * and Location did, it graduates out of Cuaderno rather than this schema
 * growing fields for it.
 */
export const cuadernoDocumentSchema = z.object({
  id: idSchema('doc'),
  title: z.string().min(1),
  content: z.string().default(''),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
})
export type CuadernoDocument = z.infer<typeof cuadernoDocumentSchema>
