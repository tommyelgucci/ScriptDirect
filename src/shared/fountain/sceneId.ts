import { createId, idSchema } from '../../entities/id'

const sceneIdSchema = idSchema('scn')
const ID_NOTE_PREFIX = 'id:'

export function createSceneId(): string {
  return createId('scn')
}

/** Renders the `[[id:scn_xxxx]]` Fountain note for a scene id, per ARCHITECTURE.md. */
export function formatSceneIdNote(sceneId: string): string {
  return `[[${ID_NOTE_PREFIX}${sceneId}]]`
}

/** Extracts a scene id from a note's inner text (e.g. "id:scn_7f2a9c"), or null if it isn't one of ours. */
export function parseSceneIdFromNoteText(noteText: string): string | null {
  const trimmed = noteText.trim()
  if (!trimmed.startsWith(ID_NOTE_PREFIX)) {
    return null
  }
  const candidate = trimmed.slice(ID_NOTE_PREFIX.length)
  return sceneIdSchema.safeParse(candidate).success ? candidate : null
}
