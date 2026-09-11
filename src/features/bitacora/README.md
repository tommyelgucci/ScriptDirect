# bitacora

Bitácora — screenplay block editor (Writing Desk equivalent).

## What's here

- `EditorScreen.tsx` — loads the project's single MVP script, composes the
  sidebar and the block editor, and autosaves edits.
- `BlockEditor.tsx` — Tiptap wrapper wiring up the five block node types.
- `nodes/blockTypeNode.ts` — the five Fountain block types as distinct
  Tiptap nodes (Heading, Action, Character, Parenthetical, Dialogue).
- `nodes/blockTypeCycling.ts` — Tab / Shift-Tab cycle the current block's
  type; Enter after a heading starts a new Action block.
- `fountainTiptap.ts` — pure conversion between parsed Fountain scenes and
  the Tiptap document, including how a scene's stable id round-trips as
  its `[[id:scn_xxxx]]` note (see `src/shared/fountain/README.md`).
- `saveDoc.ts` — serializes the doc back to Fountain (running
  `ensureSceneIds` first) and writes it through `ProjectFileSystem`.
- `SceneSidebar.tsx` / `sceneList.ts` — scene list with click-to-navigate.

## Known simplifications (MVP scope, not full Final Draft parity)

- **Tab cycling is a fixed loop** (Heading → Action → Character →
  Parenthetical → Dialogue → …), not Final Draft's full context-sensitive
  element rules.
- **A project has exactly one script** (`script.fountain`, see
  `DEFAULT_EPISODE_FILE_NAME` in `shared/store/useAppStore.ts`).
  Multi-episode/season support is Phase 2+ per `ROADMAP.md`.
- **No inline formatting** (bold/italic/underline) — blocks are plain text.
