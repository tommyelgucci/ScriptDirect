import { afterEach, describe, expect, it, vi } from 'vitest'
import { FileSystemAccessUnsupportedError, ProjectFolderSelectionCancelledError } from '../errors'
import { pickProjectFolder } from '../pickProjectFolder'

const { open } = vi.hoisted(() => ({ open: vi.fn() }))

vi.mock('@tauri-apps/plugin-dialog', () => ({ open }))

describe('pickProjectFolder', () => {
  afterEach(() => {
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker
    delete (globalThis as { isTauri?: unknown }).isTauri
    open.mockReset()
  })

  it('throws FileSystemAccessUnsupportedError when the browser lacks the API', async () => {
    await expect(pickProjectFolder()).rejects.toBeInstanceOf(FileSystemAccessUnsupportedError)
  })

  it('uses the Tauri dialog and returns a TauriProjectFileSystem when running in the desktop shell', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    open.mockResolvedValue('/home/writer/my-project')

    const fileSystem = await pickProjectFolder()

    expect(open).toHaveBeenCalledWith({ directory: true })
    expect(fileSystem.projectName).toBe('my-project')
  })

  it('throws ProjectFolderSelectionCancelledError when the Tauri dialog is dismissed', async () => {
    ;(globalThis as { isTauri?: unknown }).isTauri = true
    open.mockResolvedValue(null)

    await expect(pickProjectFolder()).rejects.toBeInstanceOf(ProjectFolderSelectionCancelledError)
  })
})
