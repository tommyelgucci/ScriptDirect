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
 * in browsers without that API (Safari, Firefox) — callers should check
 * `needsZipFallback()` first and offer `ZipProjectFileSystem` /
 * `pickProjectZipFile()` there instead, as `HomeScreen` does; this error
 * exists as a defensive fallback, not the primary path for those browsers.
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
