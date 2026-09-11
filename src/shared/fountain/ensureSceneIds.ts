import { isSceneHeadingLine, matchNoteLine } from './lineRules'
import { createSceneId, formatSceneIdNote, parseSceneIdFromNoteText } from './sceneId'

function isBlank(line: string): boolean {
  return line.trim() === ''
}

/**
 * Walks the raw Fountain text and inserts a `[[id:scn_xxxx]]` note after
 * every untagged scene heading, surrounded by blank lines on both sides.
 *
 * That spacing is required, not cosmetic: fountain-js (and the Fountain
 * spec it implements) only recognizes a bracketed note as its own token
 * when it is blank-line-separated from the elements around it. A note
 * placed directly on the line after a heading — as shown in an earlier
 * draft of ARCHITECTURE.md — gets absorbed into the next dialogue/action
 * block instead of staying an inert note; see
 * `src/shared/fountain/__tests__/crossAppCompatibility.test.ts`, which
 * verifies the corrected placement round-trips through a fresh parser.
 *
 * Detection of an *existing* id is permissive about spacing (it just scans
 * forward past any blank lines for the first note), so already-tagged
 * scenes are preserved as-is rather than reformatted.
 */
export function ensureSceneIds(source: string): string {
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const lines = source.split(/\r\n|\n/)
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    result.push(line)

    if (!isSceneHeadingLine(line)) {
      continue
    }

    let j = i + 1
    while (j < lines.length && isBlank(lines[j])) {
      j++
    }
    const noteText = j < lines.length ? matchNoteLine(lines[j]) : null
    const hasExistingSceneId = noteText !== null && parseSceneIdFromNoteText(noteText) !== null

    if (hasExistingSceneId) {
      continue
    }

    // Always isolate the new note with blank lines on both sides, rather
    // than trying to reuse whatever blank lines already follow the heading:
    // an existing blank line there separates the heading from what comes
    // *after* it, not from a note we're about to splice in before it.
    result.push('')
    result.push(formatSceneIdNote(createSceneId()))
    result.push('')
  }

  return result.join(eol)
}
