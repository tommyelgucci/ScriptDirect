import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { CuadernoDocument } from '../../entities/cuaderno-document'
import { createAutosaveScheduler } from '../../shared/autosave/autosaveScheduler'
import type { ProjectFileSystem } from '../../shared/fs/types'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { useAppStore } from '../../shared/store/useAppStore'
import { createCuadernoDocument, deleteCuadernoDocument, listCuadernoDocuments, updateCuadernoDocument } from './cuadernoStorage'
import './CuadernoScreen.css'

const AUTOSAVE_DELAY_MS = 800

interface PendingSave {
  fileSystem: ProjectFileSystem
  id: string
  title: string
  content: string
}

// updateCuadernoDocument() isn't atomic (reads cuaderno.json, maps over it,
// rewrites the whole file), so two overlapping calls can both read the same
// snapshot and the later one's write clobbers the other's — exactly what
// EditorScreen's autosaveScheduler already exists to prevent (Codex flagged
// this same class of bug here too). One scheduler for the component's whole
// lifetime, same pattern as EditorScreen: useState's lazy initializer runs
// exactly once, unlike useMemo.
function save({ fileSystem, id, title, content }: PendingSave, setDocuments: (docs: CuadernoDocument[]) => void) {
  const patch: { title?: string; content?: string } = { content }
  if (title.trim()) {
    patch.title = title.trim()
  }
  return updateCuadernoDocument(fileSystem, id, patch).then(setDocuments)
}

export function CuadernoScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)
  const [documents, setDocuments] = useState<CuadernoDocument[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')

  const [scheduler] = useState(() =>
    createAutosaveScheduler<PendingSave>((pending) => save(pending, setDocuments), AUTOSAVE_DELAY_MS),
  )

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false
    listCuadernoDocuments(project.fileSystem).then((loaded) => {
      if (!cancelled) {
        setDocuments(loaded)
      }
    })
    return () => {
      cancelled = true
    }
  }, [project])

  // Flush any pending debounced autosave when the project changes or this
  // screen unmounts (navigating away, closing the tab). Content only wrote
  // on blur before, per Codex's review of PR #22: closing the tab/window
  // while a field is still focused never fires blur, so the last edit was
  // silently dropped despite Chromium/Tauri otherwise persisting to real
  // disk. This mirrors EditorScreen's identical autosave-flush pattern.
  useEffect(() => () => void scheduler.flush(), [project, scheduler])

  const selected = documents?.find((document) => document.id === selectedId) ?? null

  function scheduleSave(nextTitle: string, nextContent: string) {
    if (!project || !selected) {
      return
    }
    scheduler.schedule({ fileSystem: project.fileSystem, id: selected.id, title: nextTitle, content: nextContent })
  }

  function selectDocument(document: CuadernoDocument) {
    void scheduler.flush()
    setSelectedId(document.id)
    setDraftTitle(document.title)
    setDraftContent(document.content)
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!project || !newTitle.trim()) {
      return
    }
    const updated = await createCuadernoDocument(project.fileSystem, newTitle.trim())
    setDocuments(updated)
    setNewTitle('')
    selectDocument(updated[updated.length - 1])
  }

  async function handleDelete() {
    if (!project || !selected) {
      return
    }
    // Discard any pending edit rather than saving it right before deleting the document.
    scheduler.cancel()
    const updated = await deleteCuadernoDocument(project.fileSystem, selected.id)
    setDocuments(updated)
    setSelectedId(null)
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="cuaderno-screen">
      <Link to="/editor" className="cuaderno-screen__back">
        {t.common.backToScript}
      </Link>
      <h1>{t.cuaderno.title}</h1>
      <p>{t.cuaderno.subtitle}</p>

      <div className="cuaderno-screen__body">
        <aside className="cuaderno-screen__sidebar">
          {documents === null && <p>{t.cuaderno.loading}</p>}
          {documents?.length === 0 && <p className="cuaderno-screen__empty">{t.cuaderno.empty}</p>}
          <ul className="cuaderno-screen__list">
            {documents?.map((document) => (
              <li key={document.id}>
                <button
                  type="button"
                  className={document.id === selectedId ? 'cuaderno-screen__list-item--active' : undefined}
                  onClick={() => selectDocument(document)}
                >
                  {document.title}
                </button>
              </li>
            ))}
          </ul>

          <form className="cuaderno-screen__create" onSubmit={handleCreate}>
            <label>
              {t.cuaderno.newDocument}
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder={t.cuaderno.newDocumentPlaceholder}
              />
            </label>
            <button type="submit" disabled={!newTitle.trim()}>
              {t.cuaderno.create}
            </button>
          </form>
        </aside>

        {selected && (
          <section className="cuaderno-screen__editor">
            <input
              type="text"
              aria-label={t.cuaderno.titleInputLabel}
              className="cuaderno-screen__title-input"
              value={draftTitle}
              onChange={(event) => {
                setDraftTitle(event.target.value)
                scheduleSave(event.target.value, draftContent)
              }}
              onBlur={() => void scheduler.flush()}
            />
            <textarea
              aria-label={t.cuaderno.contentInputLabel}
              value={draftContent}
              onChange={(event) => {
                setDraftContent(event.target.value)
                scheduleSave(draftTitle, event.target.value)
              }}
              onBlur={() => void scheduler.flush()}
            />
            <button type="button" onClick={handleDelete} className="cuaderno-screen__delete">
              {t.cuaderno.deleteDocument}
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
