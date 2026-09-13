import { useState } from 'react'
import type { SceneMetric } from '../../entities/scene-metric'
import './SceneMetricEditor.css'

interface ScoreField {
  key: 'emotionalIntensity' | 'dramaticTension' | 'attentionCapture' | 'commercialPotential'
  label: string
}

const SCORE_FIELDS: ScoreField[] = [
  { key: 'emotionalIntensity', label: 'Intensidad emocional' },
  { key: 'dramaticTension', label: 'Tensión dramática' },
  { key: 'attentionCapture', label: 'Captación de atención' },
  { key: 'commercialPotential', label: 'Potencial comercial' },
]

interface SceneMetricEditorProps {
  metric: SceneMetric
  onSave: (metric: SceneMetric) => void
}

/** A human correction to one scene's AI-generated scores, mirroring Constelación's CharacterTraitsEditor. */
export function SceneMetricEditor({ metric, onSave }: SceneMetricEditorProps) {
  const [draft, setDraft] = useState<SceneMetric>(metric)

  function handleScoreChange(key: ScoreField['key'], value: number) {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  return (
    <div className="scene-metric-editor">
      {SCORE_FIELDS.map(({ key, label }) => (
        <label key={key}>
          <span>
            {label}: {draft[key]}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={draft[key]}
            onChange={(event) => handleScoreChange(key, Number(event.target.value))}
            aria-label={label}
          />
        </label>
      ))}
      <label>
        <span>Emoción dominante</span>
        <input
          type="text"
          value={draft.dominantEmotion}
          onChange={(event) => setDraft((previous) => ({ ...previous, dominantEmotion: event.target.value }))}
          aria-label="Emoción dominante"
        />
      </label>
      <button type="button" onClick={() => onSave(draft)} disabled={draft.dominantEmotion.trim() === ''}>
        Guardar
      </button>
    </div>
  )
}
