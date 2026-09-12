export class FileSystemAccessUnsupportedError extends Error {
  constructor() {
    super(
      'Local folder access is not yet supported in this browser. ' +
        'ScriptDirect currently requires a Chromium-based browser (Chrome or Edge). ' +
        'A ZIP import/export fallback for Safari and Firefox is planned (see src/shared/fs/README.md).',
    )
    this.name = 'FileSystemAccessUnsupportedError'
  }
}

export class InvalidFountainFileNameError extends Error {
  constructor(fileName: string) {
    super(`Expected a *.fountain file name, got "${fileName}"`)
    this.name = 'InvalidFountainFileNameError'
  }
}

/** Thrown by `pickProjectFolder()` when the writer dismisses the Tauri folder dialog without choosing one. */
export class ProjectFolderSelectionCancelledError extends Error {
  constructor() {
    super('No folder was selected.')
    this.name = 'ProjectFolderSelectionCancelledError'
  }
}
