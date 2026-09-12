import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { CuadernoDocument } from '../../entities/cuaderno-document'
import { useAppStore } from '../../shared/store/useAppStore'
import { createCuadernoDocument, deleteCuadernoDocument, listCuadernoDocuments, updateCuadernoDocument } from './cuadernoStorage'
import './CuadernoScreen.css'

export function CuadernoScreen() {
  const project = useAppStore((state) => state.project)
  const [documents, setDocuments] = useState<CuadernoDocument[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')

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

  const selected = documents?.find((document) => document.id === selectedId) ?? null

  function selectDocument(document: CuadernoDocument) {
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

  async function persistDraft(patch: { title?: string; content?: string }) {
    if (!project || !selected) {
      return
    }
    const updated = await updateCuadernoDocument(project.fileSystem, selected.id, patch)
    setDocuments(updated)
  }

  async function handleDelete() {
    if (!project || !selected) {
      return
    }
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
        ← Volver al guion
      </Link>
      <h1>Cuaderno</h1>
      <p>Documentos de desarrollo: biografías, worldbuilding, notas de investigación — lo que no cabe en una escena.</p>

      <div className="cuaderno-screen__body">
        <aside className="cuaderno-screen__sidebar">
          {documents === null && <p>Cargando…</p>}
          {documents?.length === 0 && <p className="cuaderno-screen__empty">Todavía no hay documentos.</p>}
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
              Nuevo documento
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="p. ej. Biografía de Rick"
              />
            </label>
            <button type="submit" disabled={!newTitle.trim()}>
              Crear
            </button>
          </form>
        </aside>

        {selected && (
          <section className="cuaderno-screen__editor">
            <input
              type="text"
              aria-label="Título del documento"
              className="cuaderno-screen__title-input"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={() => draftTitle.trim() && persistDraft({ title: draftTitle.trim() })}
            />
            <textarea
              aria-label="Contenido del documento"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              onBlur={() => persistDraft({ content: draftContent })}
            />
            <button type="button" onClick={handleDelete} className="cuaderno-screen__delete">
              Eliminar documento
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
