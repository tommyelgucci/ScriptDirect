import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { characterSchema } from '../character'

describe('characterSchema', () => {
  it('accepts a valid character and defaults optional collections', () => {
    const result = characterSchema.safeParse({
      id: createId('chr'),
      name: 'Morty',
      group: 'protagonist',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.aliases).toEqual([])
      expect(result.data.sceneIds).toEqual([])
    }
  })

  it('rejects an empty name', () => {
    const result = characterSchema.safeParse({
      id: createId('chr'),
      name: '',
      group: 'protagonist',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid group value', () => {
    const result = characterSchema.safeParse({
      id: createId('chr'),
      name: 'Morty',
      group: 'sidekick',
    })
    expect(result.success).toBe(false)
  })
})
