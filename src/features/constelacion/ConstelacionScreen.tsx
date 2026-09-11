import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { z } from 'zod'
import { characterSchema, type Character } from '../../entities/character'
import { locationSchema, type Location } from '../../entities/location'
import { useAppStore } from '../../shared/store/useAppStore'
import './ConstelacionScreen.css'

function sortBySceneCount<T extends { name: string; sceneIds: string[] }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.sceneIds.length - a.sceneIds.length || a.name.localeCompare(b.name))
}

export function ConstelacionScreen() {
  const project = useAppStore((state) => state.project)
  const [characters, setCharacters] = useState<Character[] | null>(null)
  const [locations, setLocations] = useState<Location[] | null>(null)

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false

    Promise.all([project.fileSystem.readCharactersJson(), project.fileSystem.readLocationsJson()]).then(
      ([charactersJson, locationsJson]) => {
        if (cancelled) {
          return
        }
        const parsedCharacters = charactersJson ? z.array(characterSchema).safeParse(JSON.parse(charactersJson)) : null
        setCharacters(parsedCharacters?.success ? parsedCharacters.data : [])

        const parsedLocations = locationsJson ? z.array(locationSchema).safeParse(JSON.parse(locationsJson)) : null
        setLocations(parsedLocations?.success ? parsedLocations.data : [])
      },
    )

    return () => {
      cancelled = true
    }
  }, [project])

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="constelacion-screen">
      <Link to="/editor" className="constelacion-screen__back">
        ← Volver al guion
      </Link>
      <h1>Constelación</h1>
      <p>
        Personajes y locaciones detectados automáticamente en el guion. Esta es la base de datos que más adelante
        alimentará el grafo de relaciones.
      </p>

      <section>
        <h2>Personajes</h2>
        {characters === null && <p className="constelacion-screen__loading">Cargando…</p>}
        {characters?.length === 0 && <p className="constelacion-screen__empty">Todavía no hay personajes.</p>}
        {characters && characters.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Grupo</th>
                <th>Escenas</th>
              </tr>
            </thead>
            <tbody>
              {sortBySceneCount(characters).map((character) => (
                <tr key={character.id}>
                  <td>{character.name}</td>
                  <td>{character.group}</td>
                  <td>{character.sceneIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Locaciones</h2>
        {locations === null && <p className="constelacion-screen__loading">Cargando…</p>}
        {locations?.length === 0 && <p className="constelacion-screen__empty">Todavía no hay locaciones.</p>}
        {locations && locations.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Locación</th>
                <th>Escenas</th>
              </tr>
            </thead>
            <tbody>
              {sortBySceneCount(locations).map((location) => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  <td>{location.sceneIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
