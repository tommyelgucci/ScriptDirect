import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { relationshipSchema } from '../relationship'

describe('relationshipSchema', () => {
  it('accepts a valid relationship between two different characters', () => {
    const result = relationshipSchema.safeParse({
      id: createId('rel'),
      characterAId: createId('chr'),
      characterBId: createId('chr'),
      type: 'rivalry',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a relationship connecting a character to itself, with a clear error', () => {
    const characterId = createId('chr')
    const result = relationshipSchema.safeParse({
      id: createId('rel'),
      characterAId: characterId,
      characterBId: characterId,
      type: 'family',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('two different characters')
    }
  })

  it('rejects an invalid relationship type', () => {
    const result = relationshipSchema.safeParse({
      id: createId('rel'),
      characterAId: createId('chr'),
      characterBId: createId('chr'),
      type: 'nemesis',
    })
    expect(result.success).toBe(false)
  })
})
