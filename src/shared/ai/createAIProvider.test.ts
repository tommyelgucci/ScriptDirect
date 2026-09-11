import { describe, expect, it } from 'vitest'
import { createAIProvider, UnsupportedAIProviderError } from './createAIProvider'
import { anthropicProvider } from './providers/anthropicProvider'
import { geminiProvider } from './providers/geminiProvider'
import { openaiProvider } from './providers/openaiProvider'

describe('createAIProvider', () => {
  it('returns the matching adapter for each supported provider', () => {
    expect(createAIProvider('anthropic')).toBe(anthropicProvider)
    expect(createAIProvider('openai')).toBe(openaiProvider)
    expect(createAIProvider('gemini')).toBe(geminiProvider)
  })

  it('throws a clear error for a provider with no adapter yet', () => {
    expect(() => createAIProvider('ollama')).toThrow(UnsupportedAIProviderError)
  })
})
