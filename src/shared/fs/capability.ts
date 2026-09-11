/** True in Chromium-based browsers (Chrome, Edge); false in Safari and Firefox today. */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}
