import { describe, expect, it } from 'vitest'
import { useAppStore } from './useAppStore'

describe('useAppStore', () => {
  it('defaults the UI language to Spanish', () => {
    expect(useAppStore.getState().uiLanguage).toBe('es')
  })

  it('updates the UI language', () => {
    useAppStore.getState().setUiLanguage('en')
    expect(useAppStore.getState().uiLanguage).toBe('en')

    useAppStore.getState().setUiLanguage('es')
    expect(useAppStore.getState().uiLanguage).toBe('es')
  })
})
