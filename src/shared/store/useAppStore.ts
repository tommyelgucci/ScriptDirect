import { create } from 'zustand'
import type { ProjectFileSystem } from '../fs/types'

export type UiLanguage = 'es' | 'en'

/** MVP: a project has exactly one episode/script, always stored under this file name. */
export const DEFAULT_EPISODE_FILE_NAME = 'script.fountain'

export interface ProjectSession {
  fileSystem: ProjectFileSystem
  /** MVP: a project has exactly one episode/script; multi-episode support is Phase 2+. */
  episodeFileName: string
}

export interface AppState {
  uiLanguage: UiLanguage
  setUiLanguage: (language: UiLanguage) => void
  project: ProjectSession | null
  openProject: (session: ProjectSession) => void
  closeProject: () => void
}

export const useAppStore = create<AppState>((set) => ({
  uiLanguage: 'es',
  setUiLanguage: (language) => set({ uiLanguage: language }),
  project: null,
  openProject: (session) => set({ project: session }),
  closeProject: () => set({ project: null }),
}))
