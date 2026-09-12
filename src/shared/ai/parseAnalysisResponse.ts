import { z } from 'zod'
import { extractJson } from './extractJson'
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
