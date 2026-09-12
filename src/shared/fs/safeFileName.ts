import { UnsafeFileNameError } from './errors'

/**
 * Guards a bare file name segment (never a full path) before it is joined
 * onto a real filesystem path. `TauriProjectFileSystem` runs with an
 * fs:scope of `**` (see src-tauri/capabilities/default.json), so it has no
 * OS-level sandbox of its own — unlike the File System Access API, which
 * rejects a "/" in `getFileHandle()` itself. A version's `fileName` is read
 * back from `versions/index.json`, a file that lives inside the project
 * folder and can be corrupted or hand-edited (a synced/shared project, a
 * merge conflict resolved badly, a crafted `.trace`-style import). Without
 * this check, an entry like `"../../../../etc/passwd"` would make
 * `readVersionFountain`/`writeVersionFountain` read or write outside the
 * project directory.
 */
export function assertSafeFileName(name: string): void {
  if (name === '' || name === '.' || name === '..' || /[/\\]|\0/.test(name)) {
    throw new UnsafeFileNameError(name)
  }
}
