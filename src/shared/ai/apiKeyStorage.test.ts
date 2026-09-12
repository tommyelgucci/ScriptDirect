import { afterEach, describe, expect, it, vi } from 'vitest'
import { readApiKey, writeApiKey } from './apiKeyStorage'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@tauri-apps/api/core', async () => {
  const actual = await vi.importActual<typeof import('@tauri-apps/api/core')>('@tauri-apps/api/core')
  return { ...actual, invoke }
})

describe('apiKeyStorage (web build, localStorage)', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns an empty string when no key has been stored', async () => {
    expect(await readApiKey('anthropic')).toBe('')
  })

  it('round-trips a key for a given provider', async () => {
    await writeApiKey('anthropic', 'sk-ant-test')
    expect(await readApiKey('anthropic')).toBe('sk-ant-test')
  })

  it('keeps keys for different providers separate', async () => {
    await writeApiKey('anthropic', 'sk-ant-test')
    await writeApiKey('openai', 'sk-oai-test')
    expect(await readApiKey('anthropic')).toBe('sk-ant-test')
    expect(await readApiKey('openai')).toBe('sk-oai-test')
  })

  it('clears a key when writing an empty string', async () => {
    await writeApiKey('anthropic', 'sk-ant-test')
    await writeApiKey('anthropic', '')
    expect(await readApiKey('anthropic')).toBe('')
  })
})

describe('apiKeyStorage (Tauri desktop shell, OS keychain)', () => {
  afterEach(() => {
    delete (globalThis as { isTauri?: unknown }).isTauri
    invoke.mockReset()
  })

  it('reads through the keychain_get_api_key command, scoped by provider', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    invoke.mockResolvedValue('sk-ant-keychain')

    expect(await readApiKey('anthropic')).toBe('sk-ant-keychain')
    expect(invoke).toHaveBeenCalledWith('keychain_get_api_key', { provider: 'anthropic' })
  })

  it('returns an empty string when the keychain has no entry for the provider', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    invoke.mockResolvedValue(null)

    expect(await readApiKey('anthropic')).toBe('')
  })

  it('writes through keychain_set_api_key when given a non-empty key', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    invoke.mockResolvedValue(undefined)

    await writeApiKey('openai', 'sk-oai-keychain')

    expect(invoke).toHaveBeenCalledWith('keychain_set_api_key', { provider: 'openai', apiKey: 'sk-oai-keychain' })
  })

  it('deletes through keychain_delete_api_key when given an empty key', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    invoke.mockResolvedValue(undefined)

    await writeApiKey('openai', '')

    expect(invoke).toHaveBeenCalledWith('keychain_delete_api_key', { provider: 'openai' })
  })

  it('never touches localStorage while running under Tauri', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    invoke.mockResolvedValue(undefined)

    await writeApiKey('anthropic', 'sk-ant-keychain')

    expect(localStorage.getItem('scriptdirect:apiKey:anthropic')).toBeNull()
  })
})
