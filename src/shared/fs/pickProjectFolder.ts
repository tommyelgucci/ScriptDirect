import { isFileSystemAccessSupported, isTauriRuntime } from './capability'
import { ChromiumProjectFileSystem } from './chromiumProjectFileSystem'
import { FileSystemAccessUnsupportedError, ProjectFolderSelectionCancelledError } from './errors'
import { TauriProjectFileSystem } from './tauriProjectFileSystem'
import type { ProjectFileSystem } from './types'

async function pickTauriProjectFolder(): Promise<ProjectFileSystem> {
  // Imported lazily so the plugin (and its Rust IPC bridge) is only touched
  // when actually running inside the Tauri shell, never in the plain web build.
  const { open } = await import('@tauri-apps/plugin-dialog')
  const rootPath = await open({ directory: true })
  if (!rootPath) {
    throw new ProjectFolderSelectionCancelledError()
  }
  return new TauriProjectFileSystem(rootPath)
}

/**
 * Opens the platform's native folder picker and returns a `ProjectFileSystem`
 * for the chosen folder: the Tauri desktop shell's own picker when running
 * there (see ARCHITECTURE.md's Platform Strategy — this is what sidesteps
 * the File System Access API's Chromium-only limitation), otherwise the
 * browser's File System Access API. Throws `FileSystemAccessUnsupportedError`
 * in browsers without that API (Safari, Firefox).
 *
 * TODO(Phase 2+): add a ZIP import/export fallback for those browsers, per
 * ARCHITECTURE.md's "Known limitation" note — not implemented yet. Until
 * then, `src/features/settings` should surface this error as a clear
 * "not yet supported in this browser" message rather than a crash.
 */
export async function pickProjectFolder(): Promise<ProjectFileSystem> {
  if (isTauriRuntime()) {
    return pickTauriProjectFolder()
  }
  if (!isFileSystemAccessSupported() || !window.showDirectoryPicker) {
    throw new FileSystemAccessUnsupportedError()
  }
  const root = await window.showDirectoryPicker({ mode: 'readwrite' })
  return new ChromiumProjectFileSystem(root)
}
