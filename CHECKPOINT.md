# CHECKPOINT

Session log and recent decisions. Newest entries on top.

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
