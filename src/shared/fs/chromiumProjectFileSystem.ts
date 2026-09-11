import { metaFileNameFor } from './fountainFileName'
import type { ProjectFileSystem } from './types'

const PROJECT_JSON = 'project.json'
const CHARACTERS_JSON = 'characters.json'
const LOCATIONS_JSON = 'locations.json'
const EPISODES_DIR = 'episodes'

async function readFileIfExists(dir: FileSystemDirectoryHandle, name: string): Promise<string | null> {
  try {
    const handle = await dir.getFileHandle(name)
    const file = await handle.getFile()
    return await file.text()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null
    }
    throw error
  }
}

async function writeFile(dir: FileSystemDirectoryHandle, name: string, content: string): Promise<void> {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

/**
 * `ProjectFileSystem` backed by the File System Access API. Only works in
 * Chromium-based browsers — see capability.ts and README.md.
 */
export class ChromiumProjectFileSystem implements ProjectFileSystem {
  private readonly root: FileSystemDirectoryHandle

  constructor(root: FileSystemDirectoryHandle) {
    this.root = root
  }

  get projectName(): string {
    return this.root.name
  }

  private async episodesDir(create: boolean): Promise<FileSystemDirectoryHandle> {
    return this.root.getDirectoryHandle(EPISODES_DIR, { create })
  }

  readProjectJson(): Promise<string | null> {
    return readFileIfExists(this.root, PROJECT_JSON)
  }

  writeProjectJson(content: string): Promise<void> {
    return writeFile(this.root, PROJECT_JSON, content)
  }

  readCharactersJson(): Promise<string | null> {
    return readFileIfExists(this.root, CHARACTERS_JSON)
  }

  writeCharactersJson(content: string): Promise<void> {
    return writeFile(this.root, CHARACTERS_JSON, content)
  }

  readLocationsJson(): Promise<string | null> {
    return readFileIfExists(this.root, LOCATIONS_JSON)
  }

  writeLocationsJson(content: string): Promise<void> {
    return writeFile(this.root, LOCATIONS_JSON, content)
  }

  async listEpisodeFountainFileNames(): Promise<string[]> {
    let episodes: FileSystemDirectoryHandle
    try {
      episodes = await this.episodesDir(false)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return []
      }
      throw error
    }

    const names: string[] = []
    for await (const [name, handle] of episodes.entries()) {
      if (handle.kind === 'file' && name.endsWith('.fountain')) {
        names.push(name)
      }
    }
    return names.sort()
  }

  async readEpisodeFountain(fountainFileName: string): Promise<string> {
    const episodes = await this.episodesDir(false)
    const content = await readFileIfExists(episodes, fountainFileName)
    if (content === null) {
      throw new DOMException(`${fountainFileName} not found`, 'NotFoundError')
    }
    return content
  }

  async writeEpisodeFountain(fountainFileName: string, content: string): Promise<void> {
    const episodes = await this.episodesDir(true)
    await writeFile(episodes, fountainFileName, content)
  }

  async readEpisodeMeta(fountainFileName: string): Promise<string | null> {
    const metaFileName = metaFileNameFor(fountainFileName)
    let episodes: FileSystemDirectoryHandle
    try {
      episodes = await this.episodesDir(false)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return null
      }
      throw error
    }
    return readFileIfExists(episodes, metaFileName)
  }

  async writeEpisodeMeta(fountainFileName: string, content: string): Promise<void> {
    const episodes = await this.episodesDir(true)
    await writeFile(episodes, metaFileNameFor(fountainFileName), content)
  }
}
