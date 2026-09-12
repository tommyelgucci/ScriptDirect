import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AiProviderName } from '../../entities/project'
import { projectSchema } from '../../entities/project'
import { readApiKey, writeApiKey } from '../../shared/ai/apiKeyStorage'
import { isTauriRuntime } from '../../shared/fs/capability'
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
  const project = useAppStore((state) => state.project)
  const uiLanguage = useAppStore((state) => state.uiLanguage)
  const setUiLanguage = useAppStore((state) => state.setUiLanguage)

  const [provider, setProvider] = useState<AiProviderName>('anthropic')
  const [model, setModel] = useState(defaultModelFor('anthropic'))
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  async function applyProvider(nextProvider: AiProviderName, nextModel: string) {
    setProvider(nextProvider)
    setModel(nextModel)
    setApiKey(await readApiKey(nextProvider))
  }

  useEffect(() => {
    let cancelled = false
    readApiKey('anthropic').then((key) => {
      if (!cancelled) {
        setApiKey(key)
      }
    })
    return () => {
      cancelled = true
    }
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
      const parsed = projectSchema.safeParse(JSON.parse(json))
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
        ← Volver
      </Link>
      <h1>Configuración</h1>

      <section>
        <h2>Idioma</h2>
        <div role="radiogroup" aria-label="Idioma de la interfaz">
          <label>
            <input
              type="radio"
              name="uiLanguage"
              checked={uiLanguage === 'es'}
              onChange={() => setUiLanguage('es')}
            />
            Español
          </label>
          <label>
            <input
              type="radio"
              name="uiLanguage"
              checked={uiLanguage === 'en'}
              onChange={() => setUiLanguage('en')}
            />
            English
          </label>
        </div>
      </section>

      <section>
        <h2>Proveedor de IA (BYOK)</h2>
        <p className="settings-screen__disclosure">
          {isTauriRuntime()
            ? 'Tu clave se guarda en el llavero de tu sistema operativo y se envía únicamente al proveedor que elijas — nunca a un servidor de ScriptDirect.'
            : 'Tu clave se guarda solo en este navegador (localStorage) y se envía únicamente al proveedor que elijas — nunca a un servidor de ScriptDirect. No es un almacenamiento fuertemente cifrado: evita usarla en un equipo compartido.'}
        </p>

        <label>
          Proveedor
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
          Modelo
          <input type="text" value={model} onChange={(event) => setModel(event.target.value)} />
        </label>

        <label>
          Clave de API
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
          Guardar
        </button>
        {saved && <span role="status">Guardado</span>}
      </section>
    </main>
  )
}
