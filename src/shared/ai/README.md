# shared/ai

BYOK AI provider adapters, per ARCHITECTURE.md's AI Provider Architecture.

- `types.ts` — the `AIProvider` interface every adapter implements.
- `providers/{anthropic,openai,gemini}Provider.ts` — one adapter per
  provider, each calling that provider's API directly from the browser
  with the user's own key. No adapter sends anything to a ScriptDirect
  server; there isn't one.
- `createAIProvider(name)` — picks the adapter for a `Project`'s configured
  `aiProvider.provider`. Throws `UnsupportedAIProviderError` for `ollama`
  (a valid value in the data model, not yet wired to a real adapter or
  exposed in Settings).
- `apiKeyStorage.ts` — reads/writes the BYOK key: the OS keychain under the
  Tauri desktop shell (via `tauriKeychain.ts` and the Rust commands in
  `src-tauri/src/keychain.rs`), `localStorage` otherwise, scoped per
  provider. See its own doc comment for the web build's security
  disclosure.
- `tauriKeychain.ts` — thin `invoke()` wrapper around the three
  `keychain_*` Tauri commands. Only called when `isTauriRuntime()` is true.
- `analysisPrompt.ts` / `parseAnalysisResponse.ts` — the shared prompt
  Brújula sends to whichever provider, and the shared parser that turns
  the response back into structured findings.
- `sceneMetricsPrompt.ts` / `parseSceneMetricsResponse.ts` — Pulso's
  equivalent, asking for a JSON array scoring every scene. Scene alignment
  reuses the script's own `[[id:scn_xxxx]]` notes: the prompt asks the
  model to copy each id exactly, so the response can be matched back to
  real scenes without any separate indexing scheme. The caller (not this
  module) is responsible for dropping any entry whose `sceneId` doesn't
  match an actual scene — a defense against the model inventing one.
- `extractJson.ts` — shared by both parsers: pulls a JSON object or array
  out of a markdown code fence, the outermost `{...}`/`[...]` span, or the
  raw text as-is (tolerant of prose around it — models don't always follow
  "JSON only" exactly).

## Testing limitation

These adapters call real provider APIs directly from the browser — there's
no key available in this environment to exercise them against the real
services. Request shape (URL, headers, body) and response parsing are
covered with `fetch` mocked; the actual network round-trip to each
provider is unverified here.
