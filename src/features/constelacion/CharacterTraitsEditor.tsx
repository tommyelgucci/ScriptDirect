import { useState } from 'react'
import type { Character, CharacterTraits } from '../../entities/character'

interface TraitField {
  key: keyof CharacterTraits
  label: string
}

const TRAIT_FIELDS: TraitField[] = [
  { key: 'empathy', label: 'Empatía' },
  { key: 'moralAmbiguity', label: 'Ambigüedad moral' },
  { key: 'volatility', label: 'Volatilidad' },
]

const DEFAULT_TRAIT_VALUE = 50

interface CharacterTraitsEditorProps {
  character: Character
  onSave: (traits: CharacterTraits) => void
}

export function CharacterTraitsEditor({ character, onSave }: CharacterTraitsEditorProps) {
  const [draft, setDraft] = useState<CharacterTraits>(character.traits ?? {})

  function handleChange(key: keyof CharacterTraits, value: number) {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  return (
    <div className="character-traits-editor">
      {TRAIT_FIELDS.map(({ key, label }) => (
        <label key={key}>
          <span>
            {label}: {draft[key] ?? DEFAULT_TRAIT_VALUE}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={draft[key] ?? DEFAULT_TRAIT_VALUE}
            onChange={(event) => handleChange(key, Number(event.target.value))}
            aria-label={label}
          />
        </label>
      ))}
      <button type="button" onClick={() => onSave(draft)}>
        Guardar
      </button>
    </div>
  )
}
