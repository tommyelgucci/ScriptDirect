import { z } from 'zod'
import { isoTimestampSchema } from './common'
import { idSchema } from './id'

export const projectTypeSchema = z.enum(['movie', 'series'])
export type ProjectType = z.infer<typeof projectTypeSchema>

export const uiLanguageSchema = z.enum(['es', 'en'])
export type UiLanguage = z.infer<typeof uiLanguageSchema>

export const aiProviderNameSchema = z.enum(['anthropic', 'openai', 'gemini', 'ollama'])
export type AiProviderName = z.infer<typeof aiProviderNameSchema>

/**
 * Provider + model choice only. The API key itself is BYOK and is never
 * persisted here: it lives in the OS keychain (desktop/Tauri) or browser
 * storage (web), scoped per ARCHITECTURE.md's AI Provider Architecture.
 */
export const aiProviderConfigSchema = z.object({
  provider: aiProviderNameSchema,
  model: z.string().optional(),
})
export type AiProviderConfig = z.infer<typeof aiProviderConfigSchema>

/** Root of project.json — the entry point of every ScriptDirect project folder. */
export const projectSchema = z.object({
  id: idSchema('proj'),
  name: z.string().min(1),
  type: projectTypeSchema,
  uiLanguage: uiLanguageSchema.default('es'),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  aiProvider: aiProviderConfigSchema.optional(),
  episodeIds: z.array(idSchema('ep')).default([]),
})
export type Project = z.infer<typeof projectSchema>
