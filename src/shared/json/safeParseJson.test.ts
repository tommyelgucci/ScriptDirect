import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { safeParseJson } from './safeParseJson'

const schema = z.object({ name: z.string() })

describe('safeParseJson', () => {
  it('returns the parsed data for valid JSON matching the schema', () => {
    const result = safeParseJson(schema, '{"name":"Rick"}')
    expect(result).toEqual({ success: true, data: { name: 'Rick' } })
  })

  it('fails without throwing when the JSON matches the schema but wrong types', () => {
    const result = safeParseJson(schema, '{"name":123}')
    expect(result.success).toBe(false)
  })

  it('fails without throwing when the text is not valid JSON at all', () => {
    expect(() => safeParseJson(schema, '{not valid json')).not.toThrow()
    const result = safeParseJson(schema, '{not valid json')
    expect(result.success).toBe(false)
  })

  it('fails without throwing on a truncated file (a real-world corruption case)', () => {
    const result = safeParseJson(schema, '{"name":"Ri')
    expect(result.success).toBe(false)
  })

  it('fails without throwing on an empty string', () => {
    const result = safeParseJson(schema, '')
    expect(result.success).toBe(false)
  })
})
