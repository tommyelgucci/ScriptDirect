import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { episodeSchema } from '../episode'

describe('episodeSchema', () => {
  it('accepts a valid episode', () => {
    const result = episodeSchema.safeParse({
      id: createId('ep'),
      title: 'Pilot',
      order: 0,
      seasonNumber: 1,
      episodeNumber: 10,
      fountainFileName: 's01e10.fountain',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a file name that does not end in .fountain, with a clear error', () => {
    const result = episodeSchema.safeParse({
      id: createId('ep'),
      title: 'Pilot',
      order: 0,
      fountainFileName: 's01e10.txt',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('.fountain')
    }
  })

  it('rejects a non-positive episode number', () => {
    const result = episodeSchema.safeParse({
      id: createId('ep'),
      title: 'Pilot',
      order: 0,
      episodeNumber: 0,
      fountainFileName: 's01e10.fountain',
    })
    expect(result.success).toBe(false)
  })
})
