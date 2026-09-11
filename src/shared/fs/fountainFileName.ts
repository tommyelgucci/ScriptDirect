import { InvalidFountainFileNameError } from './errors'

const FOUNTAIN_EXTENSION = '.fountain'
const META_EXTENSION = '.meta.json'

export function metaFileNameFor(fountainFileName: string): string {
  if (!fountainFileName.endsWith(FOUNTAIN_EXTENSION)) {
    throw new InvalidFountainFileNameError(fountainFileName)
  }
  return fountainFileName.slice(0, -FOUNTAIN_EXTENSION.length) + META_EXTENSION
}
