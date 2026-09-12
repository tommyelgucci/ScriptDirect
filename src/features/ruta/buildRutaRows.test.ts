import { describe, expect, it } from 'vitest'
import type { ParsedScene } from '../../shared/fountain'
import { buildRutaRows, rowsToBeats } from './buildRutaRows'

function scene(overrides: Partial<ParsedScene> = {}): ParsedScene {
  return { id: 'scn_aaaaaaaaaaaa', heading: 'INT. KITCHEN - DAY', blocks: [], ...overrides }
}

describe('buildRutaRows', () => {
  it('defaults a scene with no saved beat to act 1 and an empty label', () => {
    const rows = buildRutaRows([scene()], [])
    expect(rows).toEqual([{ sceneId: 'scn_aaaaaaaaaaaa', heading: 'INT. KITCHEN - DAY', act: 1, label: '' }])
  })

  it('applies a saved beat to its matching scene', () => {
    const rows = buildRutaRows([scene()], [{ sceneId: 'scn_aaaaaaaaaaaa', act: 2, label: 'Midpoint' }])
    expect(rows).toEqual([{ sceneId: 'scn_aaaaaaaaaaaa', heading: 'INT. KITCHEN - DAY', act: 2, label: 'Midpoint' }])
  })

  it('drops a scene with no id yet', () => {
    const rows = buildRutaRows([scene({ id: null })], [])
    expect(rows).toEqual([])
  })

  it('keeps scenes in script order', () => {
    const rows = buildRutaRows(
      [scene({ id: 'scn_aaaaaaaaaaaa', heading: 'A' }), scene({ id: 'scn_bbbbbbbbbbbb', heading: 'B' })],
      [],
    )
    expect(rows.map((row) => row.heading)).toEqual(['A', 'B'])
  })
})

describe('rowsToBeats', () => {
  it('turns rows back into the persisted Beat shape', () => {
    const beats = rowsToBeats([{ sceneId: 'scn_aaaaaaaaaaaa', heading: 'A', act: 3, label: 'Climax' }])
    expect(beats).toEqual([{ sceneId: 'scn_aaaaaaaaaaaa', act: 3, label: 'Climax' }])
  })
})
