import { describe, expect, it } from 'vitest'
import { assertSafeFileName } from './safeFileName'

describe('assertSafeFileName', () => {
  it('accepts a plain file name', () => {
    expect(() => assertSafeFileName('2026-08-18T12-00-00-000Z.fountain')).not.toThrow()
  })

  it.each(['../evil.fountain', '../../../../etc/passwd', 'sub/evil.fountain', 'sub\\evil.fountain', '/etc/passwd', '.', '..', ''])(
    'rejects %s',
    (name) => {
      expect(() => assertSafeFileName(name)).toThrow(/Refusing to use/)
    },
  )
})
