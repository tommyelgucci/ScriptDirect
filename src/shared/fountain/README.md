# shared/fountain

Wraps [`fountain-js`](https://github.com/jonnygreenwald/fountain-js) and
implements the `[[id:scn_xxxx]]` stable scene ID convention from
`ARCHITECTURE.md`.

- `ensureSceneIds(source)` — tags every scene heading that doesn't already
  have an id with a new `[[id:scn_xxxx]]` note, and leaves already-tagged
  scenes untouched. Call this before persisting a `.fountain` file.
- `parseFountainDocument(source)` — parses Fountain source into scenes and
  blocks (Heading, Action, Character, Dialogue, Parenthetical), reading each
  scene's id from its note when present.

## Note placement (deviates from the original ARCHITECTURE.md example)

`ARCHITECTURE.md`'s original example showed the id note directly on the
line after the heading, with no blank line:

```
INT. MORTY'S HOME - KITCHEN - LATER
[[id:scn_7f2a]]
```

That does not parse correctly with fountain-js: without a blank line on
both sides, the note gets absorbed into the next dialogue/action block
instead of staying its own inert token, and the scene heading itself can
fail to be recognized. Confirmed against a plain `fountain-js` parser in
`src/shared/fountain/__tests__/crossAppCompatibility.test.ts`. The corrected
placement blank-line-isolates the note:

```
INT. MORTY'S HOME - KITCHEN - LATER

[[id:scn_7f2a]]

Morty stares at the knife on the counter.
```

This is what `ensureSceneIds` generates, and it's still exactly the
`[[ ]]` note syntax any Fountain-compatible app safely ignores.
