import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import { useAppStore } from '../../shared/store/useAppStore'
import './VersionHistoryScreen.css'
import { scenesToTiptapDoc } from './fountainTiptap'
import { saveDoc } from './saveDoc'
import { createVersionSnapshot, diffFountainText, listVersions, readVersionContent, type VersionEntry } from './versionHistory'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function VersionHistoryScreen() {
  const project = useAppStore((state) => state.project)
  const navigate = useNavigate()

  const [versions, setVersions] = useState<VersionEntry[] | null>(null)
  const [currentScriptText, setCurrentScriptText] = useState<string | null>(null)
  const [diffAgainstId, setDiffAgainstId] = useState<string | null>(null)
  const [diffContent, setDiffContent] = useState<ReturnType<typeof diffFountainText> | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false

    Promise.all([
      listVersions(project.fileSystem, project.episodeFileName),
      project.fileSystem.readEpisodeFountain(project.episodeFileName).catch(() => ''),
    ]).then(([entries, scriptText]) => {
      if (cancelled) {
        return
      }
      setVersions(entries)
      setCurrentScriptText(ensureSceneIds(scriptText))
    })

    return () => {
      cancelled = true
    }
  }, [project])

  async function handleToggleDiff(version: VersionEntry) {
    if (!project) {
      return
    }
    if (diffAgainstId === version.id) {
      setDiffAgainstId(null)
      setDiffContent(null)
      return
    }
    const oldText = await readVersionContent(project.fileSystem, project.episodeFileName, version)
    setDiffAgainstId(version.id)
    setDiffContent(diffFountainText(oldText, currentScriptText ?? ''))
  }

  async function handleRestore(version: VersionEntry) {
    if (!project) {
      return
    }
    const confirmed = window.confirm(
      `¿Restaurar la versión del ${formatDate(version.createdAt)}? El guion actual se guarda primero como una versión nueva, así que nada se pierde.`,
    )
    if (!confirmed) {
      return
    }
    setIsRestoring(true)
    try {
      if (currentScriptText) {
        await createVersionSnapshot(project.fileSystem, project.episodeFileName, currentScriptText, 'Antes de restaurar')
      }
      const text = await readVersionContent(project.fileSystem, project.episodeFileName, version)
      const doc = scenesToTiptapDoc(parseFountainDocument(ensureSceneIds(text)))
      await saveDoc(project.fileSystem, project.episodeFileName, doc)
      navigate('/editor')
    } finally {
      setIsRestoring(false)
    }
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="version-history-screen">
      <Link to="/editor" className="version-history-screen__back">
        ← Volver al guion
      </Link>
      <h1>Historial de versiones</h1>

      {versions === null && <p className="version-history-screen__loading">Cargando…</p>}
      {versions?.length === 0 && (
        <p className="version-history-screen__empty">
          Todavía no has guardado ninguna versión. Usa "Guardar versión" en el editor para crear la primera.
        </p>
      )}

      <ul className="version-history-screen__list">
        {versions?.map((version) => (
          <li key={version.id}>
            <div className="version-history-screen__entry">
              <div>
                <strong>{formatDate(version.createdAt)}</strong>
                {version.label && <span className="version-history-screen__label"> — {version.label}</span>}
              </div>
              <div className="version-history-screen__actions">
                <button type="button" onClick={() => handleToggleDiff(version)}>
                  {diffAgainstId === version.id ? 'Ocultar diferencias' : 'Ver diferencias'}
                </button>
                <button type="button" onClick={() => handleRestore(version)} disabled={isRestoring}>
                  Restaurar
                </button>
              </div>
            </div>
            {diffAgainstId === version.id && diffContent && (
              <pre className="version-history-screen__diff">
                {diffContent.map((change, index) => (
                  <span
                    key={index}
                    className={
                      change.added
                        ? 'version-history-screen__diff-added'
                        : change.removed
                          ? 'version-history-screen__diff-removed'
                          : undefined
                    }
                  >
                    {change.value}
                  </span>
                ))}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
