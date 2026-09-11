import { buildAnalysisPrompt } from '../analysisPrompt'
import { parseAnalysisResponse } from '../parseAnalysisResponse'
import type { AIProvider, AnalysisSections, AnalyzeScriptInput } from '../types'

export const geminiProvider: AIProvider = {
  async analyzeScript({ apiKey, model, scriptText }: AnalyzeScriptInput): Promise<AnalysisSections> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildAnalysisPrompt(scriptText) }] }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`)
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    return parseAnalysisResponse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
  },
}
