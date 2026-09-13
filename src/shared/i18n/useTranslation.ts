import { useAppStore } from '../store/useAppStore'
import { en } from './en'
import { es } from './es'
import type { Translations } from './es'

/**
 * Returns the whole translation object for the currently selected UI
 * language, so callers get plain, autocompleted property access
 * (`t.editor.saveVersion`) instead of a string-keyed `t('editor.saveVersion')`
 * lookup — `Translations` (shared by both `es.ts` and `en.ts`) already
 * guarantees the two objects have identical shape, so there's no missing-key
 * fallback to write or test for.
 */
export function useTranslation(): Translations {
  const uiLanguage = useAppStore((state) => state.uiLanguage)
  return uiLanguage === 'en' ? en : es
}
