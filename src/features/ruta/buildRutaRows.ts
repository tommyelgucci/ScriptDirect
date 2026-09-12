import type { Act, Beat } from '../../entities/beat'
import type { ParsedScene } from '../../shared/fountain'

export interface RutaRow {
  sceneId: string
  heading: string
  act: Act
  label: string
}

const DEFAULT_ACT: Act = 1

/**
 * Merges the script's scenes (in script order) with any previously saved
 * beats, defaulting an unassigned scene to Act 1 with no label. Scenes with
 * no id yet (never saved through Bitácora, so untagged) are dropped — there
 * is no stable key to persist a beat against yet.
 */
export function buildRutaRows(scenes: ParsedScene[], beats: readonly Beat[]): RutaRow[] {
  const beatBySceneId = new Map(beats.map((beat) => [beat.sceneId, beat]))

  return scenes.flatMap((scene) => {
    if (!scene.id) {
      return []
    }
    const beat = beatBySceneId.get(scene.id)
    return [{ sceneId: scene.id, heading: scene.heading, act: beat?.act ?? DEFAULT_ACT, label: beat?.label ?? '' }]
  })
}

/** Turns the screen's rows back into the Beat[] shape persisted in episode meta. */
export function rowsToBeats(rows: readonly RutaRow[]): Beat[] {
  return rows.map((row) => ({ sceneId: row.sceneId, act: row.act, label: row.label }))
}
