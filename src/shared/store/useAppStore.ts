import { create } from 'zustand'
import type { ProjectFileSystem } from '../fs/types'

export type UiLanguage = 'es' | 'en'

/**
 * File name used for a project's first/only episode before the writer has
 * created any others (see features/episodes). Legacy single-script
 * projects from before multi-episode support keep using this file too.
 */
export const DEFAULT_EPISODE_FILE_NAME = 'script.fountain'

export interface ProjectSession {
  fileSystem: ProjectFileSystem
  /** The episode currently open in Bitácora; switch with setEpisodeFileName. */
  episodeFileName: string
}

export interface AppState {
  uiLanguage: UiLanguage
  setUiLanguage: (language: UiLanguage) => void
  project: ProjectSession | null
  openProject: (session: ProjectSession) => void
  closeProject: () => void
  /** Switches the currently open project to a different episode, without reopening the folder. */
  setEpisodeFileName: (episodeFileName: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  uiLanguage: 'es',
  setUiLanguage: (language) => set({ uiLanguage: language }),
  project: null,
  openProject: (session) => set({ project: session }),
  closeProject: () => set({ project: null }),
  setEpisodeFileName: (episodeFileName) =>
    set((state) => (state.project ? { project: { ...state.project, episodeFileName } } : state)),
}))
