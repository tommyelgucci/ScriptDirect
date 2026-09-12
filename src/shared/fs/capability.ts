import { isTauri } from '@tauri-apps/api/core'

/** True in Chromium-based browsers (Chrome, Edge); false in Safari and Firefox today. */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

/**
 * True when running inside the Tauri desktop shell (see ARCHITECTURE.md's
 * Platform Strategy). Checked before `isFileSystemAccessSupported()`, since
 * the desktop build works on every OS regardless of which browser engine
 * would otherwise apply.
 */
export function isTauriRuntime(): boolean {
  return isTauri()
}
