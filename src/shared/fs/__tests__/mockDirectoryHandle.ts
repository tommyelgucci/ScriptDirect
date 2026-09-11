/**
 * A minimal in-memory stand-in for FileSystemDirectoryHandle/FileSystemFileHandle,
 * covering only what ChromiumProjectFileSystem uses. jsdom does not implement
 * the File System Access API, so real handles aren't available in tests.
 */
class MockFileHandle implements Pick<FileSystemFileHandle, 'kind' | 'name' | 'getFile' | 'createWritable'> {
  readonly kind = 'file' as const
  readonly name: string
  content = ''

  constructor(name: string) {
    this.name = name
  }

  async getFile(): Promise<File> {
    return new File([this.content], this.name)
  }

  async createWritable(): Promise<FileSystemWritableFileStream> {
    return {
      write: async (data: FileSystemWriteChunkType) => {
        this.content = typeof data === 'string' ? data : String(data)
      },
      close: async () => {},
    } as unknown as FileSystemWritableFileStream
  }
}

export class MockDirectoryHandle
  implements Pick<FileSystemDirectoryHandle, 'kind' | 'name' | 'getFileHandle' | 'getDirectoryHandle' | 'entries'>
{
  readonly kind = 'directory' as const
  readonly name: string
  private readonly files = new Map<string, MockFileHandle>()
  private readonly directories = new Map<string, MockDirectoryHandle>()

  constructor(name: string) {
    this.name = name
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
    let handle = this.files.get(name)
    if (!handle) {
      if (!options?.create) {
        throw new DOMException(`${name} not found`, 'NotFoundError')
      }
      handle = new MockFileHandle(name)
      this.files.set(name, handle)
    }
    return handle as unknown as FileSystemFileHandle
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle> {
    let handle = this.directories.get(name)
    if (!handle) {
      if (!options?.create) {
        throw new DOMException(`${name} not found`, 'NotFoundError')
      }
      handle = new MockDirectoryHandle(name)
      this.directories.set(name, handle)
    }
    return handle as unknown as FileSystemDirectoryHandle
  }

  entries(): FileSystemDirectoryHandle['entries'] extends () => infer R ? R : never {
    const items: [string, FileSystemDirectoryHandle | FileSystemFileHandle][] = []
    for (const [name, handle] of this.files) {
      items.push([name, handle as unknown as FileSystemFileHandle])
    }
    for (const [name, handle] of this.directories) {
      items.push([name, handle as unknown as FileSystemDirectoryHandle])
    }
    return items[Symbol.iterator]() as unknown as FileSystemDirectoryHandle['entries'] extends () => infer R
      ? R
      : never
  }
}
