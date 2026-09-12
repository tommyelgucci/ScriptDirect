import { buildAnalysisPrompt } from '../analysisPrompt'
import { parseAnalysisResponse } from '../parseAnalysisResponse'
import type { AIProvider, AnalysisSections, AnalyzeScriptInput } from '../types'

export const anthropicProvider: AIProvider = {
  async analyzeScript({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<AnalysisSections> {
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
        messages: [{ role: 'user', content: buildAnalysisPrompt(scriptText) }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic request failed (${response.status})`)
    }

    const data = (await response.json()) as { content?: { text?: string }[] }
    return parseAnalysisResponse(data.content?.[0]?.text ?? '')
  },
}
