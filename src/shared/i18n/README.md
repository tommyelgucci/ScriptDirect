# i18n

The bilingual UI layer (`ARCHITECTURE.md`'s Language rule: Spanish default, English
toggle). The toggle itself lives in `features/settings` (`uiLanguage` in
`shared/store/useAppStore.ts`) — this module is what actually reacts to it.

- `es.ts` — the Spanish strings, and the source of `Translations`
  (`export type Translations = typeof es`).
- `en.ts` — the English strings, typed as `Translations`. Assigning a plain
  object literal to that type makes a missing or extra key a `tsc -b`
  error, not a runtime surprise — there's no key-by-key fallback logic to
  maintain or forget to update.
- `useTranslation()` — returns the whole dictionary for the current
  `uiLanguage` (`es` or `en`), so call sites read `t.editor.saveVersion`
  with full autocomplete instead of a string-keyed `t('editor.saveVersion')`
  lookup.

Add a string by adding the same key to both `es.ts` and `en.ts` — the type
system won't let you add it to only one. Keep feature names (Bitácora,
Brújula, Constelación, Pulso, Ruta, Cuaderno — see `ARCHITECTURE.md`'s
Feature Naming table) as literal translations of the Spanish word, not the
English glosses in that table: those glosses exist to compare against
competitors internally, and reusing one (e.g. Brújula → "Script Doctor")
would reintroduce exactly the name collision the table was written to avoid.

Static UI chrome only — nav labels, buttons, headers, empty states, error
messages. Content the user or the AI provider writes (scene headings,
character names, Brújula's findings, Pulso's dominant-emotion labels) stays
in whatever language it was written in; translating that isn't this
module's job.

A function value (e.g. `t.ruta.actAriaLabel(heading)`) is for a string that
interpolates data — the function itself still has to exist in both `es.ts`
and `en.ts` with the same signature, same as any other key.
