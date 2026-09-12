/**
 * Opens the browser's native file picker filtered to `.zip`, for the
 * Safari/Firefox fallback (see `ZipProjectFileSystem`). Resolves to `null`
 * when the writer dismisses the picker without choosing a file — both
 * Chromium and current Firefox/Safari fire a `cancel` event on the input
 * for that case.
 */
export function pickProjectZipFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip,application/zip'
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => resolve(null), { once: true })
    input.click()
  })
}
