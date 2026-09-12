# CHECKPOINT

Session log and recent decisions. Newest entries on top.

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
