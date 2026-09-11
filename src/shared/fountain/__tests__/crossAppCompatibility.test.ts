import { Fountain } from 'fountain-js'
import { describe, expect, it } from 'vitest'
import { ensureSceneIds } from '../ensureSceneIds'
import { readFixture } from './testFixture'

/**
 * Confirms the `[[id:scn_xxxx]]` notes ScriptDirect writes don't break a
 * script for any other Fountain-compatible app. We don't have Highland,
 * Slugline, etc. available in this environment, so a *fresh, independent*
 * fountain-js parser instance — untouched by any ScriptDirect code — stands
 * in for "some other app's parser."
 */
describe('scene-id notes stay compatible with a plain Fountain parser', () => {
  it('parses cleanly and keeps the note text intact as an inert note token', () => {
    const tagged = ensureSceneIds(readFixture('sample.fountain'))

    expect(() => new Fountain().parse(tagged, true)).not.toThrow()

    const { tokens } = new Fountain().parse(tagged, true)
    const noteTokens = tokens.filter((token) => token.type === 'note')

    expect(noteTokens).toHaveLength(2)
    expect(noteTokens[0].text).toBe('id:scn_7f2a9c1b3d0e')
    expect(noteTokens[1].text).toMatch(/^id:scn_[a-z0-9]+$/)
  })

  it('renders scene-id notes as invisible HTML comments, never as visible screenplay text', () => {
    const tagged = ensureSceneIds(readFixture('sample.fountain'))
    const { html } = new Fountain().parse(tagged)

    expect(html.script).toContain('<!-- id:scn_7f2a9c1b3d0e -->')
    expect(html.script).not.toContain('[[id:')
  })

  it('still parses the full screenplay content around the notes unchanged', () => {
    const tagged = ensureSceneIds(readFixture('sample.fountain'))
    const { tokens } = new Fountain().parse(tagged, true)

    const sceneHeadings = tokens.filter((token) => token.type === 'scene_heading').map((token) => token.text)
    expect(sceneHeadings).toEqual(["INT. MORTY'S HOME - KITCHEN - LATER", 'EXT. STREET - NIGHT'])

    const dialogue = tokens.find((token) => token.type === 'dialogue')
    expect(dialogue?.text).toBe('You were never supposed to see that.')
  })
})
