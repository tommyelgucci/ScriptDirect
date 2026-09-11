import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { versionSchema } from '../version'

describe('versionSchema', () => {
  it('accepts a valid version snapshot', () => {
    const result = versionSchema.safeParse({
      id: createId('ver'),
      episodeId: createId('ep'),
      createdAt: new Date().toISOString(),
      fountainContent: 'INT. KITCHEN - LATER\n\nShe stares at the knife.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a version referencing an id with the wrong prefix', () => {
    const result = versionSchema.safeParse({
      id: createId('ver'),
      episodeId: createId('scn'),
      createdAt: new Date().toISOString(),
      fountainContent: '',
    })
    expect(result.success).toBe(false)
  })
})
