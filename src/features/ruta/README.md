# ruta

Ruta — act/beat structure timeline, layered on top of the script's own
scene order (no AI involved; this is the writer's own structural annotation).

- `RutaScreen.tsx` — lists every scene, in script order, with an Act (1/2/3)
  selector and a freeform beat label input (e.g. "Inciting Incident",
  "Midpoint", "Climax"). Act changes persist immediately; a label persists
  on blur, to avoid writing on every keystroke.
- `buildRutaRows.ts` — pure functions merging the script's parsed scenes
  with any previously saved `Beat[]` (`entities/beat.ts`), defaulting an
  unassigned scene to Act 1 with no label, and converting rows back to the
  persisted shape. Scenes with no id yet (never saved through Bitácora) are
  dropped — there's no stable key to persist a beat against yet.

Beats persist to the episode's sidecar `*.meta.json`
(`entities/episode-meta.ts`), via `shared/fs/episodeMeta.ts`'s
`updateEpisodeMeta` so Brújula's `analysisReport` in the same file is never
clobbered.
