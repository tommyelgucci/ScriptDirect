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
```

`locations.json` isn't in ARCHITECTURE.md's original example tree, but follows
exactly the same pattern as `characters.json` — ARCHITECTURE.md's data model
lists Location as "same pattern as Character".

- `pickProjectFolder()` — opens the browser folder picker and returns a
  `ProjectFileSystem` for the chosen folder.
- `ChromiumProjectFileSystem` — the only implementation today, built on the
  File System Access API (Chrome/Edge only).
- `isFileSystemAccessSupported()` — feature-detects the API so callers can
  show a clear message instead of a crash on unsupported browsers.

## TODO: Safari/Firefox fallback

Neither browser implements the File System Access API. `pickProjectFolder()`
throws `FileSystemAccessUnsupportedError` there today rather than silently
failing. Per `ARCHITECTURE.md`, the planned fix is a ZIP import/export
fallback (download a `.zip` of the project folder, re-upload to continue
editing) — not implemented yet. This is also the main argument in
`ARCHITECTURE.md` for prioritizing the Tauri desktop build in Phase 2+,
which sidesteps the browser limitation entirely via the Tauri fs API.
