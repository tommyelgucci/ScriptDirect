import { useState } from 'react'
import type { Character, CharacterTraits } from '../../entities/character'
import { useTranslation } from '../../shared/i18n/useTranslation'
import type { Translations } from '../../shared/i18n/es'

const TRAIT_KEYS: (keyof CharacterTraits)[] = ['empathy', 'moralAmbiguity', 'volatility']

const DEFAULT_TRAIT_VALUE = 50

interface CharacterTraitsEditorProps {
  character: Character
  onSave: (traits: CharacterTraits) => void
}

export function CharacterTraitsEditor({ character, onSave }: CharacterTraitsEditorProps) {
  const t = useTranslation()
  const [draft, setDraft] = useState<CharacterTraits>(character.traits ?? {})

  function handleChange(key: keyof CharacterTraits, value: number) {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  return (
    <div className="character-traits-editor">
      {TRAIT_KEYS.map((key) => {
        const label = t.characterTraitsEditor[key as keyof Translations['characterTraitsEditor']]
        return (
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
        )
      })}
      <button type="button" onClick={() => onSave(draft)}>
        {t.common.save}
      </button>
    </div>
  )
}
