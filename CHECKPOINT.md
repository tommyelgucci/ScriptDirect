# CHECKPOINT

Session log and recent decisions. Newest entries on top.

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
