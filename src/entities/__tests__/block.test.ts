import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { blockSchema } from '../block'

describe('blockSchema', () => {
  it('accepts a valid block', () => {
    const result = blockSchema.safeParse({
      id: createId('blk'),
      type: 'dialogue',
      text: 'You were never supposed to see that.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown block type', () => {
    const result = blockSchema.safeParse({
      id: createId('blk'),
      type: 'transition',
      text: 'CUT TO:',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a block missing required fields', () => {
    const result = blockSchema.safeParse({ type: 'action' })
    expect(result.success).toBe(false)
  })
})
