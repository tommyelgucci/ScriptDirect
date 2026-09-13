# CHECKPOINT

Session log and recent decisions. Newest entries on top.

## 2026-09-13 — All 5 confirmed-still-live Codex findings fixed, easiest to hardest

Went through Codex's review comments across every historical PR, verified
each finding against current `main` (not the historical diff — several
were already fixed or superseded), and confirmed 5 were genuinely still
live. Fixed all 5, on `claude/fix-codex-findings`, in this order:

1. **JSON.parse crash on corrupt sidecar files.** `schema.safeParse(JSON.parse(text))`
   throws on syntactically invalid JSON before `safeParse` can apply its
   documented fresh-start fallback — found 11 call sites doing this (not
   just the 5 originally cited). Added `shared/json/safeParseJson.ts`, a
   shared helper that never throws, and switched every call site to it.

2. **Path traversal in `TauriProjectFileSystem`.** A version's `fileName`
   comes back from `versions/index.json` — project data, not something the
   app generates at read time — and went straight into `join()`. Tauri's
   fs plugin runs with `fs:scope: "**"` (the whole disk, no sandbox of its
   own), so a corrupted or hand-edited index entry like
   `"../../../../etc/passwd"` could read or write outside the project
   folder. Added `assertSafeFileName()`, applied before the `join()`.

3. **EditorScreen's autosave race.** `saveDoc()` isn't atomic (writes the
   script, then separately reads-and-rewrites `characters.json` and
   `locations.json`); the unmount cleanup never cleared the pending-doc
   ref, so an unmount racing an in-flight debounced save could fire a
   second, overlapping `saveDoc()` and corrupt those sidecars. Extracted a
   standalone `autosaveScheduler.ts` that chains every write through one
   promise so a second flush during an in-flight save is a no-op instead
   of a race — verified with fake-timer + controlled-promise tests, since
   real typing into the tiptap editor can't be driven from jsdom
   (ProseMirror needs `getClientRects`, confirmed by trying it and reading
   the stack trace).

4. **Pulso's AI metrics were read-only.** No way to correct a
   misjudged scene's score, or drop just one bad scene, without paying for
   and waiting on a full re-analysis. Brújula already solves this for its
   findings (per-finding Aceptar/Descartar); Pulso had nothing equivalent.
   Added a table under the chart with Editar/Descartar per scene —
   `SceneMetricEditor.tsx` mirrors Constelación's `CharacterTraitsEditor`
   pattern (0-100 sliders + a text field), both persist immediately.

5. **The EN/ES language toggle didn't translate anything.** It only ever
   set `uiLanguage` in the store; no screen read it back, so switching to
   English had zero visible effect anywhere — confirmed by an earlier
   session's Playwright pass and logged in the previous entry below. Built
   a real layer: `shared/i18n/es.ts` + `en.ts` (a shared `Translations`
   type makes a key missing from either file a `tsc -b` error, not a
   runtime gap) and `useTranslation()`, wired into all 11 screens'
   navigation, buttons, headers, empty states, and error messages. Content
   the user or the AI writes (scene text, Brújula's findings, Pulso's
   emotion labels) is untouched — not UI chrome. Verified live in a real
   browser via Playwright: toggling in Configuración re-renders visible
   text immediately and the choice persists across navigation.

Each fix: full `pnpm test && pnpm lint && pnpm build` green before
committing, one commit per finding, pushed to `claude/fix-codex-findings`
for review — no PR opened per the usual pattern (the repo owner reviews
and merges).

## 2026-09-12 — Real Tauri build verified; ZIP fallback and a first Cuaderno shipped

Continuing on `claude/session-work`. Went through everything that was
flagged as remaining, easiest to hardest:

**Tauri: verified with an actual `pnpm tauri build`, not just `cargo
check`.** This sandbox was missing `libgtk-3-dev`/`libwebkit2gtk-4.1-dev`
(needed to compile Tauri's Linux backend at all); installed them and got
a real release build: `.deb`, `.rpm`, and `.AppImage` all produced with
zero compiler warnings. Launched the resulting binary under Xvfb (no
real display here) — it started and stayed up 10s with no panic, only
expected `libEGL`/DRI3 warnings from having no GPU. Still unverified:
actual UI interaction (no display) and the OS keychain round-trip (no
keyring daemon) — both need a real machine.

**Found a real bug via real-browser testing (Playwright + the
pre-installed Chromium), not caught by tsc or the test suite:** the
English toggle in Configuración changes `uiLanguage` state but no UI
string anywhere actually reads it — every label stays in Spanish. Not
fixed yet (it's a project-wide i18n gap, not a one-file fix); flagging
here so it doesn't get lost. Worth deciding priority on separately.

**ZIP import/export fallback for Safari/Firefox — done.** Closed the
TODO in `shared/fs/README.md`. `ZipProjectFileSystem` holds a project
in memory; `HomeScreen` offers import/create instead of the folder
picker when `needsZipFallback()`; `EditorScreen` gets an "Exportar .zip
(guardar)" button that flushes the pending autosave first. Verified with
a real full round trip in Chromium (simulating Safari by deleting
`window.showDirectoryPicker`): typed a real scene, exported, unzipped
the actual downloaded file and confirmed the content and folder layout,
then re-imported that same file through the UI and confirmed the
episode was still there.

**Cuaderno (development documents) — first version shipped.** Named in
`ARCHITECTURE.md` since the start, never phased into `ROADMAP.md`, zero
code until now. Free-form per-project notes (title + plain text),
stored the same way as characters.json/locations.json. Required
extending `ProjectFileSystem` with `readCuadernoJson`/`writeCuadernoJson`
and updating all 15 `fakeFileSystem` test helpers across the suite —
same ripple locations.json caused when it was added. Verified in a real
browser: create, edit, persist across navigation, delete.

280 tests pass (up from 251 at the top of this session), lint clean,
`tsc -b` clean, production build succeeds throughout.

**What's left, roughly easiest to hardest:** the i18n gap just found;
deciding on the differentiator question from the competitive-landscape
entry below; genuine device testing for Tauri (real OS, real keychain,
real screen).

## 2026-09-12 — Tauri OS keychain done; competitive landscape flagged; work now on a branch

Two things since the previous entry, both on `claude/session-work` (not
pushed to `main` — see "Workflow change" below):

**Tauri OS keychain — done.** The second (and last) item
`ARCHITECTURE.md`'s Platform Strategy asked of Tauri is implemented:
three commands (`src-tauri/src/keychain.rs`, using the `keyring` crate)
back `readApiKey`/`writeApiKey` with the real OS keychain
(Keychain/Credential Manager/secret-service) whenever the app runs as the
desktop shell, falling back to `localStorage` in the web/PWA build. Had
to make `readApiKey`/`writeApiKey` async to support the IPC round-trip;
updated Brújula, Pulso, and Settings accordingly. `cargo check` and
`cargo clippy --no-deps` are clean — this sandbox was missing
`libgtk-3-dev`/`libwebkit2gtk-4.1-dev` (needed to compile Tauri's Linux
backend at all, unrelated to keyring), installed them to get a real
compile instead of a shallower check. All 251 frontend tests pass, lint
clean, `pnpm build` succeeds. **Still unverified, as flagged previously:**
no keyring daemon runs in this sandbox, so the actual get/set/delete
round-trip against a real OS keychain has never executed here — only that
it compiles and the ACL/permissions wiring resolves correctly (traced
through `tauri-build`'s own resolution code, not assumed). Also still
true from before: never ran a full `pnpm tauri build` (final bundle),
only `cargo check`/`cargo build` on the Rust binary.

**Competitive landscape check.** A close-to-beta competitor
(unaffiliated developer, posted in a screenwriter Facebook group) already
ships 4 of `ARCHITECTURE.md`'s 5 stated Differentiators — Spanish-first,
offline/local-first, BYOK, and a Pulso equivalent with more metrics than
ours ships today. Logged in `ROADMAP.md` under "Competitive landscape
check" with what's left unverified (Fountain/open-format interop) and
what's newly worth testing (true native desktop distribution vs. his
browser-installable PWA). Not resolved — the next session should treat
the original differentiator list as stale until this is revisited.

**Workflow change:** the repo owner asked to stop pushing straight to
`main` — new work now goes on `claude/session-work`, reviewed and merged
by the owner before landing.

## 2026-09-12 — Phase 2+ batch landed: character sliders, Pulso, Ruta, multi-episode, Tauri (partial)

All 5 requested items are now in `main`, in order: character trait sliders
→ Pulso → Ruta → multi-episode → Tauri desktop shell. No PRs left open.

**Tauri — partial.** The desktop shell and `TauriProjectFileSystem` are
merged and compile (verified with a real `cargo build` in-sandbox). Of the
two things `ARCHITECTURE.md`'s Platform Strategy asks for Tauri, only one
is done:
- Done: folder access without the File System Access API's browser
  limitation (Safari/Firefox).
- Not done: **OS keychain-backed API key storage.** Not implemented yet.
  Flagging ahead of time: this sandbox has no keyring daemon running
  (no gnome-keyring, no D-Bus session), so even once it's implemented with
  Rust's `keyring` crate, there's no way to verify at runtime here that it
  actually reads/writes the real OS keychain — only that it compiles.
- Never ran a full `pnpm tauri build` (final bundle) — only
  `cargo build` / `cargo check` on the Rust binary.

**Documented gaps, untouched:**
- ZIP fallback for Safari/Firefox, called out as an explicit TODO in
  `shared/fs/README.md` — without it, the web build only works in
  Chrome/Edge.
- **Cuaderno** (development documents) — named in `ARCHITECTURE.md`'s
  feature table but never entered `ROADMAP.md`'s phase sequencing. Zero
  work done here.

Next session should pick one of: Tauri keychain (with the verification
limitation above), the ZIP fallback, or Cuaderno.
