import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { projectSchema } from '../../entities/project'
import { readApiKey } from '../../shared/ai/apiKeyStorage'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useAppStore } from '../../shared/store/useAppStore'
import { SettingsScreen } from './SettingsScreen'

function fakeFileSystem(overrides: Partial<ProjectFileSystem> = {}): ProjectFileSystem {
  return {
    projectName: 'My Project',
    readProjectJson: async () => null,
    writeProjectJson: async () => {},
    readCharactersJson: async () => null,
    writeCharactersJson: async () => {},
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

describe('SettingsScreen', () => {
  beforeEach(() => {
    useAppStore.getState().closeProject()
    useAppStore.getState().setUiLanguage('es')
  })

  afterEach(() => {
    useAppStore.getState().closeProject()
    useAppStore.getState().setUiLanguage('es')
    localStorage.clear()
  })

  it('defaults to Spanish and switches the UI language', async () => {
    renderSettingsScreen()

    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked()

    await userEvent.click(screen.getByRole('radio', { name: 'English' }))

    expect(useAppStore.getState().uiLanguage).toBe('en')
  })

  it('updates the default model when the provider changes', async () => {
    renderSettingsScreen()

    await userEvent.selectOptions(screen.getByLabelText('Proveedor'), 'openai')

    expect(screen.getByLabelText('Modelo')).toHaveValue('gpt-4o')
  })

  it('saves the API key to localStorage, scoped to the selected provider', async () => {
    renderSettingsScreen()

    await userEvent.type(screen.getByLabelText('Clave de API'), 'sk-ant-test')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(readApiKey('anthropic')).toBe('sk-ant-test')
    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
  })

  it('loads the provider already configured on the open project', async () => {
    const projectJson = JSON.stringify(
      projectSchema.parse({
        id: 'proj_abc123456789',
        name: 'Existing',
        type: 'movie',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiProvider: { provider: 'gemini', model: 'gemini-custom' },
      }),
    )
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({ readProjectJson: async () => projectJson }),
      episodeFileName: 'script.fountain',
    })

    renderSettingsScreen()

    await waitFor(() => expect(screen.getByLabelText('Proveedor')).toHaveValue('gemini'))
    expect(screen.getByLabelText('Modelo')).toHaveValue('gemini-custom')
  })

  it('persists the chosen provider and model (never the key) to project.json', async () => {
    let savedProjectJson = ''
    const writeProjectJson = async (content: string) => {
      savedProjectJson = content
    }
    useAppStore.getState().openProject({
      fileSystem: fakeFileSystem({
        readProjectJson: async () =>
          JSON.stringify(
            projectSchema.parse({
              id: 'proj_abc123456789',
              name: 'Existing',
              type: 'movie',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          ),
        writeProjectJson,
      }),
      episodeFileName: 'script.fountain',
    })

    renderSettingsScreen()
    await userEvent.type(await screen.findByLabelText('Clave de API'), 'sk-ant-test')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    const saved = JSON.parse(savedProjectJson)
    expect(saved.aiProvider).toEqual({ provider: 'anthropic', model: 'claude-sonnet-5' })
    expect(JSON.stringify(saved)).not.toContain('sk-ant-test')
  })
})
