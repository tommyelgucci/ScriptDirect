export interface AnalyzeScriptInput {
  apiKey: string
  model: string
  scriptText: string
}

/** Raw sections returned by a provider, before they become AnalysisReport Findings. */
export interface AnalysisSections {
  strengths: string[]
  mainIssues: string[]
  missingOrExcess: string[]
  rewritePlan: string[]
}

/** Raw per-scene scores returned by a provider, before they become SceneMetric entities. */
export interface RawSceneMetric {
  sceneId: string
  emotionalIntensity: number
  dramaticTension: number
  attentionCapture: number
  commercialPotential: number
  dominantEmotion: string
}

/**
 * A single AI provider adapter, per ARCHITECTURE.md's AI Provider
 * Architecture. The API key is BYOK and is sent only in the request this
 * method makes directly to that provider — never to a ScriptDirect server.
 */
export interface AIProvider {
  analyzeScript(input: AnalyzeScriptInput): Promise<AnalysisSections>
  analyzeSceneMetrics(input: AnalyzeScriptInput): Promise<RawSceneMetric[]>
}
