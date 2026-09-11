import { afterEach, describe, expect, it } from 'vitest'
import { FileSystemAccessUnsupportedError } from '../errors'
import { pickProjectFolder } from '../pickProjectFolder'

describe('pickProjectFolder', () => {
  afterEach(() => {
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker
  })

  it('throws FileSystemAccessUnsupportedError when the browser lacks the API', async () => {
    await expect(pickProjectFolder()).rejects.toBeInstanceOf(FileSystemAccessUnsupportedError)
  })
})
