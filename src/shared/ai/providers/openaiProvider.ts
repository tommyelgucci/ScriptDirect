import { buildAnalysisPrompt } from '../analysisPrompt'
import { parseAnalysisResponse } from '../parseAnalysisResponse'
import { parseSceneMetricsResponse } from '../parseSceneMetricsResponse'
import { buildSceneMetricsPrompt } from '../sceneMetricsPrompt'
import type { AIProvider, AnalysisSections, AnalyzeScriptInput, RawSceneMetric } from '../types'

async function callOpenAi(apiKey: string, model: string, prompt: string, expectJsonObject: boolean): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      // OpenAI's JSON mode only accepts a JSON *object* response, so it's only used
      // for analyzeScript (which asks for one) — not for scene metrics (a JSON array).
      ...(expectJsonObject ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`)
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ''
}

export const openaiProvider: AIProvider = {
  async analyzeScript({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<AnalysisSections> {
    const text = await callOpenAi(apiKey, model, buildAnalysisPrompt(scriptText), true)
    return parseAnalysisResponse(text)
  },

  async analyzeSceneMetrics({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<RawSceneMetric[]> {
    const text = await callOpenAi(apiKey, model, buildSceneMetricsPrompt(scriptText), false)
    return parseSceneMetricsResponse(text)
  },
}
