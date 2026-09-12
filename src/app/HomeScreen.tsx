import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createId } from '../entities/id'
import type { Project } from '../entities/project'
import { projectSchema } from '../entities/project'
import { safeParseJson } from '../shared/json/safeParseJson'
import {
  FileSystemAccessUnsupportedError,
  needsZipFallback,
  pickProjectFolder,
  pickProjectZipFile,
  ProjectFolderSelectionCancelledError,
  ZipProjectFileSystem,
} from '../shared/fs'
import { DEFAULT_EPISODE_FILE_NAME, useAppStore } from '../shared/store/useAppStore'
import './HomeScreen.css'

function createNewProject(name: string): Project {
  const now = new Date().toISOString()
  return projectSchema.parse({
    id: createId('proj'),
    name,
    type: 'series',
    createdAt: now,
    updatedAt: now,
  })
}

export function HomeScreen() {
  const navigate = useNavigate()
  const openProject = useAppStore((state) => state.openProject)
  const [error, setError] = useState<string | null>(null)
  const [isOpening, setIsOpening] = useState(false)

  async function handleOpenProject() {
    setError(null)
    setIsOpening(true)
    try {
      const fileSystem = await pickProjectFolder()
      const existingJson = await fileSystem.readProjectJson()

      if (existingJson) {
        const parsed = safeParseJson(projectSchema, existingJson)
        if (!parsed.success) {
          setError('El archivo project.json de esta carpeta no es válido.')
          return
        }
      } else {
        const project = createNewProject(fileSystem.projectName)
        await fileSystem.writeProjectJson(JSON.stringify(project, null, 2))
      }

      openProject({ fileSystem, episodeFileName: DEFAULT_EPISODE_FILE_NAME })
      navigate('/episodios')
    } catch (caught) {
      if (caught instanceof ProjectFolderSelectionCancelledError) {
        // The writer dismissed the folder dialog; nothing went wrong.
      } else if (caught instanceof FileSystemAccessUnsupportedError) {
        setError(caught.message)
      } else {
        setError('No se pudo abrir la carpeta del proyecto.')
      }
    } finally {
      setIsOpening(false)
    }
  }

  async function handleImportZip() {
    setError(null)
    setIsOpening(true)
    try {
      const file = await pickProjectZipFile()
      if (!file) {
        return // writer dismissed the picker; nothing went wrong
      }
      const projectName = file.name.replace(/\.zip$/i, '')
      const fileSystem = await ZipProjectFileSystem.importZip(new Uint8Array(await file.arrayBuffer()), projectName)
      const existingJson = await fileSystem.readProjectJson()
      if (!existingJson) {
        setError('Este .zip no contiene un proyecto de ScriptDirect (falta project.json).')
        return
      }
      const parsed = safeParseJson(projectSchema, existingJson)
      if (!parsed.success) {
        setError('El archivo project.json de este .zip no es válido.')
        return
      }
      openProject({ fileSystem, episodeFileName: DEFAULT_EPISODE_FILE_NAME })
      navigate('/episodios')
    } catch {
      setError('No se pudo leer el archivo .zip.')
    } finally {
      setIsOpening(false)
    }
  }

  function handleCreateZipProject() {
    setError(null)
    const name = window.prompt('Nombre del proyecto:')
    if (!name) {
      return // writer cancelled or left it empty
    }
    const fileSystem = ZipProjectFileSystem.createEmpty(name)
    const project = createNewProject(name)
    void fileSystem.writeProjectJson(JSON.stringify(project, null, 2))
    openProject({ fileSystem, episodeFileName: DEFAULT_EPISODE_FILE_NAME })
    navigate('/episodios')
  }

  return (
    <main className="home-screen">
      <h1>ScriptDirect</h1>
      <p>Suite de guionismo local-first. Un proyecto es una carpeta en tu disco.</p>
      {needsZipFallback() ? (
        <>
          <p className="home-screen__zip-notice">
            Tu navegador (Safari o Firefox) no permite abrir carpetas directamente. ScriptDirect guarda tu proyecto
            como un archivo .zip en su lugar — recuerda exportarlo desde el editor después de cada sesión de
            trabajo, o instala la versión de escritorio para guardado automático en una carpeta real.
          </p>
          <button type="button" onClick={handleImportZip} disabled={isOpening}>
            {isOpening ? 'Abriendo…' : 'Importar proyecto (.zip)'}
          </button>
          <button type="button" onClick={handleCreateZipProject} disabled={isOpening}>
            Crear nuevo proyecto
          </button>
        </>
      ) : (
        <button type="button" onClick={handleOpenProject} disabled={isOpening}>
          {isOpening ? 'Abriendo…' : 'Abrir carpeta de proyecto'}
        </button>
      )}
      <p>
        <Link to="/settings">Configuración</Link>
      </p>
      {error && (
        <p role="alert" className="home-screen__error">
          {error}
        </p>
      )}
    </main>
  )
}
