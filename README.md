# ScriptDirect

A local-first screenwriting suite for film, TV, and complex narrative. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full product/technical
architecture and [`ROADMAP.md`](./ROADMAP.md) for scope and sequencing.

## Status

Early scaffold. Currently implemented:

- Project scaffold (Vite + React + TypeScript, Zustand, Vitest)
- Data model layer (TypeScript types + Zod schemas for all persisted entities)
- Local file access wrapper (File System Access API, Chromium only for now)
- Fountain parsing with the `[[id:scn_xxxx]]` stable scene ID convention

No editor UI yet — see `ROADMAP.md` for what comes next.

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- A Chromium-based browser (Chrome/Edge) for local folder access — the File
  System Access API is not yet supported in Safari/Firefox. See
  `src/shared/fs/README.md` for the fallback plan.

## Getting started

```bash
pnpm install
pnpm dev
```

This starts the Vite dev server (prints the local URL to the terminal,
typically `http://localhost:5173`).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Typecheck and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run the test suite once (Vitest + React Testing Library) |
| `pnpm test:watch` | Run the test suite in watch mode |
| `pnpm lint` | Lint the codebase (oxlint) |

## Project layout

```
src/
  app/              App shell (composition root)
  entities/         Domain types + Zod schemas (Project, Episode, Scene, ...)
  features/         One folder per product feature (Bitácora, Brújula, ...)
  shared/
    fs/             File System Access API wrapper, project folder layout
    fountain/       fountain-js integration, scene ID convention
    store/          Zustand global store
  test/             Test setup (Vitest + Testing Library)
```

Feature naming follows `ARCHITECTURE.md` (Bitácora, Constelación, Brújula,
Ruta, Pulso, Cuaderno) rather than English equivalents — this is a UI-facing
naming choice, not a language exception; all source stays in English.

## Data & privacy

A ScriptDirect project is a folder on disk — there is no backend and no
ScriptDirect-owned server. AI provider API keys are supplied by the user
(BYOK: Anthropic, OpenAI, Gemini, or local via Ollama) and are sent only to
that provider, never to us.
