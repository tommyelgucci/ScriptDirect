# settings

Settings — AI provider key entry (BYOK) and UI language toggle (ES/EN).

- `SettingsScreen.tsx` — provider (Anthropic/OpenAI/Gemini) + model +
  API key, and the ES/EN toggle wired to `useAppStore`.
- The API key is read/written via `shared/ai/apiKeyStorage.ts`: browser
  `localStorage` only, scoped per provider (not per project), never sent
  anywhere except that provider — see the disclosure text in the screen
  itself. Provider + model (never the key) are persisted to the open
  project's `project.json`.

Ollama is a valid `AiProviderName` in the data model (entities/project.ts)
but isn't exposed in this screen yet — ROADMAP.md's MVP scope for Settings
only calls for pasting a key for Anthropic/OpenAI/Gemini. A local model
needs no key, so it belongs here as a separate "no key required" option
when it's built.
