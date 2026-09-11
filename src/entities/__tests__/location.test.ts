import { describe, expect, it } from 'vitest'
import { createId } from '../id'
import { locationSchema } from '../location'

describe('locationSchema', () => {
  it('accepts a valid location', () => {
    const result = locationSchema.safeParse({
      id: createId('loc'),
      name: "Morty's Home - Kitchen",
    })
    expect(result.success).toBe(true)
  })

  it('rejects a location missing a name', () => {
    const result = locationSchema.safeParse({ id: createId('loc') })
    expect(result.success).toBe(false)
  })

  it('rejects a scene id that does not look like a scene id', () => {
    const result = locationSchema.safeParse({
      id: createId('loc'),
      name: 'Kitchen',
      sceneIds: ['not-a-scene-id'],
    })
    expect(result.success).toBe(false)
  })
})
