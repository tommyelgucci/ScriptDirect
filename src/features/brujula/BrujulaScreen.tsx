import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { AnalysisReport, FindingReviewState } from '../../entities/analysis-report'
import { projectSchema } from '../../entities/project'
import { readApiKey } from '../../shared/ai/apiKeyStorage'
import { createAIProvider } from '../../shared/ai/createAIProvider'
import { readEpisodeMeta, updateEpisodeMeta } from '../../shared/fs/episodeMeta'
import { useAppStore } from '../../shared/store/useAppStore'
import { buildAnalysisReport, FINDING_SECTIONS, setFindingReviewState, type FindingSection } from './analysisReport'
import './BrujulaScreen.css'

export function BrujulaScreen() {
  const project = useAppStore((state) => state.project)

  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!project) {
      return
    }
    let cancelled = false
    readEpisodeMeta(project.fileSystem, project.episodeFileName).then((meta) => {
      if (cancelled) {
        return
      }
      setReport(meta.analysisReport)
    })
    return () => {
      cancelled = true
    }
  }, [project])

  const persistReport = useCallback(
    async (nextReport: AnalysisReport) => {
      if (!project) {
        return
      }
      await updateEpisodeMeta(project.fileSystem, project.episodeFileName, { analysisReport: nextReport })
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
      const parsedProject = projectJson ? projectSchema.safeParse(JSON.parse(projectJson)) : null
      const aiProvider = parsedProject?.success ? parsedProject.data.aiProvider : undefined
      if (!aiProvider) {
        setErrorMessage('Configura un proveedor de IA en Configuración antes de analizar.')
        return
      }

      const apiKey = readApiKey(aiProvider.provider)
      if (!apiKey) {
        setErrorMessage('Falta la clave de API para este proveedor. Ve a Configuración.')
        return
      }

      const scriptText = await project.fileSystem.readEpisodeFountain(project.episodeFileName)
      const provider = createAIProvider(aiProvider.provider)
      const sections = await provider.analyzeScript({
        apiKey,
        model: aiProvider.model ?? '',
        scriptText,
      })

      const nextReport = buildAnalysisReport(sections)
      setReport(nextReport)
      await persistReport(nextReport)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo completar el análisis.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleSetReviewState(section: FindingSection, findingId: string, reviewState: FindingReviewState) {
    if (!report) {
      return
    }
    const updated = setFindingReviewState(report, section, findingId, reviewState)
    setReport(updated)
    await persistReport(updated)
  }

  if (!project) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="brujula-screen">
      <Link to="/editor" className="brujula-screen__back">
        ← Volver al guion
      </Link>
      <h1>Brújula</h1>
      <p>Análisis narrativo del guion completo, generado por el proveedor de IA configurado en Ajustes.</p>

      <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analizando…' : report ? 'Volver a analizar' : 'Analizar'}
      </button>

      {errorMessage && (
        <p role="alert" className="brujula-screen__error">
          {errorMessage}
        </p>
      )}

      {!report && !isAnalyzing && !errorMessage && (
        <p className="brujula-screen__empty">Todavía no se ha analizado este guion.</p>
      )}

      {report && (
        <div className="brujula-screen__report">
          {FINDING_SECTIONS.map(({ key, label }) => (
            <section key={key}>
              <h2>{label}</h2>
              {report[key].length === 0 && <p className="brujula-screen__empty">Sin hallazgos.</p>}
              <ul>
                {report[key].map((finding) => (
                  <li key={finding.id} className={`finding finding--${finding.reviewState}`}>
                    <span>{finding.text}</span>
                    <span className="finding__actions">
                      <button
                        type="button"
                        aria-pressed={finding.reviewState === 'accepted'}
                        onClick={() => handleSetReviewState(key, finding.id, 'accepted')}
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        aria-pressed={finding.reviewState === 'dismissed'}
                        onClick={() => handleSetReviewState(key, finding.id, 'dismissed')}
                      >
                        Descartar
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
