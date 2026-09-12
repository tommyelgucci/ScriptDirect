import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { projectSchema } from '../../entities/project'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { SettingsScreen } from './SettingsScreen'

const { readApiKey } = vi.hoisted(() => ({ readApiKey: vi.fn() }))
vi.mock('../../shared/ai/apiKeyStorage', () => ({ readApiKey, writeApiKey: vi.fn() }))

function fakeFileSystem(overrides: Partial<ProjectFileSystem> = {}): ProjectFileSystem {
  return {
    projectName: 'My Project',
    readProjectJson: async () => null,
    writeProjectJson: async () => {},
    readCharactersJson: async () => null,
    writeCharactersJson: async () => {},
    readLocationsJson: async () => null,
    writeLocationsJson: async () => {},
    readCuadernoJson: async () => null,
    writeCuadernoJson: async () => {},
    readVersionsIndexJson: async () => null,
    writeVersionsIndexJson: async () => {},
    readVersionFountain: async () => '',
    writeVersionFountain: async () => {},
    listEpisodeFountainFileNames: async () => [],
    readEpisodeFountain: async () => '',
    writeEpisodeFountain: async () => {},
    readEpisodeMeta: async () => null,
    writeEpisodeMeta: async () => {},
    ...overrides,
  }
}

function renderSettingsScreen() {
  return render(
    <MemoryRouter>
      <SettingsScreen />
    </MemoryRouter>,
  )
}

/**
 * Codex's review of PR #22: readApiKey's async IPC round-trip (the Tauri
 * keychain path) can resolve out of order. SettingsScreen always kicks off
 * a mount-time read for the default 'anthropic' provider, separately from
 * the project's own configured provider — if the project's provider
 * resolves first and the default 'anthropic' read resolves after, the key
 * field silently ends up holding the wrong provider's secret, and Guardar
 * would write it into the wrong slot.
 */
describe('SettingsScreen — provider switch race', () => {
  afterEach(() => {
    useAppStore.getState().closeProject()
    readApiKey.mockReset()
  })

  it('ignores a slower default-provider key read that resolves after the real, faster provider', async () => {
    const deferred: Record<string, (value: string) => void> = {}
    readApiKey.mockImplementation(
      (provider: string) =>
        new Promise<string>((resolve) => {
          deferred[provider] = resolve
        }),
    )

    const projectJson = JSON.stringify(
      projectSchema.parse({
        id: 'proj_abc123456789',
        name: 'Existing',
        type: 'movie',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiProvider: { provider: 'openai', model: 'gpt-4o' },
      }),
    )
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readProjectJson: async () => projectJson }),
      episodeFileName: 'script.fountain',
    })

    renderSettingsScreen()
    await waitFor(() => {
      expect(deferred.anthropic).toBeDefined()
      expect(deferred.openai).toBeDefined()
    })

    // Resolve out of order: the project's real provider (openai) answers first...
    deferred.openai('sk-oai-real')
    await waitFor(() => expect(screen.getByLabelText('Clave de API')).toHaveValue('sk-oai-real'))

    // ...then the stale mount-time default (anthropic) answers late.
    deferred.anthropic('sk-ant-stale')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.getByLabelText('Proveedor')).toHaveValue('openai')
    expect(screen.getByLabelText('Clave de API')).toHaveValue('sk-oai-real')
  })

  it('ignores a slower provider read left over from a rapid manual switch', async () => {
    const deferred: Record<string, (value: string) => void> = {}
    readApiKey.mockImplementation(
      (provider: string) =>
        new Promise<string>((resolve) => {
          deferred[provider] = resolve
        }),
    )

    renderSettingsScreen()
    await waitFor(() => expect(deferred.anthropic).toBeDefined())
    deferred.anthropic('sk-ant-initial')
    await waitFor(() => expect(screen.getByLabelText('Clave de API')).toHaveValue('sk-ant-initial'))

    await userEvent.selectOptions(screen.getByLabelText('Proveedor'), 'openai')
    await userEvent.selectOptions(screen.getByLabelText('Proveedor'), 'gemini')
    await waitFor(() => {
      expect(deferred.openai).toBeDefined()
      expect(deferred.gemini).toBeDefined()
    })

    // The abandoned 'openai' switch resolves after the final 'gemini' choice.
    deferred.gemini('sk-gemini-real')
    await waitFor(() => expect(screen.getByLabelText('Clave de API')).toHaveValue('sk-gemini-real'))
    deferred.openai('sk-oai-stale')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.getByLabelText('Proveedor')).toHaveValue('gemini')
    expect(screen.getByLabelText('Clave de API')).toHaveValue('sk-gemini-real')
  })
})
