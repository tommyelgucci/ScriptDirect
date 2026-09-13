import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { Act } from '../../entities/beat'
import { readEpisodeMeta, updateEpisodeMeta } from '../../shared/fs/episodeMeta'
import { parseFountainDocument } from '../../shared/fountain'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { useAppStore } from '../../shared/store/useAppStore'
import { buildRutaRows, rowsToBeats, type RutaRow } from './buildRutaRows'
import './RutaScreen.css'

const ACTS: Act[] = [1, 2, 3]

export function RutaScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)
  const [rows, setRows] = useState<RutaRow[] | null>(null)

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false
    Promise.all([
      project.fileSystem.readEpisodeFountain(project.episodeFileName),
      readEpisodeMeta(project.fileSystem, project.episodeFileName),
    ]).then(([scriptText, meta]) => {
      if (cancelled) {
        return
      }
      const scenes = parseFountainDocument(scriptText)
      setRows(buildRutaRows(scenes, meta.beats))
    })
    return () => {
      cancelled = true
    }
  }, [project])

  async function persistRows(nextRows: RutaRow[]) {
    if (!project) {
      return
    }
    await updateEpisodeMeta(project.fileSystem, project.episodeFileName, { beats: rowsToBeats(nextRows) })
  }

  function handleActChange(sceneId: string, act: Act) {
    setRows((previousRows) => {
      if (!previousRows) {
        return previousRows
      }
      const nextRows = previousRows.map((row) => (row.sceneId === sceneId ? { ...row, act } : row))
      void persistRows(nextRows)
      return nextRows
    })
  }

  function handleLabelChange(sceneId: string, label: string) {
    setRows((previousRows) => {
      if (!previousRows) {
        return previousRows
      }
      return previousRows.map((row) => (row.sceneId === sceneId ? { ...row, label } : row))
    })
  }

  function handleLabelBlur() {
    if (rows) {
      void persistRows(rows)
    }
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="ruta-screen">
      <Link to="/editor" className="ruta-screen__back">
        {t.common.backToScript}
      </Link>
      <h1>{t.ruta.title}</h1>
      <p>{t.ruta.subtitle}</p>

      {rows === null && <p className="ruta-screen__loading">{t.ruta.loading}</p>}
      {rows?.length === 0 && <p className="ruta-screen__empty">{t.ruta.empty}</p>}

      {rows && rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{t.ruta.scene}</th>
              <th>{t.ruta.act}</th>
              <th>{t.ruta.beat}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sceneId} className={`ruta-screen__row ruta-screen__row--act-${row.act}`}>
                <td>{row.heading}</td>
                <td>
                  <select
                    aria-label={t.ruta.actAriaLabel(row.heading)}
                    value={row.act}
                    onChange={(event) => handleActChange(row.sceneId, Number(event.target.value) as Act)}
                  >
                    {ACTS.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    aria-label={t.ruta.beatAriaLabel(row.heading)}
                    value={row.label}
                    onChange={(event) => handleLabelChange(row.sceneId, event.target.value)}
                    onBlur={handleLabelBlur}
                    placeholder={t.ruta.beatPlaceholder}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
