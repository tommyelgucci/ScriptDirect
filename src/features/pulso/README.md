# pulso

Pulso — per-scene dramatic metrics: emotional intensity, dramatic tension,
attention capture, commercial potential, and a dominant emotion label.

- `PulsoScreen.tsx` — "Analizar" sends the full current script to the
  provider configured in Settings, and renders a Recharts line chart with
  one line per metric across the script's scenes (in order).
- `buildSceneMetrics.ts` — turns the provider's raw scoring array into
  validated `SceneMetric` entities, dropping any entry whose `sceneId`
  doesn't match a real scene in the script (see `shared/ai/README.md` for
  why the model can invent one) or that fails schema validation, and any
  duplicate for a scene id already used.

Scene metrics persist to the episode's sidecar `*.meta.json`
(`entities/episode-meta.ts`), via `shared/fs/episodeMeta.ts`'s
`updateEpisodeMeta` so Brújula's `analysisReport` in the same file is never
clobbered. Re-running "Analizar" replaces the metrics with a fresh set — no
history of past runs yet, matching Brújula's current scope.

- The table below the chart gives each scene "Editar"/"Descartar" controls —
  the AI can misjudge a scene, and hand-correcting or dropping just that one
  (`SceneMetricEditor.tsx`) is a lot cheaper than paying for and waiting on a
  full re-analysis. Mirrors Brújula's per-finding accept/dismiss controls,
  adapted to Pulso's numeric scores (0-100 sliders instead of accept/reject
  on free text). Both actions persist immediately through the same
  `updateEpisodeMeta` path as a fresh analysis.

See `src/shared/ai/README.md` for the provider adapters themselves.
