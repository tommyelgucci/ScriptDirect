export function buildAnalysisPrompt(scriptText: string): string {
  return `You are a professional script analyst reviewing a screenplay written in Fountain format.

Respond with ONLY a single JSON object — no markdown code fences, no commentary before or after — matching exactly this shape:
{"strengths": string[], "mainIssues": string[], "missingOrExcess": string[], "rewritePlan": string[]}

Each array holds short, specific findings (one sentence each) that a working screenwriter would recognize as useful and concrete, not generic filler. Use an empty array for a section with nothing to report.

SCREENPLAY:
"""
${scriptText}
"""`
}
