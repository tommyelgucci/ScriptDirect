import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { CuadernoDocument } from '../../entities/cuaderno-document'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { useAppStore } from '../../shared/store/useAppStore'
import { createCuadernoDocument, deleteCuadernoDocument, listCuadernoDocuments, updateCuadernoDocument } from './cuadernoStorage'
import './CuadernoScreen.css'

const AUTOSAVE_DELAY_MS = 800

interface PendingSave {
  id: string
  title: string
  content: string
}

export function CuadernoScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)
  const [documents, setDocuments] = useState<CuadernoDocument[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef<PendingSave | null>(null)

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

  const flushPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    const pending = pendingSaveRef.current
    pendingSaveRef.current = null
    if (!project || !pending) {
      return
    }
    const patch: { title?: string; content?: string } = { content: pending.content }
    if (pending.title.trim()) {
      patch.title = pending.title.trim()
    }
    void updateCuadernoDocument(project.fileSystem, pending.id, patch).then(setDocuments)
  }, [project])

  // Flush any pending debounced autosave when the project changes or this
  // screen unmounts (navigating away, closing the tab). Content only wrote
  // on blur before, per Codex's review of PR #22: closing the tab/window
  // while a field is still focused never fires blur, so the last edit was
  // silently dropped despite Chromium/Tauri otherwise persisting to real
  // disk. This mirrors EditorScreen's identical autosave-flush pattern.
  useEffect(() => flushPendingSave, [flushPendingSave])

  const selected = documents?.find((document) => document.id === selectedId) ?? null

  function scheduleSave(nextTitle: string, nextContent: string) {
    if (!selected) {
      return
    }
    pendingSaveRef.current = { id: selected.id, title: nextTitle, content: nextContent }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(flushPendingSave, AUTOSAVE_DELAY_MS)
  }

  function selectDocument(document: CuadernoDocument) {
    flushPendingSave()
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
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    pendingSaveRef.current = null
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
              onBlur={flushPendingSave}
            />
            <textarea
              aria-label={t.cuaderno.contentInputLabel}
              value={draftContent}
              onChange={(event) => {
                setDraftContent(event.target.value)
                scheduleSave(draftTitle, event.target.value)
              }}
              onBlur={flushPendingSave}
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
