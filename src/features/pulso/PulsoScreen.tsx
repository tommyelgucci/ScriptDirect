import { Fragment, useCallback, useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, Navigate } from 'react-router-dom'
import type { SceneMetric } from '../../entities/scene-metric'
import { projectSchema } from '../../entities/project'
import { readApiKey } from '../../shared/ai/apiKeyStorage'
import { createAIProvider } from '../../shared/ai/createAIProvider'
import { readEpisodeMeta, updateEpisodeMeta } from '../../shared/fs/episodeMeta'
import { parseFountainDocument } from '../../shared/fountain'
import { useTranslation } from '../../shared/i18n/useTranslation'
import { safeParseJson } from '../../shared/json/safeParseJson'
import { useAppStore } from '../../shared/store/useAppStore'
import { buildSceneMetrics } from './buildSceneMetrics'
import './PulsoScreen.css'
import { SceneMetricEditor } from './SceneMetricEditor'

interface ChartPoint {
  sceneId: string
  label: string
  emotionalIntensity: number
  dramaticTension: number
  attentionCapture: number
  commercialPotential: number
  dominantEmotion: string
}

function toChartData(
  metrics: SceneMetric[],
  headingsBySceneId: Map<string, string>,
  fallbackSceneLabel: (index: number) => string,
): ChartPoint[] {
  return metrics.map((metric, index) => ({
    sceneId: metric.sceneId,
    label: headingsBySceneId.get(metric.sceneId) ?? fallbackSceneLabel(index + 1),
    emotionalIntensity: metric.emotionalIntensity,
    dramaticTension: metric.dramaticTension,
    attentionCapture: metric.attentionCapture,
    commercialPotential: metric.commercialPotential,
    dominantEmotion: metric.dominantEmotion,
  }))
}

export function PulsoScreen() {
  const t = useTranslation()
  const project = useAppStore((state) => state.project)

  const [metrics, setMetrics] = useState<SceneMetric[]>([])
  const [headingsBySceneId, setHeadingsBySceneId] = useState<Map<string, string>>(new Map())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false
    readEpisodeMeta(project.fileSystem, project.episodeFileName).then((meta) => {
      if (cancelled) {
        return
      }
      setMetrics(meta.sceneMetrics)
    })
    return () => {
      cancelled = true
    }
  }, [project])

  const persistMetrics = useCallback(
    async (nextMetrics: SceneMetric[]) => {
      if (!project) {
        return
      }
      await updateEpisodeMeta(project.fileSystem, project.episodeFileName, { sceneMetrics: nextMetrics })
    },
    [project],
  )

  async function handleAnalyze() {
    if (!project) {
      return
    }
    setErrorMessage(null)
    setIsAnalyzing(true)
    try {
      const projectJson = await project.fileSystem.readProjectJson()
      const parsedProject = projectJson ? safeParseJson(projectSchema, projectJson) : null
      const aiProvider = parsedProject?.success ? parsedProject.data.aiProvider : undefined
      if (!aiProvider) {
        setErrorMessage(t.pulso.missingProvider)
        return
      }

      const apiKey = await readApiKey(aiProvider.provider)
      if (!apiKey) {
        setErrorMessage(t.pulso.missingApiKey)
        return
      }

      const scriptText = await project.fileSystem.readEpisodeFountain(project.episodeFileName)
      const scenes = parseFountainDocument(scriptText)
      const validSceneIds = new Set(scenes.flatMap((scene) => (scene.id ? [scene.id] : [])))
      const nextHeadings = new Map(scenes.flatMap((scene) => (scene.id ? [[scene.id, scene.heading] as const] : [])))
      setHeadingsBySceneId(nextHeadings)

      const provider = createAIProvider(aiProvider.provider)
      const rawMetrics = await provider.analyzeSceneMetrics({
        apiKey,
        model: aiProvider.model ?? '',
        scriptText,
      })

      const nextMetrics = buildSceneMetrics(rawMetrics, validSceneIds)
      setMetrics(nextMetrics)
      await persistMetrics(nextMetrics)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.pulso.analysisFailed)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // The AI can misjudge a scene — this lets the writer correct its scores by hand instead of
  // having to pay for and wait on a full re-analysis just to fix one value (mirrors Brújula's
  // per-finding review controls, adapted to Pulso's numeric scores).
  async function handleSaveMetric(updated: SceneMetric) {
    const nextMetrics = metrics.map((metric) => (metric.sceneId === updated.sceneId ? updated : metric))
    setMetrics(nextMetrics)
    setEditingSceneId(null)
    await persistMetrics(nextMetrics)
  }

  async function handleDismissMetric(sceneId: string) {
    const confirmed = window.confirm(t.pulso.dismissConfirm)
    if (!confirmed) {
      return
    }
    const nextMetrics = metrics.filter((metric) => metric.sceneId !== sceneId)
    setMetrics(nextMetrics)
    await persistMetrics(nextMetrics)
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  const chartData = toChartData(metrics, headingsBySceneId, t.pulso.fallbackSceneLabel)

  return (
    <main className="pulso-screen">
      <Link to="/editor" className="pulso-screen__back">
        {t.common.backToScript}
      </Link>
      <h1>{t.pulso.title}</h1>
      <p>{t.pulso.subtitle}</p>

      <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? t.pulso.analyzing : metrics.length > 0 ? t.pulso.reanalyze : t.pulso.analyze}
      </button>

      {errorMessage && (
        <p role="alert" className="pulso-screen__error">
          {errorMessage}
        </p>
      )}

      {metrics.length === 0 && !isAnalyzing && !errorMessage && <p className="pulso-screen__empty">{t.pulso.empty}</p>}

      {chartData.length > 0 && (
        <div className="pulso-screen__chart" data-testid="pulso-chart">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={false} />
              <YAxis domain={[0, 100]} />
              <Tooltip
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload as ChartPoint | undefined
                  return point ? `${label} · ${point.dominantEmotion}` : label
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="emotionalIntensity" name={t.pulso.emotionalIntensity} stroke="#e74c3c" />
              <Line type="monotone" dataKey="dramaticTension" name={t.pulso.dramaticTension} stroke="#8e44ad" />
              <Line type="monotone" dataKey="attentionCapture" name={t.pulso.attentionCapture} stroke="#2980b9" />
              <Line type="monotone" dataKey="commercialPotential" name={t.pulso.commercialPotential} stroke="#27ae60" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {metrics.length > 0 && (
        <table className="pulso-screen__table">
          <thead>
            <tr>
              <th>{t.pulso.sceneColumn}</th>
              <th>{t.pulso.emotionalIntensity}</th>
              <th>{t.pulso.dramaticTension}</th>
              <th>{t.pulso.attentionCapture}</th>
              <th>{t.pulso.commercialPotential}</th>
              <th>{t.pulso.dominantEmotion}</th>
              <th>{t.pulso.actions}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <Fragment key={metric.sceneId}>
                <tr>
                  <td>{headingsBySceneId.get(metric.sceneId) ?? t.pulso.fallbackSceneLabel(index + 1)}</td>
                  <td>{metric.emotionalIntensity}</td>
                  <td>{metric.dramaticTension}</td>
                  <td>{metric.attentionCapture}</td>
                  <td>{metric.commercialPotential}</td>
                  <td>{metric.dominantEmotion}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setEditingSceneId(editingSceneId === metric.sceneId ? null : metric.sceneId)}
                    >
                      {editingSceneId === metric.sceneId ? t.pulso.close : t.pulso.edit}
                    </button>
                    <button type="button" onClick={() => handleDismissMetric(metric.sceneId)}>
                      {t.pulso.dismiss}
                    </button>
                  </td>
                </tr>
                {editingSceneId === metric.sceneId && (
                  <tr>
                    <td colSpan={7}>
                      <SceneMetricEditor metric={metric} onSave={handleSaveMetric} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
