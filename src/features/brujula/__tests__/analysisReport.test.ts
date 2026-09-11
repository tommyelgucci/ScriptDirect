import { describe, expect, it } from 'vitest'
import { buildAnalysisReport, setFindingReviewState } from '../analysisReport'

const SECTIONS = {
  strengths: ['Strong hook.'],
  mainIssues: ['Sagging second act.'],
  missingOrExcess: [],
  rewritePlan: [],
}

describe('buildAnalysisReport', () => {
  it('turns each section string into a Finding with a fresh id and unreviewed state', () => {
    const report = buildAnalysisReport(SECTIONS)

    expect(report.strengths).toHaveLength(1)
    expect(report.strengths[0]).toMatchObject({ text: 'Strong hook.', reviewState: 'unreviewed' })
    expect(report.strengths[0].id).toMatch(/^fnd_/)
    expect(report.id).toMatch(/^rpt_/)
  })
})

describe('setFindingReviewState', () => {
  it('updates only the targeted finding, leaving the rest untouched', () => {
    const report = buildAnalysisReport(SECTIONS)
    const findingId = report.mainIssues[0].id

    const updated = setFindingReviewState(report, 'mainIssues', findingId, 'accepted')

    expect(updated.mainIssues[0].reviewState).toBe('accepted')
    expect(updated.strengths[0].reviewState).toBe('unreviewed')
    expect(updated).not.toBe(report)
  })
})
