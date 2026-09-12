import { invoke } from '@tauri-apps/api/core'

/**
 * Thin wrapper around the Rust `keychain_*` commands (src-tauri/src/keychain.rs).
 * Only called when `isTauriRuntime()` is true — see apiKeyStorage.ts.
 */
export function keychainGetApiKey(provider: string): Promise<string | null> {
  return invoke<string | null>('keychain_get_api_key', { provider })
}

export function keychainSetApiKey(provider: string, apiKey: string): Promise<void> {
  return invoke('keychain_set_api_key', { provider, apiKey })
}

export function keychainDeleteApiKey(provider: string): Promise<void> {
  return invoke('keychain_delete_api_key', { provider })
}
