import { z } from 'zod'
import type { AnalysisSections } from './types'

const analysisSectionsSchema = z.object({
  strengths: z.array(z.string()).default([]),
  mainIssues: z.array(z.string()).default([]),
  missingOrExcess: z.array(z.string()).default([]),
  rewritePlan: z.array(z.string()).default([]),
})

export class InvalidAnalysisResponseError extends Error {
  constructor() {
    super('The AI provider did not return a valid analysis. Try again.')
    this.name = 'InvalidAnalysisResponseError'
  }
}

/** Pulls the JSON object out of a fenced code block, or the outermost {...} span, or the raw text as-is. */
function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (fenced) {
    return fenced[1].trim()
  }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }
  return text.trim()
}

export function parseAnalysisResponse(rawText: string): AnalysisSections {
  let data: unknown
  try {
    data = JSON.parse(extractJson(rawText))
  } catch {
    throw new InvalidAnalysisResponseError()
  }

  const parsed = analysisSectionsSchema.safeParse(data)
  if (!parsed.success) {
    throw new InvalidAnalysisResponseError()
  }
  return parsed.data
}
