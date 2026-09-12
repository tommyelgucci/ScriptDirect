# shared/fs

Local project folder access, implementing the layout from `ARCHITECTURE.md`:

```
my-project/
  project.json
  characters.json
  episodes/
    s01e10.fountain
    s01e10.meta.json
```

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
