import { z } from 'zod'

/**
 * Every entity ID is a stable, prefixed, URL-safe token (e.g. "scn_7f2a9c").
 * The prefix makes IDs self-describing in logs, file diffs, and Fountain
 * notes (`[[id:scn_7f2a9c]]`).
 */
export type IdPrefix =
  | 'proj'
  | 'ep'
  | 'scn'
  | 'blk'
  | 'chr'
  | 'loc'
  | 'rel'
  | 'metric'
  | 'rpt'
  | 'fnd'
  | 'ver'
  | 'doc'

const ID_BODY_LENGTH = 12
const ID_BODY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomIdBody(length: number): string {
  let body = ''
  for (let i = 0; i < length; i++) {
    body += ID_BODY_ALPHABET[Math.floor(Math.random() * ID_BODY_ALPHABET.length)]
  }
  return body
}

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${randomIdBody(ID_BODY_LENGTH)}`
}

export function idSchema(prefix: IdPrefix) {
  return z
    .string()
    .regex(new RegExp(`^${prefix}_[a-z0-9]+$`), `Expected an id starting with "${prefix}_"`)
}
