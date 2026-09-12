import { join } from '@tauri-apps/api/path'
import { exists, mkdir, readDir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { episodeBaseName, metaFileNameFor } from './fountainFileName'
import type { ProjectFileSystem } from './types'

const PROJECT_JSON = 'project.json'
const CHARACTERS_JSON = 'characters.json'
const LOCATIONS_JSON = 'locations.json'
const CUADERNO_JSON = 'cuaderno.json'
const EPISODES_DIR = 'episodes'
const VERSIONS_DIR = 'versions'
const VERSIONS_INDEX_JSON = 'index.json'

async function readFileIfExists(path: string): Promise<string | null> {
  if (!(await exists(path))) {
    return null
  }
  return readTextFile(path)
}

/**
 * `ProjectFileSystem` backed by the Tauri desktop shell's fs plugin, per
 * ARCHITECTURE.md's Platform Strategy: this sidesteps the File System
 * Access API's Chromium-only limitation entirely, since Tauri's fs plugin
 * works against any path on disk regardless of the OS's default browser.
 */
export class TauriProjectFileSystem implements ProjectFileSystem {
  private readonly rootPath: string

  constructor(rootPath: string) {
    this.rootPath = rootPath
  }

  get projectName(): string {
    const trimmed = this.rootPath.replace(/[/\\]+$/, '')
    const segments = trimmed.split(/[/\\]/)
    return segments[segments.length - 1] || trimmed
  }

  private async episodesDir(create: boolean): Promise<string> {
    const dir = await join(this.rootPath, EPISODES_DIR)
    if (create) {
      await mkdir(dir, { recursive: true })
    }
    return dir
  }

  private async versionsDir(fountainFileName: string, create: boolean): Promise<string> {
    const dir = await join(this.rootPath, VERSIONS_DIR, episodeBaseName(fountainFileName))
    if (create) {
      await mkdir(dir, { recursive: true })
    }
    return dir
  }

  async readProjectJson(): Promise<string | null> {
    return readFileIfExists(await join(this.rootPath, PROJECT_JSON))
  }

  async writeProjectJson(content: string): Promise<void> {
    await writeTextFile(await join(this.rootPath, PROJECT_JSON), content)
  }

  async readCharactersJson(): Promise<string | null> {
    return readFileIfExists(await join(this.rootPath, CHARACTERS_JSON))
  }

  async writeCharactersJson(content: string): Promise<void> {
    await writeTextFile(await join(this.rootPath, CHARACTERS_JSON), content)
  }

  async readLocationsJson(): Promise<string | null> {
    return readFileIfExists(await join(this.rootPath, LOCATIONS_JSON))
  }

  async writeLocationsJson(content: string): Promise<void> {
    await writeTextFile(await join(this.rootPath, LOCATIONS_JSON), content)
  }

  async readCuadernoJson(): Promise<string | null> {
    return readFileIfExists(await join(this.rootPath, CUADERNO_JSON))
  }

  async writeCuadernoJson(content: string): Promise<void> {
    await writeTextFile(await join(this.rootPath, CUADERNO_JSON), content)
  }

  async listEpisodeFountainFileNames(): Promise<string[]> {
    const dir = await this.episodesDir(false)
    if (!(await exists(dir))) {
      return []
    }
    const entries = await readDir(dir)
    return entries
      .filter((entry) => entry.isFile && entry.name.endsWith('.fountain'))
      .map((entry) => entry.name)
      .sort()
  }

  async readEpisodeFountain(fountainFileName: string): Promise<string> {
    const dir = await this.episodesDir(false)
    const content = await readFileIfExists(await join(dir, fountainFileName))
    if (content === null) {
      throw new DOMException(`${fountainFileName} not found`, 'NotFoundError')
    }
    return content
  }

  async writeEpisodeFountain(fountainFileName: string, content: string): Promise<void> {
    const dir = await this.episodesDir(true)
    await writeTextFile(await join(dir, fountainFileName), content)
  }

  async readEpisodeMeta(fountainFileName: string): Promise<string | null> {
    const dir = await this.episodesDir(false)
    if (!(await exists(dir))) {
      return null
    }
    return readFileIfExists(await join(dir, metaFileNameFor(fountainFileName)))
  }

  async writeEpisodeMeta(fountainFileName: string, content: string): Promise<void> {
    const dir = await this.episodesDir(true)
    await writeTextFile(await join(dir, metaFileNameFor(fountainFileName)), content)
  }

  async readVersionsIndexJson(fountainFileName: string): Promise<string | null> {
    const dir = await this.versionsDir(fountainFileName, false)
    if (!(await exists(dir))) {
      return null
    }
    return readFileIfExists(await join(dir, VERSIONS_INDEX_JSON))
  }

  async writeVersionsIndexJson(fountainFileName: string, content: string): Promise<void> {
    const dir = await this.versionsDir(fountainFileName, true)
    await writeTextFile(await join(dir, VERSIONS_INDEX_JSON), content)
  }

  async readVersionFountain(fountainFileName: string, versionFileName: string): Promise<string> {
    const dir = await this.versionsDir(fountainFileName, false)
    const content = await readFileIfExists(await join(dir, versionFileName))
    if (content === null) {
      throw new DOMException(`${versionFileName} not found`, 'NotFoundError')
    }
    return content
  }

  async writeVersionFountain(fountainFileName: string, versionFileName: string, content: string): Promise<void> {
    const dir = await this.versionsDir(fountainFileName, true)
    await writeTextFile(await join(dir, versionFileName), content)
  }
}
