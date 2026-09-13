import { Fragment, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { z } from 'zod'
import { characterSchema, type Character, type CharacterTraits } from '../../entities/character'
import { locationSchema, type Location } from '../../entities/location'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { safeParseJson } from '../../shared/json/safeParseJson'
import { useAppStore } from '../../shared/store/useAppStore'
import { CharacterTraitsEditor } from './CharacterTraitsEditor'
import './ConstelacionScreen.css'
import { updateCharacterTraits } from './updateCharacterTraits'

function sortBySceneCount<T extends { name: string; sceneIds: string[] }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.sceneIds.length - a.sceneIds.length || a.name.localeCompare(b.name))
}

export function ConstelacionScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)
  const [characters, setCharacters] = useState<Character[] | null>(null)
  const [locations, setLocations] = useState<Location[] | null>(null)
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null)

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
        const parsedCharacters = charactersJson ? safeParseJson(z.array(characterSchema), charactersJson) : null
        setCharacters(parsedCharacters?.success ? parsedCharacters.data : [])

        const parsedLocations = locationsJson ? safeParseJson(z.array(locationSchema), locationsJson) : null
        setLocations(parsedLocations?.success ? parsedLocations.data : [])
      },
    )

    return () => {
      cancelled = true
    }
  }, [project])

  async function handleSaveTraits(characterId: string, traits: CharacterTraits) {
    if (!project) {
      return
    }
    const updated = await updateCharacterTraits(project.fileSystem, characterId, traits)
    setCharacters(updated)
    setExpandedCharacterId(null)
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="constelacion-screen">
      <Link to="/editor" className="constelacion-screen__back">
        {t.common.backToScript}
      </Link>
      <h1>{t.constelacion.title}</h1>
      <p>{t.constelacion.subtitle}</p>

      <section>
        <h2>{t.constelacion.characters}</h2>
        {characters === null && <p className="constelacion-screen__loading">{t.constelacion.loading}</p>}
        {characters?.length === 0 && <p className="constelacion-screen__empty">{t.constelacion.noCharacters}</p>}
        {characters && characters.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>{t.constelacion.name}</th>
                <th>{t.constelacion.group}</th>
                <th>{t.constelacion.scenes}</th>
              </tr>
            </thead>
            <tbody>
              {sortBySceneCount(characters).map((character) => (
                <Fragment key={character.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className="constelacion-screen__name-button"
                        onClick={() =>
                          setExpandedCharacterId(expandedCharacterId === character.id ? null : character.id)
                        }
                      >
                        {character.name}
                      </button>
                    </td>
                    <td>{character.group}</td>
                    <td>{character.sceneIds.length}</td>
                  </tr>
                  {expandedCharacterId === character.id && (
                    <tr>
                      <td colSpan={3}>
                        <CharacterTraitsEditor
                          character={character}
                          onSave={(traits) => handleSaveTraits(character.id, traits)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>{t.constelacion.locations}</h2>
        {locations === null && <p className="constelacion-screen__loading">{t.constelacion.loading}</p>}
        {locations?.length === 0 && <p className="constelacion-screen__empty">{t.constelacion.noLocations}</p>}
        {locations && locations.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>{t.constelacion.location}</th>
                <th>{t.constelacion.scenes}</th>
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
