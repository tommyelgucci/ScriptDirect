import { buildAnalysisPrompt } from '../analysisPrompt'
import { parseAnalysisResponse } from '../parseAnalysisResponse'
import { parseSceneMetricsResponse } from '../parseSceneMetricsResponse'
import { buildSceneMetricsPrompt } from '../sceneMetricsPrompt'
import type { AIProvider, AnalysisSections, AnalyzeScriptInput, RawSceneMetric } from '../types'

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Anthropic blocks direct-from-browser requests unless this is set explicitly —
      // the whole point of BYOK is that the key never leaves the user's browser.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic request failed (${response.status})`)
  }

  const data = (await response.json()) as { content?: { text?: string }[] }
  return data.content?.[0]?.text ?? ''
}

export const anthropicProvider: AIProvider = {
  async analyzeScript({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<AnalysisSections> {
    const text = await callAnthropic(apiKey, model, buildAnalysisPrompt(scriptText))
    return parseAnalysisResponse(text)
  },

  async analyzeSceneMetrics({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<RawSceneMetric[]> {
    const text = await callAnthropic(apiKey, model, buildSceneMetricsPrompt(scriptText))
    return parseSceneMetricsResponse(text)
  },
}
