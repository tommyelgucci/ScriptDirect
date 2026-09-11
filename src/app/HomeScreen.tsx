import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createId } from '../entities/id'
import type { Project } from '../entities/project'
import { projectSchema } from '../entities/project'
import { FileSystemAccessUnsupportedError, pickProjectFolder } from '../shared/fs'
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
        const parsed = projectSchema.safeParse(JSON.parse(existingJson))
        if (!parsed.success) {
          setError('El archivo project.json de esta carpeta no es válido.')
          return
        }
      } else {
        const project = createNewProject(fileSystem.projectName)
        await fileSystem.writeProjectJson(JSON.stringify(project, null, 2))
      }

      openProject({ fileSystem, episodeFileName: DEFAULT_EPISODE_FILE_NAME })
      navigate('/editor')
    } catch (caught) {
      if (caught instanceof FileSystemAccessUnsupportedError) {
        setError(caught.message)
      } else {
        setError('No se pudo abrir la carpeta del proyecto.')
      }
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <main className="home-screen">
      <h1>ScriptDirect</h1>
      <p>Suite de guionismo local-first. Un proyecto es una carpeta en tu disco.</p>
      <button type="button" onClick={handleOpenProject} disabled={isOpening}>
        {isOpening ? 'Abriendo…' : 'Abrir carpeta de proyecto'}
      </button>
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
