import type { AiProviderName } from '../../entities/project'

const STORAGE_KEY_PREFIX = 'scriptdirect:apiKey:'

/**
 * BYOK key storage for the web build: browser localStorage only, scoped
 * per provider (not per project — most writers use one key per provider
 * across all their projects). Per ARCHITECTURE.md's AI Provider
 * Architecture, this is deliberately NOT strongly encrypted; the Settings
 * screen discloses that to the user. The key never touches project.json
 * or any ScriptDirect-owned server.
 */
export function readApiKey(provider: AiProviderName): string {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + provider) ?? ''
  } catch {
    return ''
  }
}

export function writeApiKey(provider: AiProviderName, apiKey: string): void {
  try {
    if (apiKey) {
      localStorage.setItem(STORAGE_KEY_PREFIX + provider, apiKey)
    } else {
      localStorage.removeItem(STORAGE_KEY_PREFIX + provider)
    }
  } catch {
    // Storage can be unavailable (private browsing, quota) — the key simply won't persist.
  }
}
