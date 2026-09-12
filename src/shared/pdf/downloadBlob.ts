export function downloadBlob(bytes: Uint8Array, fileName: string, mimeType: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType })
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}
