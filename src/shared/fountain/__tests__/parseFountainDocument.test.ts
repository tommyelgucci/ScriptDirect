import { describe, expect, it } from 'vitest'
import { ensureSceneIds } from '../ensureSceneIds'
import { parseFountainDocument } from '../parseFountainDocument'
import { readFixture } from './testFixture'

describe('parseFountainDocument', () => {
  it('parses each scene heading into its own scene with a heading block first', () => {
    const source = readFixture('sample.fountain')
    const scenes = parseFountainDocument(source)

    expect(scenes).toHaveLength(2)
    expect(scenes[0].heading).toBe("INT. MORTY'S HOME - KITCHEN - LATER")
    expect(scenes[0].blocks[0]).toMatchObject({ type: 'heading', text: "INT. MORTY'S HOME - KITCHEN - LATER" })
    expect(scenes[1].heading).toBe('EXT. STREET - NIGHT')
  })

  it('reads the existing scene id from its note, and leaves an untagged scene id null', () => {
    const source = readFixture('sample.fountain')
    const scenes = parseFountainDocument(source)

    expect(scenes[0].id).toBe('scn_7f2a9c1b3d0e')
    expect(scenes[1].id).toBeNull()
  })

  it('picks up a generated id once ensureSceneIds has tagged the source', () => {
    const source = readFixture('sample.fountain')
    const tagged = ensureSceneIds(source)
    const scenes = parseFountainDocument(tagged)

    expect(scenes[0].id).toBe('scn_7f2a9c1b3d0e')
    expect(scenes[1].id).toMatch(/^scn_[a-z0-9]+$/)
  })

  it('captures action, character, and dialogue blocks in order', () => {
    const source = readFixture('sample.fountain')
    const scenes = parseFountainDocument(source)
    const types = scenes[0].blocks.map((block) => block.type)

    expect(types).toEqual(['heading', 'action', 'character', 'dialogue'])
    expect(scenes[0].blocks[2]).toMatchObject({ type: 'character', text: 'MORTY' })
  })

  it('returns no scenes for a document with no scene headings', () => {
    expect(parseFountainDocument('Title: Empty\n\nJust a title page.')).toEqual([])
  })
})
