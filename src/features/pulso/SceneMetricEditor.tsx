import { useState } from 'react'
import type { SceneMetric } from '../../entities/scene-metric'
import { useTranslation } from '../../shared/i18n/useTranslation'
import './SceneMetricEditor.css'

const SCORE_KEYS = ['emotionalIntensity', 'dramaticTension', 'attentionCapture', 'commercialPotential'] as const

interface SceneMetricEditorProps {
  metric: SceneMetric
  onSave: (metric: SceneMetric) => void
}

/** A human correction to one scene's AI-generated scores, mirroring Constelación's CharacterTraitsEditor. */
export function SceneMetricEditor({ metric, onSave }: SceneMetricEditorProps) {
  const t = useTranslation()
  const [draft, setDraft] = useState<SceneMetric>(metric)

  function handleScoreChange(key: (typeof SCORE_KEYS)[number], value: number) {
    setDraft((previous) => ({ ...previous, [key]: value }))
  }

  return (
    <div className="scene-metric-editor">
      {SCORE_KEYS.map((key) => {
        const label = t.pulso[key]
        return (
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
        )
      })}
      <label>
        <span>{t.sceneMetricEditor.dominantEmotion}</span>
        <input
          type="text"
          value={draft.dominantEmotion}
          onChange={(event) => setDraft((previous) => ({ ...previous, dominantEmotion: event.target.value }))}
          aria-label={t.sceneMetricEditor.dominantEmotion}
        />
      </label>
      <button type="button" onClick={() => onSave(draft)} disabled={draft.dominantEmotion.trim() === ''}>
        {t.sceneMetricEditor.save}
      </button>
    </div>
  )
}
