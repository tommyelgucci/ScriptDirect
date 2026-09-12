import { strFromU8, strToU8, unzip, zip } from 'fflate'
import { episodeBaseName, metaFileNameFor } from './fountainFileName'
import type { ProjectFileSystem } from './types'

const PROJECT_JSON = 'project.json'
const CHARACTERS_JSON = 'characters.json'
const LOCATIONS_JSON = 'locations.json'
const CUADERNO_JSON = 'cuaderno.json'
const EPISODES_DIR = 'episodes'
const VERSIONS_DIR = 'versions'
const VERSIONS_INDEX_JSON = 'index.json'

function versionsDir(fountainFileName: string): string {
  return `${VERSIONS_DIR}/${episodeBaseName(fountainFileName)}`
}

/**
 * `ProjectFileSystem` for browsers without the File System Access API
 * (Safari, Firefox), per ARCHITECTURE.md's "Known limitation" note and this
 * folder's README TODO. There is no live folder to read from or autosave
 * to, so the whole project lives in memory as a flat path -> text map;
 * `importZip` unzips a previously exported project back into that map to
 * resume editing, and `exportZip` is the writer's only way to persist —
 * they must explicitly download the .zip again after making changes.
 */
export class ZipProjectFileSystem implements ProjectFileSystem {
  readonly projectName: string
  private readonly files: Map<string, string>

  private constructor(projectName: string, files: Map<string, string>) {
    this.projectName = projectName
    this.files = files
  }

  static createEmpty(projectName: string): ZipProjectFileSystem {
    return new ZipProjectFileSystem(projectName, new Map())
  }

  static async importZip(zipBytes: Uint8Array, projectName: string): Promise<ZipProjectFileSystem> {
    const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      unzip(zipBytes, (error, result) => (error ? reject(error) : resolve(result)))
    })
    const files = new Map<string, string>()
    for (const [path, bytes] of Object.entries(entries)) {
      if (!path.endsWith('/')) {
        files.set(path, strFromU8(bytes))
      }
    }
    return new ZipProjectFileSystem(projectName, files)
  }

  async exportZip(): Promise<Uint8Array> {
    const entries: Record<string, Uint8Array> = {}
    for (const [path, content] of this.files) {
      entries[path] = strToU8(content)
    }
    return new Promise((resolve, reject) => {
      zip(entries, { level: 6 }, (error, result) => (error ? reject(error) : resolve(result)))
    })
  }

  private read(path: string): string | null {
    return this.files.get(path) ?? null
  }

  async readProjectJson(): Promise<string | null> {
    return this.read(PROJECT_JSON)
  }

  async writeProjectJson(content: string): Promise<void> {
    this.files.set(PROJECT_JSON, content)
  }

  async readCharactersJson(): Promise<string | null> {
    return this.read(CHARACTERS_JSON)
  }

  async writeCharactersJson(content: string): Promise<void> {
    this.files.set(CHARACTERS_JSON, content)
  }

  async readLocationsJson(): Promise<string | null> {
    return this.read(LOCATIONS_JSON)
  }

  async writeLocationsJson(content: string): Promise<void> {
    this.files.set(LOCATIONS_JSON, content)
  }

  async readCuadernoJson(): Promise<string | null> {
    return this.read(CUADERNO_JSON)
  }

  async writeCuadernoJson(content: string): Promise<void> {
    this.files.set(CUADERNO_JSON, content)
  }

  async listEpisodeFountainFileNames(): Promise<string[]> {
    const prefix = `${EPISODES_DIR}/`
    return [...this.files.keys()]
      .filter((path) => path.startsWith(prefix) && path.endsWith('.fountain'))
      .map((path) => path.slice(prefix.length))
      .sort()
  }

  async readEpisodeFountain(fountainFileName: string): Promise<string> {
    const content = this.read(`${EPISODES_DIR}/${fountainFileName}`)
    if (content === null) {
      throw new DOMException(`${fountainFileName} not found`, 'NotFoundError')
    }
    return content
  }

  async writeEpisodeFountain(fountainFileName: string, content: string): Promise<void> {
    this.files.set(`${EPISODES_DIR}/${fountainFileName}`, content)
  }

  async readEpisodeMeta(fountainFileName: string): Promise<string | null> {
    return this.read(`${EPISODES_DIR}/${metaFileNameFor(fountainFileName)}`)
  }

  async writeEpisodeMeta(fountainFileName: string, content: string): Promise<void> {
    this.files.set(`${EPISODES_DIR}/${metaFileNameFor(fountainFileName)}`, content)
  }

  async readVersionsIndexJson(fountainFileName: string): Promise<string | null> {
    return this.read(`${versionsDir(fountainFileName)}/${VERSIONS_INDEX_JSON}`)
  }

  async writeVersionsIndexJson(fountainFileName: string, content: string): Promise<void> {
    this.files.set(`${versionsDir(fountainFileName)}/${VERSIONS_INDEX_JSON}`, content)
  }

  async readVersionFountain(fountainFileName: string, versionFileName: string): Promise<string> {
    const content = this.read(`${versionsDir(fountainFileName)}/${versionFileName}`)
    if (content === null) {
      throw new DOMException(`${versionFileName} not found`, 'NotFoundError')
    }
    return content
  }

  async writeVersionFountain(fountainFileName: string, versionFileName: string, content: string): Promise<void> {
    this.files.set(`${versionsDir(fountainFileName)}/${versionFileName}`, content)
  }
}
