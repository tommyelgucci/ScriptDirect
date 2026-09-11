# ScriptDirect — Architecture

## Vision

ScriptDirect is a screenwriting suite for film, TV, and complex narrative. It is
not an "AI writes your script" tool. The AI acts as an analytical assistant
(structure notes, pacing, emotional/tension metrics, relationship mapping)
while the writer stays in full control of every decision.

## Hard Rules (non-negotiable)

1. **Language:** All code, comments, commit messages, variable/function names,
   and documentation must be written in English. The end-user UI is bilingual
   (Spanish default, English toggle), but that is a translation layer, not a
   reason to write source in Spanish.
2. **Authorship:** Claude must never be listed as author or co-author on any
   commit. No `Co-Authored-By: Claude` or similar trailers. All commits are
   attributed solely to the repository owner:
   ```
   git config user.name "tommyelgucci"
   git config user.email "299895314+tommyelgucci@users.noreply.github.com"
   ```
3. **User control:** Every AI-generated suggestion (analysis notes, extracted
   characters, metrics) must be reviewable, editable, and dismissible. Nothing
   the AI produces silently overwrites the writer's text.

## Differentiators (why this exists instead of using an existing tool)

- **Spanish-first market.** Final Draft, WriterDuet, Arc Studio, Storyflow,
  Inkshift — none seriously support Spanish. UI defaults to Spanish.
- **Local-first / offline.** A project is a folder on disk, not a row in
  someone else's database. Works without internet once loaded.
- **BYOK (Bring Your Own Key).** The user supplies their own AI provider key
  (Anthropic, OpenAI, Gemini, or local via Ollama). No AI costs are routed
  through our servers, which is what makes "free for writing" sustainable.
- **No vendor lock-in.** Scripts are stored in Fountain, an open plain-text
  screenplay format readable by Highland, Slugline, Trelby, Fade In, Celtx,
  Scrite, and others.
- **Emotional/tension metrics per scene ("Pulso").** Not offered by any
  competitor surveyed (Final Draft, WriterDuet, Fade In, Arc Studio, Scrite,
  Inkshift, Storyflow, Laper.ai, FinalBit, ScriptDraft).

## Feature Naming

Avoid names already used by competitors (Laper.ai uses "Script Doctor";
several tools use "Neural Map" / "coverage"). Internal names:

| Internal name | Function | Roughly equivalent to |
|---|---|---|
| Bitácora | Screenplay block editor | Writing Desk |
| Constelación | Character/relationship force graph | Neural Map |
| Brújula | AI narrative analysis report | Script Doctor |
| Ruta | Act/beat structure timeline | Beat Timeline |
| Pulso | Per-scene emotional/tension metrics | (no direct equivalent) |
| Cuaderno | Development documents | Dev Documents |

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + TypeScript + Vite | Ecosystem maturity, Claude Code support |
| State | Zustand | Lightweight, fits local-file-backed state |
| Routing | React Router (hash mode) | No server required |
| Block editor (Bitácora) | Tiptap (ProseMirror) | Custom node type per Fountain block |
| Fountain parser | fountain-js | Existing, maintained |
| Relationship graph (Constelación) | react-force-graph-2d (d3-force) | Force/gravity simulation, matches reference UI; 2D is right-sized for MVP+1, not Three.js |
| Metrics charts (Pulso) | Recharts | Fast to implement; can migrate to raw D3 later for drag/zoom |
| Schema validation | Zod | Validates hand-editable local JSON, gives TS types for free |
| File access (web) | File System Access API | Real local folder access, no upload |
| File access (desktop) | Tauri fs API | Same folder model, works on all OSes, no browser limitation |
| PDF export | pdf-lib (custom layout) | Needs exact industry-format control |
| Testing | Vitest + React Testing Library | Native to Vite |
| Package manager | pnpm | Fast, disk-efficient |

**Known limitation:** File System Access API is Chromium-only (Chrome/Edge).
Safari/Firefox need a degraded fallback (ZIP import/export) in the web build.
This is the main argument for treating the Tauri desktop build as part of the
near-term roadmap, not a "someday" item.

## AI Provider Architecture

Adapter pattern behind a single `AIProvider` interface supporting Anthropic,
OpenAI, Gemini, and local models via Ollama.

- **Desktop (Tauri):** key stored in the OS keychain.
- **Web (PWA):** key stored in browser storage only — must be clearly
  disclosed to the user as not strongly encrypted, rather than implying
  security that doesn't exist.

## Data Model

### Hierarchy
```
Project
 └─ Season / Movie
     └─ Episode
         └─ Scene
             └─ Block (Heading, Action, Character, Dialogue, Parenthetical)
```

### Supporting entities
- `Character` — name, aliases[], group (Protagonist/Antagonist/Supporting/Extra),
  description, scene appearances (derived, not hand-maintained)
- `Location` — same pattern as Character
- `Item` — continuity objects
- `Relationship` — between two Characters: type (Family/Friendship/Romance/Rivalry...), description
- `Beat` / `Act` — structural layer over Scenes (powers Ruta)
- `SceneMetric` — per scene: emotional intensity, dramatic tension, attention capture, commercial potential, dominant emotion (powers Pulso)
- `AnalysisReport` (Brújula) — sections (strengths, main issues, what's missing/excess, rewrite plan), each finding has a review state: unreviewed / accepted / dismissed
- `Version` — snapshot of a full Episode

### Storage format — hybrid Fountain + JSON

Screenplay text lives in **Fountain** (plain text, portable, git-diffable).
Everything Fountain can't express (metrics, relationships, analysis reports,
character sliders, beats) lives in a **sidecar JSON file** per episode, linked
by a stable scene ID embedded as a Fountain note:

```
INT. MORTY'S HOME - KITCHEN - LATER
[[id:scn_7f2a]]
```

Any other Fountain-compatible app ignores `[[ ]]` notes safely.

### Folder layout
```
my-project/
  project.json              # metadata, config, AI provider settings
  characters.json
  relationships.json
  episodes/
    s01e10.fountain          # the actual screenplay, plain text
    s01e10.meta.json         # metrics, beats, analysis reports — linked by scene ID
  versions/
    s01e10/2026-08-18.fountain
```

## Platform Strategy

1. **MVP:** PWA (installable, offline-capable), no backend.
2. **Near-term:** Tauri desktop build (same codebase) to solve the File
   System Access API browser gap and add OS keychain support.
3. **Not planned for MVP:** any server-side component. If sync/collaboration
   is added later, it must remain opt-in and never a requirement for core
   functionality.
