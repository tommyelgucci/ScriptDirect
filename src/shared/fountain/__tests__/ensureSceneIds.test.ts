import { describe, expect, it } from 'vitest'
import { ensureSceneIds } from '../ensureSceneIds'
import { readFixture } from './testFixture'

describe('ensureSceneIds', () => {
  it('preserves an existing scene id and generates one for a scene that has none', () => {
    const source = readFixture('sample.fountain')
    const result = ensureSceneIds(source)

    const idLines = result.split('\n').filter((line) => /^\[\[id:scn_[a-z0-9]+]]$/.test(line))
    expect(idLines).toHaveLength(2)
    expect(idLines[0]).toBe('[[id:scn_7f2a9c1b3d0e]]') // preserved, not regenerated
    expect(idLines[1]).not.toBe(idLines[0])
  })

  it('inserts the new id after its scene heading, isolated by blank lines', () => {
    const source = 'EXT. STREET - NIGHT\n\nRain falls.'
    const result = ensureSceneIds(source)
    const lines = result.split('\n')
    expect(lines[0]).toBe('EXT. STREET - NIGHT')
    expect(lines[1]).toBe('')
    expect(lines[2]).toMatch(/^\[\[id:scn_[a-z0-9]+]]$/)
    expect(lines[3]).toBe('')
  })

  it('keeps the note parseable as its own token, not absorbed into the next block', () => {
    const source = 'EXT. STREET - NIGHT\nRain falls.'
    const result = ensureSceneIds(source)
    expect(result.split('\n')).toEqual([
      'EXT. STREET - NIGHT',
      '',
      expect.stringMatching(/^\[\[id:scn_[a-z0-9]+]]$/),
      '',
      'Rain falls.',
    ])
  })

  it('is idempotent: running it twice does not change already-tagged text', () => {
    const once = ensureSceneIds('INT. KITCHEN - DAY\n\nShe waits.')
    const twice = ensureSceneIds(once)
    expect(twice).toBe(once)
  })

  it('leaves scripts with no scene headings untouched', () => {
    const source = 'Title: No Scenes Yet\n\nJust a title page.'
    expect(ensureSceneIds(source)).toBe(source)
  })
})
