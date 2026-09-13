import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createId } from '../entities/id'
import type { Project } from '../entities/project'
import { projectSchema } from '../entities/project'
import { useTranslation } from '../shared/i18n/useTranslation'
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
  const t = useTranslation()
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
          setError(t.home.invalidProjectJsonFolder)
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
        setError(t.home.couldNotOpenFolder)
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
        setError(t.home.zipMissingProjectJson)
        return
      }
      const parsed = safeParseJson(projectSchema, existingJson)
      if (!parsed.success) {
        setError(t.home.invalidProjectJsonZip)
        return
      }
      openProject({ fileSystem, episodeFileName: DEFAULT_EPISODE_FILE_NAME })
      navigate('/episodios')
    } catch {
      setError(t.home.couldNotReadZip)
    } finally {
      setIsOpening(false)
    }
  }

  function handleCreateZipProject() {
    setError(null)
    const name = window.prompt(t.home.newProjectNamePrompt)
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
      <h1>{t.home.title}</h1>
      <p>{t.home.subtitle}</p>
      {needsZipFallback() ? (
        <>
          <p className="home-screen__zip-notice">{t.home.zipNotice}</p>
          <button type="button" onClick={handleImportZip} disabled={isOpening}>
            {isOpening ? t.home.opening : t.home.importZip}
          </button>
          <button type="button" onClick={handleCreateZipProject} disabled={isOpening}>
            {t.home.createNewProject}
          </button>
        </>
      ) : (
        <button type="button" onClick={handleOpenProject} disabled={isOpening}>
          {isOpening ? t.home.opening : t.home.openFolder}
        </button>
      )}
      <p>
        <Link to="/settings">{t.home.settingsLink}</Link>
      </p>
      {error && (
        <p role="alert" className="home-screen__error">
          {error}
        </p>
      )}
    </main>
  )
}
