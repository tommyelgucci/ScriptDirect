/**
 * The File System Access API's directory-picker entry point is still missing
 * from TypeScript's bundled DOM lib (the rest of the API — FileSystemHandle,
 * FileSystemDirectoryHandle, FileSystemFileHandle, FileSystemWritableFileStream
 * — is already typed there). This augments `Window` with just that entry
 * point. Chromium-only, per ARCHITECTURE.md's known limitation.
 */
interface DirectoryPickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
}

interface Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>
}
