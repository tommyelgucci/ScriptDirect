# shared/fs

Local project folder access, implementing the layout from `ARCHITECTURE.md`:

```
my-project/
  project.json
  characters.json
  locations.json
  episodes/
    s01e10.fountain
    s01e10.meta.json
  versions/
    s01e10/
      index.json
      2026-08-18T14-30-00-000Z.fountain
```

`locations.json` isn't in ARCHITECTURE.md's original example tree, but follows
exactly the same pattern as `characters.json` — ARCHITECTURE.md's data model
lists Location as "same pattern as Character".

`versions/<episode base name>/` matches ARCHITECTURE.md's own folder layout
example, with one refinement: ARCHITECTURE.md's example file name is a plain
date (`2026-08-18.fountain`), which collides if you save two snapshots the
same day. Snapshot file names here are a full colon-free ISO timestamp
instead (colons aren't valid in Windows file names). `index.json` (not in
ARCHITECTURE.md's example) tracks each snapshot's id/label/timestamp,
following the same "JSON sidecar next to plain-text content" pattern as
episode `.meta.json` files.

- `pickProjectFolder()` — opens the browser folder picker and returns a
  `ProjectFileSystem` for the chosen folder.
- `ChromiumProjectFileSystem` — the only implementation today, built on the
  File System Access API (Chrome/Edge only).
- `isFileSystemAccessSupported()` — feature-detects the API so callers can
  show a clear message instead of a crash on unsupported browsers.
- `episodeMeta.ts` — `readEpisodeMeta`/`updateEpisodeMeta`, a read-merge-write
  helper around `ProjectFileSystem.readEpisodeMeta`/`writeEpisodeMeta`.
  Brújula's `analysisReport` and Pulso's `sceneMetrics` share one sidecar
  file (`entities/episode-meta.ts`); writing a fresh object with only one of
  those fields would let Zod's schema defaults silently reset the other, so
  every feature that persists episode meta should go through
  `updateEpisodeMeta` rather than calling `writeEpisodeMeta` directly.

## TODO: Safari/Firefox fallback

Neither browser implements the File System Access API. `pickProjectFolder()`
throws `FileSystemAccessUnsupportedError` there today rather than silently
failing. Per `ARCHITECTURE.md`, the planned fix is a ZIP import/export
fallback (download a `.zip` of the project folder, re-upload to continue
editing) — not implemented yet. This is also the main argument in
`ARCHITECTURE.md` for prioritizing the Tauri desktop build in Phase 2+,
which sidesteps the browser limitation entirely via the Tauri fs API.
