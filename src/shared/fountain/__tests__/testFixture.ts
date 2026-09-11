import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function readFixture(name: string): string {
  const path = join(import.meta.dirname, '../fixtures', name)
  return readFileSync(path, 'utf-8')
}
