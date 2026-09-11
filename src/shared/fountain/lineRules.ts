import { rules } from 'fountain-js'

/** Reuses fountain-js's own line rules so our scene-id insertion logic never drifts from how it actually parses. */
export function isSceneHeadingLine(line: string): boolean {
  return rules.scene_heading.test(line)
}

/** Returns the note's inner text (without the surrounding `[[` `]]`), or null if the line is not a bare note. */
export function matchNoteLine(line: string): string | null {
  const match = rules.note.exec(line)
  return match ? match[1] : null
}
