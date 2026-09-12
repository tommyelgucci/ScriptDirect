# brujula

Brújula — AI narrative analysis report (Script Doctor equivalent).

- `BrujulaScreen.tsx` — "Analizar" sends the full current script to the
  provider configured in Settings, and renders the four fixed sections
  (Strengths, Main Issues, Missing/Excess, Rewrite Plan). Each finding can
  be marked Accepted or Dismissed; nothing is silently applied to the
  script itself — this only records the writer's review decision.
- `analysisReport.ts` — pure functions turning raw provider output into an
  `AnalysisReport` (fresh ids, `unreviewed` by default) and updating one
  finding's review state.

The report persists to the episode's sidecar `*.meta.json`
(`entities/episode-meta.ts`), re-running "Analizar" replaces it with a
fresh one — no history of past analyses yet (not in MVP scope per
`ROADMAP.md`).

See `src/shared/ai/README.md` for the provider adapters themselves.
