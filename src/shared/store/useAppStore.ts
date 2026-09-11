import { create } from 'zustand'

export type UiLanguage = 'es' | 'en'

export interface AppState {
  uiLanguage: UiLanguage
  setUiLanguage: (language: UiLanguage) => void
}

export const useAppStore = create<AppState>((set) => ({
  uiLanguage: 'es',
  setUiLanguage: (language) => set({ uiLanguage: language }),
}))
