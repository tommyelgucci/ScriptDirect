import { InvalidFountainFileNameError } from './errors'

const FOUNTAIN_EXTENSION = '.fountain'
const META_EXTENSION = '.meta.json'

export function metaFileNameFor(fountainFileName: string): string {
  if (!fountainFileName.endsWith(FOUNTAIN_EXTENSION)) {
    throw new InvalidFountainFileNameError(fountainFileName)
  }
  return fountainFileName.slice(0, -FOUNTAIN_EXTENSION.length) + META_EXTENSION
}

/** "s01e10.fountain" -> "s01e10" — used as the subfolder name under versions/. */
export function episodeBaseName(fountainFileName: string): string {
  if (!fountainFileName.endsWith(FOUNTAIN_EXTENSION)) {
    throw new InvalidFountainFileNameError(fountainFileName)
  }
  return fountainFileName.slice(0, -FOUNTAIN_EXTENSION.length)
}
