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
- `apiKeyStorage.ts` — reads/writes the BYOK key in `localStorage`, scoped
  per provider. See its own doc comment for the security disclosure.
- `analysisPrompt.ts` / `parseAnalysisResponse.ts` — the shared prompt
  Brújula sends to whichever provider, and the shared parser that turns
  the response back into structured findings (tolerant of a raw JSON
  object, one wrapped in a markdown code fence, or one surrounded by
  other prose — models don't always follow "JSON only" exactly).

## Testing limitation

These adapters call real provider APIs directly from the browser — there's
no key available in this environment to exercise them against the real
services. Request shape (URL, headers, body) and response parsing are
covered with `fetch` mocked; the actual network round-trip to each
provider is unverified here.
