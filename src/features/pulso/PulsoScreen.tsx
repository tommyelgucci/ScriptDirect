import { Fragment, useCallback, useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, Navigate } from 'react-router-dom'
import type { SceneMetric } from '../../entities/scene-metric'
import { projectSchema } from '../../entities/project'
import { readApiKey } from '../../shared/ai/apiKeyStorage'
import { createAIProvider } from '../../shared/ai/createAIProvider'
import { readEpisodeMeta, updateEpisodeMeta } from '../../shared/fs/episodeMeta'
import { parseFountainDocument } from '../../shared/fountain'
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

function toChartData(metrics: SceneMetric[], headingsBySceneId: Map<string, string>): ChartPoint[] {
  return metrics.map((metric, index) => ({
    sceneId: metric.sceneId,
    label: headingsBySceneId.get(metric.sceneId) ?? `Escena ${index + 1}`,
    emotionalIntensity: metric.emotionalIntensity,
    dramaticTension: metric.dramaticTension,
    attentionCapture: metric.attentionCapture,
    commercialPotential: metric.commercialPotential,
    dominantEmotion: metric.dominantEmotion,
  }))
}

export function PulsoScreen() {
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
        setErrorMessage('Configura un proveedor de IA en Configuración antes de analizar.')
        return
      }

      const apiKey = await readApiKey(aiProvider.provider)
      if (!apiKey) {
        setErrorMessage('Falta la clave de API para este proveedor. Ve a Configuración.')
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
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo completar el análisis.')
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
    const confirmed = window.confirm('¿Descartar el análisis de esta escena? Se puede volver a analizar el guion completo cuando quieras.')
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

  const chartData = toChartData(metrics, headingsBySceneId)

  return (
    <main className="pulso-screen">
      <Link to="/editor" className="pulso-screen__back">
        ← Volver al guion
      </Link>
      <h1>Pulso</h1>
      <p>Intensidad emocional y tensión dramática por escena, generado por el proveedor de IA configurado en Ajustes.</p>

      <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analizando…' : metrics.length > 0 ? 'Volver a analizar' : 'Analizar'}
      </button>

      {errorMessage && (
        <p role="alert" className="pulso-screen__error">
          {errorMessage}
        </p>
      )}

      {metrics.length === 0 && !isAnalyzing && !errorMessage && (
        <p className="pulso-screen__empty">Todavía no se ha analizado este guion.</p>
      )}

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
              <Line type="monotone" dataKey="emotionalIntensity" name="Intensidad emocional" stroke="#e74c3c" />
              <Line type="monotone" dataKey="dramaticTension" name="Tensión dramática" stroke="#8e44ad" />
              <Line type="monotone" dataKey="attentionCapture" name="Captación de atención" stroke="#2980b9" />
              <Line type="monotone" dataKey="commercialPotential" name="Potencial comercial" stroke="#27ae60" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {metrics.length > 0 && (
        <table className="pulso-screen__table">
          <thead>
            <tr>
              <th>Escena</th>
              <th>Intensidad emocional</th>
              <th>Tensión dramática</th>
              <th>Captación de atención</th>
              <th>Potencial comercial</th>
              <th>Emoción dominante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <Fragment key={metric.sceneId}>
                <tr>
                  <td>{headingsBySceneId.get(metric.sceneId) ?? `Escena ${index + 1}`}</td>
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
                      {editingSceneId === metric.sceneId ? 'Cerrar' : 'Editar'}
                    </button>
                    <button type="button" onClick={() => handleDismissMetric(metric.sceneId)}>
                      Descartar
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
