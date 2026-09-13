import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { useAppStore } from '../../shared/store/useAppStore'
import { episodeLabel, formatEpisodeFountainFileName } from './episodeFileName'
import './EpisodesScreen.css'

export function EpisodesScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)
  const setEpisodeFileName = useAppStore((state) => state.setEpisodeFileName)
  const navigate = useNavigate()

  const [fountainFileNames, setFountainFileNames] = useState<string[] | null>(null)
  const [season, setSeason] = useState('1')
  const [episodeNumber, setEpisodeNumber] = useState('1')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false
    project.fileSystem.listEpisodeFountainFileNames().then((names) => {
      if (!cancelled) {
        setFountainFileNames(names)
      }
    })
    return () => {
      cancelled = true
    }
  }, [project])

  function handleOpenEpisode(fountainFileName: string) {
    setEpisodeFileName(fountainFileName)
    navigate('/editor')
  }

  function handleCreateEpisode(event: FormEvent) {
    event.preventDefault()
    setErrorMessage(null)

    const seasonNumber = Number(season)
    const episodeNumberValue = Number(episodeNumber)
    if (!Number.isInteger(seasonNumber) || seasonNumber < 1 || !Number.isInteger(episodeNumberValue) || episodeNumberValue < 1) {
      setErrorMessage(t.episodes.invalidNumbers)
      return
    }

    const fountainFileName = formatEpisodeFountainFileName(seasonNumber, episodeNumberValue)
    if (fountainFileNames?.includes(fountainFileName)) {
      setErrorMessage(t.episodes.duplicateEpisode)
      return
    }

    handleOpenEpisode(fountainFileName)
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="episodes-screen">
      <Link to="/editor" className="episodes-screen__back">
        {t.common.backToScript}
      </Link>
      <h1>{t.episodes.title}</h1>
      <p>{project.fileSystem.projectName}</p>

      {fountainFileNames === null && <p className="episodes-screen__loading">{t.episodes.loadingEpisodes}</p>}

      {fountainFileNames && fountainFileNames.length === 0 && (
        <p className="episodes-screen__empty">{t.episodes.empty}</p>
      )}

      {fountainFileNames && fountainFileNames.length > 0 && (
        <ul className="episodes-screen__list">
          {fountainFileNames.map((fountainFileName) => (
            <li key={fountainFileName}>
              <button type="button" onClick={() => handleOpenEpisode(fountainFileName)}>
                {episodeLabel(fountainFileName)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="episodes-screen__create" onSubmit={handleCreateEpisode}>
        <h2>{t.episodes.newEpisode}</h2>
        <label>
          {t.episodes.season}
          <input
            type="number"
            min={1}
            value={season}
            onChange={(event) => setSeason(event.target.value)}
          />
        </label>
        <label>
          {t.episodes.episode}
          <input
            type="number"
            min={1}
            value={episodeNumber}
            onChange={(event) => setEpisodeNumber(event.target.value)}
          />
        </label>
        <button type="submit">{t.episodes.createEpisode}</button>
      </form>

      {errorMessage && (
        <p role="alert" className="episodes-screen__error">
          {errorMessage}
        </p>
      )}
    </main>
  )
}
