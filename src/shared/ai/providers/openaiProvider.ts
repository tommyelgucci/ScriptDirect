import { buildAnalysisPrompt } from '../analysisPrompt'
import { parseAnalysisResponse } from '../parseAnalysisResponse'
import type { AIProvider, AnalysisSections, AnalyzeScriptInput } from '../types'

export const openaiProvider: AIProvider = {
  async analyzeScript({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<AnalysisSections> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildAnalysisPrompt(scriptText) }],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`)
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    return parseAnalysisResponse(data.choices?.[0]?.message?.content ?? '')
  },
}
