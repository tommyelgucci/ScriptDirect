import { buildAnalysisPrompt } from '../analysisPrompt'
import { parseAnalysisResponse } from '../parseAnalysisResponse'
import { parseSceneMetricsResponse } from '../parseSceneMetricsResponse'
import { buildSceneMetricsPrompt } from '../sceneMetricsPrompt'
import type { AIProvider, AnalysisSections, AnalyzeScriptInput, RawSceneMetric } from '../types'

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export const geminiProvider: AIProvider = {
  async analyzeScript({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<AnalysisSections> {
    const text = await callGemini(apiKey, model, buildAnalysisPrompt(scriptText))
    return parseAnalysisResponse(text)
  },

  async analyzeSceneMetrics({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<RawSceneMetric[]> {
    const text = await callGemini(apiKey, model, buildSceneMetricsPrompt(scriptText))
    return parseSceneMetricsResponse(text)
  },
}
