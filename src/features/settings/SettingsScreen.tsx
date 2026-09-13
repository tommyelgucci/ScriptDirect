import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AiProviderName } from '../../entities/project'
import { projectSchema } from '../../entities/project'
import { readApiKey, writeApiKey } from '../../shared/ai/apiKeyStorage'
import { isTauriRuntime } from '../../shared/fs/capability'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { safeParseJson } from '../../shared/json/safeParseJson'
import { useAppStore } from '../../shared/store/useAppStore'
import './SettingsScreen.css'

interface ProviderOption {
  value: AiProviderName
  label: string
  defaultModel: string
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-5' },
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash' },
]

function defaultModelFor(provider: AiProviderName): string {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.defaultModel ?? ''
}

export function SettingsScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)
  const uiLanguage = useAppStore((state) => state.uiLanguage)
  const setUiLanguage = useAppStore((state) => state.setUiLanguage)

  const [provider, setProvider] = useState<AiProviderName>('anthropic')
  const [model, setModel] = useState(defaultModelFor('anthropic'))
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  // Guards against readApiKey's async IPC round-trip (Tauri keychain)
  // resolving out of order: whichever provider was requested most recently
  // wins, even if an earlier request's key arrives later. Set synchronously
  // at request time, not at resolution time, so it can't itself race.
  const latestRequestedProviderRef = useRef<AiProviderName>('anthropic')

  async function applyProvider(nextProvider: AiProviderName, nextModel: string) {
    latestRequestedProviderRef.current = nextProvider
    setProvider(nextProvider)
    setModel(nextModel)
    const key = await readApiKey(nextProvider)
    if (latestRequestedProviderRef.current === nextProvider) {
      setApiKey(key)
    }
  }

  // Loads the initially-selected provider's key. 'provider'/'model' state
  // already default to 'anthropic' via useState, so this only needs to read
  // the key — no need to setState synchronously in the effect body for
  // values that already match. The project effect below applies the
  // project's real configured provider on top, once it resolves.
  useEffect(() => {
    latestRequestedProviderRef.current = 'anthropic'
    readApiKey('anthropic').then((key) => {
      if (latestRequestedProviderRef.current === 'anthropic') {
        setApiKey(key)
      }
    })
  }, [])

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false
    project.fileSystem.readProjectJson().then(async (json) => {
      if (cancelled || !json) {
        return
      }
      const parsed = safeParseJson(projectSchema, json)
      if (parsed.success && parsed.data.aiProvider) {
        await applyProvider(
          parsed.data.aiProvider.provider,
          parsed.data.aiProvider.model ?? defaultModelFor(parsed.data.aiProvider.provider),
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [project])

  function handleProviderChange(nextProvider: AiProviderName) {
    void applyProvider(nextProvider, defaultModelFor(nextProvider))
  }

  async function handleSave() {
    await writeApiKey(provider, apiKey)

    if (project) {
      const json = await project.fileSystem.readProjectJson()
      if (json) {
        const current = projectSchema.parse(JSON.parse(json))
        const updated = projectSchema.parse({
          ...current,
          aiProvider: { provider, model: model || undefined },
          updatedAt: new Date().toISOString(),
        })
        await project.fileSystem.writeProjectJson(JSON.stringify(updated, null, 2))
      }
    }

    setSaved(true)
  }

  return (
    <main className="settings-screen">
      <Link to={project ? '/editor' : '/'} className="settings-screen__back">
        {t.settings.back}
      </Link>
      <h1>{t.settings.title}</h1>

      <section>
        <h2>{t.settings.language}</h2>
        <div role="radiogroup" aria-label={t.settings.languageAriaLabel}>
          <label>
            <input
              type="radio"
              name="uiLanguage"
              checked={uiLanguage === 'es'}
              onChange={() => setUiLanguage('es')}
            />
            {t.settings.spanish}
          </label>
          <label>
            <input
              type="radio"
              name="uiLanguage"
              checked={uiLanguage === 'en'}
              onChange={() => setUiLanguage('en')}
            />
            {t.settings.english}
          </label>
        </div>
      </section>

      <section>
        <h2>{t.settings.aiProvider}</h2>
        <p className="settings-screen__disclosure">
          {isTauriRuntime() ? t.settings.disclosureTauri : t.settings.disclosureBrowser}
        </p>

        <label>
          {t.settings.provider}
          <select
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value as AiProviderName)}
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t.settings.model}
          <input type="text" value={model} onChange={(event) => setModel(event.target.value)} />
        </label>

        <label>
          {t.settings.apiKey}
          <input
            type="password"
            value={apiKey}
            autoComplete="off"
            onChange={(event) => {
              setApiKey(event.target.value)
              setSaved(false)
            }}
          />
        </label>

        <button type="button" onClick={handleSave}>
          {t.settings.save}
        </button>
        {saved && <span role="status">{t.settings.saved}</span>}
      </section>
    </main>
  )
}
