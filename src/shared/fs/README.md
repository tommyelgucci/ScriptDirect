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
- `ChromiumProjectFileSystem` — built on the File System Access API
  (Chrome/Edge only); the writer's edits live on real disk the whole time.
- `TauriProjectFileSystem` — the desktop shell's fs plugin; also real disk,
  any OS.
- `ZipProjectFileSystem` — the Safari/Firefox fallback (see below); the
  whole project lives in memory instead, so it needs an explicit
  export/import step where the other two don't.
- `isFileSystemAccessSupported()` / `isTauriRuntime()` / `needsZipFallback()`
  — feature detection so callers (see `HomeScreen`) pick the right one of
  the three above instead of crashing on an unsupported browser.
- `pickProjectZipFile()` — opens a native file picker filtered to `.zip`,
  for importing a project saved by `ZipProjectFileSystem.exportZip()`.
- `episodeMeta.ts` — `readEpisodeMeta`/`updateEpisodeMeta`, a read-merge-write
  helper around `ProjectFileSystem.readEpisodeMeta`/`writeEpisodeMeta`.
  Brújula's `analysisReport`, Pulso's `sceneMetrics`, and Ruta's `beats`
  share one sidecar file (`entities/episode-meta.ts`); writing a fresh
  object with only one of those fields would let Zod's schema defaults
  silently reset the others, so every feature that persists episode meta
  should go through `updateEpisodeMeta` rather than calling
  `writeEpisodeMeta` directly.

## Safari/Firefox: the ZIP fallback is degraded, not equivalent

Neither browser implements the File System Access API, so there is no live
folder to read from or autosave to. `ZipProjectFileSystem` holds the whole
project as an in-memory path → text map instead: `importZip()` unzips a
previously exported project back into that map, and `exportZip()` (wired to
the "Exportar .zip (guardar)" button in `EditorScreen`, Safari/Firefox only)
is the writer's *only* way to persist — closing the tab without exporting
loses everything since the last export, unlike the other two
implementations. `HomeScreen` shows an explicit warning about this and
suggests the Tauri desktop build for real autosave-to-disk, which is the
main argument in `ARCHITECTURE.md` for prioritizing Tauri in Phase 2+.
