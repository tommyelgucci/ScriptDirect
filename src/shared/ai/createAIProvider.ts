import type { AiProviderName } from '../../entities/project'
import { anthropicProvider } from './providers/anthropicProvider'
import { geminiProvider } from './providers/geminiProvider'
import { openaiProvider } from './providers/openaiProvider'
import type { AIProvider } from './types'

export class UnsupportedAIProviderError extends Error {
  constructor(provider: string) {
    super(`No adapter is implemented yet for the "${provider}" provider.`)
    this.name = 'UnsupportedAIProviderError'
  }
}

export function createAIProvider(provider: AiProviderName): AIProvider {
  switch (provider) {
    case 'anthropic':
      return anthropicProvider
    case 'openai':
      return openaiProvider
    case 'gemini':
      return geminiProvider
    default:
      // 'ollama' is a valid AiProviderName in the data model, but isn't
      // exposed in Settings yet (see src/features/settings/README.md) and
      // has no adapter here yet either.
      throw new UnsupportedAIProviderError(provider)
  }
}
