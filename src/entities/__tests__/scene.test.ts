import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { sceneSchema } from '../scene'

function heading(text: string) {
  return { id: createId('blk'), type: 'heading' as const, text }
}

function action(text: string) {
  return { id: createId('blk'), type: 'action' as const, text }
}

describe('sceneSchema', () => {
  it('accepts a valid scene starting with a heading block', () => {
    const result = sceneSchema.safeParse({
      id: createId('scn'),
      order: 0,
      blocks: [heading('INT. KITCHEN - LATER'), action('She stares at the knife.')],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a scene with no blocks', () => {
    const result = sceneSchema.safeParse({ id: createId('scn'), order: 0, blocks: [] })
    expect(result.success).toBe(false)
  })

  it('rejects a scene whose first block is not a heading, with a clear error', () => {
    const result = sceneSchema.safeParse({
      id: createId('scn'),
      order: 0,
      blocks: [action('She stares at the knife.')],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('heading')
    }
  })

  it('rejects a negative scene order', () => {
    const result = sceneSchema.safeParse({
      id: createId('scn'),
      order: -1,
      blocks: [heading('INT. KITCHEN - LATER')],
    })
    expect(result.success).toBe(false)
  })
})
