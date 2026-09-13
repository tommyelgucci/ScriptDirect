import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from './useTranslation'
import { es } from './es'
import { en } from './en'

afterEach(() => {
  useAppStore.getState().setUiLanguage('es')
})

describe('useTranslation', () => {
  it('returns the Spanish dictionary by default', () => {
    const { result } = renderHook(() => useTranslation())
    expect(result.current).toBe(es)
  })

  it('switches to the English dictionary when uiLanguage is en', () => {
    useAppStore.getState().setUiLanguage('en')
    const { result } = renderHook(() => useTranslation())
    expect(result.current).toBe(en)
  })

  it('re-renders with the new dictionary when the language changes after mount', () => {
    const { result, rerender } = renderHook(() => useTranslation())
    expect(result.current.editor.saveVersion).toBe('Guardar versión')

    useAppStore.getState().setUiLanguage('en')
    rerender()

    expect(result.current.editor.saveVersion).toBe('Save version')
  })
})

describe('es/en translation dictionaries', () => {
  // Translations is derived from es.ts's shape, so a key present in one but
  // not the other is already a compile error — this is an extra, cheap
  // runtime confirmation that no key was ever left as an empty string by
  // mistake (which would compile fine but ship a blank label).
  function collectLeaves(node: unknown, path: string[] = []): string[] {
    if (typeof node === 'string' || typeof node === 'function') {
      return [path.join('.')]
    }
    if (node && typeof node === 'object') {
      return Object.entries(node).flatMap(([key, value]) => collectLeaves(value, [...path, key]))
    }
    return [path.join('.')]
  }

  it('has the exact same set of keys in both languages', () => {
    expect(collectLeaves(en).sort()).toEqual(collectLeaves(es).sort())
  })

  it('never ships an empty string as a translation', () => {
    function collectStrings(node: unknown): string[] {
      if (typeof node === 'string') {
        return [node]
      }
      if (node && typeof node === 'object') {
        return Object.values(node).flatMap(collectStrings)
      }
      return []
    }
    for (const value of [...collectStrings(es), ...collectStrings(en)]) {
      expect(value.trim()).not.toBe('')
    }
  })
})
