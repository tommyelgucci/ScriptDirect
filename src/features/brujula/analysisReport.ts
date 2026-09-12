import { analysisReportSchema, type AnalysisReport, type FindingReviewState } from '../../entities/analysis-report'
import { createId } from '../../entities/id'
import type { AnalysisSections } from '../../shared/ai/types'

export type FindingSection = 'strengths' | 'mainIssues' | 'missingOrExcess' | 'rewritePlan'

export const FINDING_SECTIONS: { key: FindingSection; label: string }[] = [
  { key: 'strengths', label: 'Fortalezas' },
  { key: 'mainIssues', label: 'Problemas principales' },
  { key: 'missingOrExcess', label: 'Qué falta o sobra' },
  { key: 'rewritePlan', label: 'Plan de reescritura' },
]

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
