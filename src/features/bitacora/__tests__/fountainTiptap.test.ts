import { describe, expect, it } from 'vitest'
import { ensureSceneIds, parseFountainDocument } from '../../../shared/fountain'
import { scenesToTiptapDoc, tiptapDocToFountainText } from '../fountainTiptap'

const SAMPLE = `INT. MORTY'S HOME - KITCHEN - LATER

[[id:scn_7f2a9c1b3d0e]]

Morty stares at the knife on the counter.

MORTY
(quietly)
You were never supposed to see that.

EXT. STREET - NIGHT

[[id:scn_aaaaaaaaaaaa]]

Rain hammers the pavement.`

describe('scenesToTiptapDoc / tiptapDocToFountainText', () => {
  it('round-trips scenes, blocks, and scene ids through a Tiptap doc', () => {
    const scenes = parseFountainDocument(SAMPLE)
    const doc = scenesToTiptapDoc(scenes)
    const text = tiptapDocToFountainText(doc)
    const reparsed = parseFountainDocument(text)

    expect(reparsed).toHaveLength(2)
    expect(reparsed[0].id).toBe('scn_7f2a9c1b3d0e')
    expect(reparsed[1].id).toBe('scn_aaaaaaaaaaaa')
    expect(reparsed[0].heading).toBe("INT. MORTY'S HOME - KITCHEN - LATER")
    expect(reparsed[0].blocks.map((b) => b.type)).toEqual(['heading', 'action', 'character', 'parenthetical', 'dialogue'])
    expect(reparsed[0].blocks[4].text).toBe('You were never supposed to see that.')
  })

  it('keeps dialogue block lines adjacent, with no blank line between character/parenthetical/dialogue', () => {
    const scenes = parseFountainDocument(SAMPLE)
    const text = tiptapDocToFountainText(scenesToTiptapDoc(scenes))
    const lines = text.split('\n')
    const characterIndex = lines.indexOf('MORTY')

    expect(lines[characterIndex + 1]).toBe('(quietly)')
    expect(lines[characterIndex + 2]).toBe('You were never supposed to see that.')
  })

  it('leaves a heading with no sceneId attribute untagged, ready for ensureSceneIds', () => {
    const doc = scenesToTiptapDoc(parseFountainDocument("EXT. STREET - NIGHT\n\nRain falls."))
    // Simulate a brand-new scene created in the editor: no sceneId assigned yet.
    doc.content![0].attrs = { sceneId: null }

    const text = tiptapDocToFountainText(doc)
    expect(text).not.toContain('[[id:')

    const tagged = ensureSceneIds(text)
    const scenes = parseFountainDocument(tagged)
    expect(scenes[0].id).toMatch(/^scn_[a-z0-9]+$/)
  })

  it('produces an empty action block for a doc with no scenes', () => {
    const doc = scenesToTiptapDoc([])
    expect(doc.content).toEqual([{ type: 'action', content: [] }])
  })
})
