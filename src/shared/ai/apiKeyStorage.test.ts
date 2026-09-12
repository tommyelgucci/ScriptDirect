import { afterEach, describe, expect, it } from 'vitest'
import { readApiKey, writeApiKey } from './apiKeyStorage'

describe('apiKeyStorage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns an empty string when no key has been stored', () => {
    expect(readApiKey('anthropic')).toBe('')
  })

  it('round-trips a key for a given provider', () => {
    writeApiKey('anthropic', 'sk-ant-test')
    expect(readApiKey('anthropic')).toBe('sk-ant-test')
  })

  it('keeps keys for different providers separate', () => {
    writeApiKey('anthropic', 'sk-ant-test')
    writeApiKey('openai', 'sk-oai-test')
    expect(readApiKey('anthropic')).toBe('sk-ant-test')
    expect(readApiKey('openai')).toBe('sk-oai-test')
  })

  it('clears a key when writing an empty string', () => {
    writeApiKey('anthropic', 'sk-ant-test')
    writeApiKey('anthropic', '')
    expect(readApiKey('anthropic')).toBe('')
  })
})
