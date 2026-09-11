import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { projectSchema } from '../project'

function baseProject() {
  const now = new Date().toISOString()
  return {
    id: createId('proj'),
    name: 'Untitled Series',
    type: 'series' as const,
    createdAt: now,
    updatedAt: now,
  }
}

describe('projectSchema', () => {
  it('accepts a minimal valid project and defaults uiLanguage to Spanish', () => {
    const result = projectSchema.safeParse(baseProject())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.uiLanguage).toBe('es')
      expect(result.data.episodeIds).toEqual([])
    }
  })

  it('accepts an AI provider config without ever accepting a key field', () => {
    const result = projectSchema.safeParse({
      ...baseProject(),
      aiProvider: { provider: 'anthropic', model: 'claude-sonnet-5' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown project type', () => {
    const result = projectSchema.safeParse({ ...baseProject(), type: 'documentary' })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed createdAt timestamp with a clear error', () => {
    const result = projectSchema.safeParse({ ...baseProject(), createdAt: 'not-a-date' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('createdAt')
    }
  })
})
