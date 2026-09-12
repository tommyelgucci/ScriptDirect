import type { AiProviderName } from '../../entities/project'
import { isTauriRuntime } from '../fs/capability'
import { keychainDeleteApiKey, keychainGetApiKey, keychainSetApiKey } from './tauriKeychain'

const STORAGE_KEY_PREFIX = 'scriptdirect:apiKey:'

/**
 * BYOK key storage. Under the Tauri desktop shell this reads/writes the OS
 * keychain (Keychain on macOS, Credential Manager on Windows, secret-service
 * on Linux) per ARCHITECTURE.md's Platform Strategy — real secret storage,
 * not a ScriptDirect-owned server or file. In the web/PWA build there is no
 * keychain API available to a browser, so this falls back to
 * localStorage, scoped per provider (not per project — most writers use one
 * key per provider across all their projects); the Settings screen
 * discloses that the web build's key isn't strongly encrypted. Either way,
 * the key never touches project.json or any ScriptDirect-owned server.
 */
export async function readApiKey(provider: AiProviderName): Promise<string> {
  if (isTauriRuntime()) {
    return (await keychainGetApiKey(provider)) ?? ''
  }
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + provider) ?? ''
  } catch {
    return ''
  }
}

export async function writeApiKey(provider: AiProviderName, apiKey: string): Promise<void> {
  if (isTauriRuntime()) {
    if (apiKey) {
      await keychainSetApiKey(provider, apiKey)
    } else {
      await keychainDeleteApiKey(provider)
    }
    return
  }
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
