import { afterEach, describe, expect, it } from 'vitest'
import { isFileSystemAccessSupported } from '../capability'

describe('isFileSystemAccessSupported', () => {
  afterEach(() => {
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker
  })

  it('is false in jsdom, which does not implement the File System Access API', () => {
    expect(isFileSystemAccessSupported()).toBe(false)
  })

  it('is true when showDirectoryPicker is present', () => {
    ;(window as { showDirectoryPicker?: unknown }).showDirectoryPicker = async () => {
      throw new Error('not implemented in this test')
    }
    expect(isFileSystemAccessSupported()).toBe(true)
  })
})
