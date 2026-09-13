import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { useAppStore } from '../../shared/store/useAppStore'
import './VersionHistoryScreen.css'
import { scenesToTiptapDoc } from './fountainTiptap'
import { saveDoc } from './saveDoc'
import { createVersionSnapshot, diffFountainText, listVersions, readVersionContent, type VersionEntry } from './versionHistory'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function VersionHistoryScreen() {
  const t = useTranslation()
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
    const confirmed = window.confirm(t.versionHistory.restoreConfirm(formatDate(version.createdAt)))
    if (!confirmed) {
      return
    }
    setIsRestoring(true)
    try {
      if (currentScriptText) {
        await createVersionSnapshot(
          project.fileSystem,
          project.episodeFileName,
          currentScriptText,
          t.versionHistory.restoreSnapshotLabel,
        )
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
        {t.common.backToScript}
      </Link>
      <h1>{t.versionHistory.title}</h1>

      {versions === null && <p className="version-history-screen__loading">{t.versionHistory.loading}</p>}
      {versions?.length === 0 && <p className="version-history-screen__empty">{t.versionHistory.empty}</p>}

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
                  {diffAgainstId === version.id ? t.versionHistory.hideDiff : t.versionHistory.showDiff}
                </button>
                <button type="button" onClick={() => handleRestore(version)} disabled={isRestoring}>
                  {t.versionHistory.restore}
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
