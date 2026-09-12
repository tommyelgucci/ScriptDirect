import { describe, expect, it } from 'vitest'
import { extractJson } from './extractJson'

describe('extractJson', () => {
  it('extracts a JSON object surrounded by prose', () => {
    expect(extractJson('Sure, here: {"a":1} thanks!')).toBe('{"a":1}')
  })

  it('extracts a JSON array surrounded by prose', () => {
    expect(extractJson('Sure, here: [1,2,3] thanks!')).toBe('[1,2,3]')
  })

  it('extracts JSON from a markdown code fence, preferring it over any surrounding text', () => {
    expect(extractJson('```json\n[1,2,3]\n```')).toBe('[1,2,3]')
  })

  it('returns the trimmed text as-is when no JSON delimiters are found', () => {
    expect(extractJson('  plain text  ')).toBe('plain text')
  })
})
