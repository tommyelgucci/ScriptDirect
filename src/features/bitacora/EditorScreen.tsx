import type { Editor, JSONContent } from '@tiptap/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ensureSceneIds, parseFountainDocument } from '../../shared/fountain'
import { downloadBlob } from '../../shared/pdf/downloadBlob'
import { exportScreenplayPdf } from '../../shared/pdf/exportScreenplayPdf'
import { useAppStore } from '../../shared/store/useAppStore'
import { BlockEditor } from './BlockEditor'
import './EditorScreen.css'
import { scenesToTiptapDoc, tiptapDocToFountainText } from './fountainTiptap'
import { saveDoc } from './saveDoc'
import { extractSceneList } from './sceneList'
import { SceneSidebar } from './SceneSidebar'
import { createVersionSnapshot } from './versionHistory'

const AUTOSAVE_DELAY_MS = 800

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function EditorScreen() {
  const project = useAppStore((state) => state.project)
  const closeProject = useAppStore((state) => state.closeProject)

  const [content, setContent] = useState<JSONContent | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const editorRef = useRef<Editor | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestDocRef = useRef<JSONContent | null>(null)

  useEffect(() => {
    if (!project) {
      return
    }
    const activeProject = project
    let cancelled = false

    async function load() {
      try {
        const text = await activeProject.fileSystem.readEpisodeFountain(activeProject.episodeFileName)
        const tagged = ensureSceneIds(text)
        if (!cancelled) {
          setContent(scenesToTiptapDoc(parseFountainDocument(tagged)))
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          if (!cancelled) {
            setContent(scenesToTiptapDoc([]))
          }
          return
        }
        if (!cancelled) {
          setLoadError('No se pudo abrir el guion de este proyecto.')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [project])

  const scheduleSave = useCallback(
    (doc: JSONContent) => {
      if (!project) {
        return
      }
      latestDocRef.current = doc
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      setSaveStatus('saving')
      saveTimeoutRef.current = setTimeout(() => {
        saveDoc(project.fileSystem, project.episodeFileName, doc)
          .then(() => setSaveStatus('saved'))
          .catch(() => setSaveStatus('error'))
      }, AUTOSAVE_DELAY_MS)
    },
    [project],
  )

  // Flush any pending autosave immediately when leaving the editor, so
  // closing the project (or navigating away) can't drop the last edit.
  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (project && latestDocRef.current) {
        void saveDoc(project.fileSystem, project.episodeFileName, latestDocRef.current)
      }
    },
    [project],
  )

  const handleChange = useCallback(
    (doc: JSONContent) => {
      setContent(doc)
      scheduleSave(doc)
    },
    [scheduleSave],
  )

  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor
  }, [])

  const handleExportPdf = useCallback(async () => {
    if (!project || !content) {
      return
    }
    const scenes = parseFountainDocument(ensureSceneIds(tiptapDocToFountainText(content)))
    const bytes = await exportScreenplayPdf(project.fileSystem.projectName, scenes)
    downloadBlob(bytes, `${project.fileSystem.projectName}.pdf`, 'application/pdf')
  }, [project, content])

  const handleSaveVersion = useCallback(async () => {
    if (!project || !content) {
      return
    }
    const promptResult = window.prompt('Etiqueta para esta versión (opcional):')
    if (promptResult === null) {
      return // user cancelled
    }
    const text = ensureSceneIds(tiptapDocToFountainText(content))
    await createVersionSnapshot(project.fileSystem, project.episodeFileName, text, promptResult.trim() || undefined)
  }, [project, content])

  const handleSelectScene = useCallback((sceneId: string) => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === 'heading' && node.attrs.sceneId === sceneId) {
        editor.commands.focus(offset + 1, { scrollIntoView: true })
      }
    })
  }, [])

  if (!project) {
    return <Navigate to="/" replace />
  }

  if (loadError) {
    return (
      <main className="editor-screen editor-screen--error">
        <p role="alert">{loadError}</p>
      </main>
    )
  }

  if (!content) {
    return (
      <main className="editor-screen editor-screen--loading">
        <p>Cargando guion…</p>
      </main>
    )
  }

  const scenes = extractSceneList(content)

  return (
    <div className="editor-screen">
      <header className="editor-screen__header">
        <span>{project.fileSystem.projectName}</span>
        <span className="editor-screen__status">
          {saveStatus === 'saving' && 'Guardando…'}
          {saveStatus === 'saved' && 'Guardado'}
          {saveStatus === 'error' && 'Error al guardar'}
        </span>
        <Link to="/episodios">Episodios</Link>
        <Link to="/brujula">Brújula</Link>
        <Link to="/constelacion">Constelación</Link>
        <Link to="/historial">Historial</Link>
        <Link to="/settings">Configuración</Link>
        <button type="button" onClick={handleSaveVersion}>
          Guardar versión
        </button>
        <button type="button" onClick={handleExportPdf}>
          Exportar PDF
        </button>
        <button type="button" onClick={closeProject}>
          Cerrar proyecto
        </button>
      </header>
      <div className="editor-screen__body">
        <SceneSidebar scenes={scenes} onSelectScene={handleSelectScene} />
        <BlockEditor content={content} onChange={handleChange} onEditorReady={handleEditorReady} />
      </div>
    </div>
  )
}
