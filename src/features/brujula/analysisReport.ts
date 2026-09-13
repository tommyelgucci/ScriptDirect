import { analysisReportSchema, type AnalysisReport, type FindingReviewState } from '../../entities/analysis-report'
import { createId } from '../../entities/id'
import type { AnalysisSections } from '../../shared/ai/types'

export type FindingSection = 'strengths' | 'mainIssues' | 'missingOrExcess' | 'rewritePlan'

/** Display order for the report's sections — labels live in shared/i18n so they follow the UI language toggle. */
export const FINDING_SECTIONS: FindingSection[] = ['strengths', 'mainIssues', 'missingOrExcess', 'rewritePlan']

export function buildAnalysisReport(sections: AnalysisSections): AnalysisReport {
  return analysisReportSchema.parse({
    id: createId('rpt'),
    createdAt: new Date().toISOString(),
    strengths: sections.strengths.map(toFinding),
    mainIssues: sections.mainIssues.map(toFinding),
    missingOrExcess: sections.missingOrExcess.map(toFinding),
    rewritePlan: sections.rewritePlan.map(toFinding),
  })
}

function toFinding(text: string) {
  return { id: createId('fnd'), text, reviewState: 'unreviewed' as const }
}

export function setFindingReviewState(
  report: AnalysisReport,
  section: FindingSection,
  findingId: string,
  reviewState: FindingReviewState,
): AnalysisReport {
  return {
    ...report,
    [section]: report[section].map((finding) => (finding.id === findingId ? { ...finding, reviewState } : finding)),
  }
}
