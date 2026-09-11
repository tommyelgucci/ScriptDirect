import { isFileSystemAccessSupported } from './capability'
import { ChromiumProjectFileSystem } from './chromiumProjectFileSystem'
import { FileSystemAccessUnsupportedError } from './errors'
import type { ProjectFileSystem } from './types'

/**
 * Opens the browser's native folder picker and returns a `ProjectFileSystem`
 * for the chosen folder. Throws `FileSystemAccessUnsupportedError` in
 * browsers without the File System Access API (Safari, Firefox).
 *
 * TODO(Phase 2+): add a ZIP import/export fallback for those browsers, per
 * ARCHITECTURE.md's "Known limitation" note — not implemented yet. Until
 * then, `src/features/settings` should surface this error as a clear
 * "not yet supported in this browser" message rather than a crash.
 */
export async function pickProjectFolder(): Promise<ProjectFileSystem> {
  if (!isFileSystemAccessSupported() || !window.showDirectoryPicker) {
    throw new FileSystemAccessUnsupportedError()
  }
  const root = await window.showDirectoryPicker({ mode: 'readwrite' })
  return new ChromiumProjectFileSystem(root)
}
