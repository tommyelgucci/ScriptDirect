import { describe, expect, it } from 'vitest'
import { InvalidAnalysisResponseError, parseAnalysisResponse } from './parseAnalysisResponse'

const VALID_SECTIONS = {
  strengths: ['Strong midpoint reversal.'],
  mainIssues: ['Act two sags in the middle third.'],
  missingOrExcess: ['No clear antagonist goal stated.'],
  rewritePlan: ['Cut scene 14; it repeats scene 9.'],
}

describe('parseAnalysisResponse', () => {
  it('parses a plain JSON response', () => {
    expect(parseAnalysisResponse(JSON.stringify(VALID_SECTIONS))).toEqual(VALID_SECTIONS)
  })

  it('parses JSON wrapped in a markdown code fence', () => {
    const text = `Here is the analysis:\n\`\`\`json\n${JSON.stringify(VALID_SECTIONS)}\n\`\`\``
    expect(parseAnalysisResponse(text)).toEqual(VALID_SECTIONS)
  })

  it('parses JSON embedded in surrounding prose', () => {
    const text = `Sure, here you go: ${JSON.stringify(VALID_SECTIONS)} Hope that helps!`
    expect(parseAnalysisResponse(text)).toEqual(VALID_SECTIONS)
  })

  it('defaults a missing section to an empty array', () => {
    const { rewritePlan: _omit, ...partial } = VALID_SECTIONS
    const result = parseAnalysisResponse(JSON.stringify(partial))
    expect(result.rewritePlan).toEqual([])
  })

  it('throws InvalidAnalysisResponseError for unparseable text', () => {
    expect(() => parseAnalysisResponse('not json at all')).toThrow(InvalidAnalysisResponseError)
  })

  it('throws InvalidAnalysisResponseError when a field has the wrong type', () => {
    expect(() => parseAnalysisResponse(JSON.stringify({ strengths: 'not an array' }))).toThrow(
      InvalidAnalysisResponseError,
    )
  })
})
