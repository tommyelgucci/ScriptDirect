# ScriptDirect — Roadmap

## Guiding principle

The MVP must prove the full loop — **write → save locally → get AI
analysis** — with one feature done well, rather than five features done
halfway. Everything visually impressive but not load-bearing for the core
differentiators (Spanish-first, local-first, BYOK) is deferred.

## MVP (v1)

### Bitácora (editor)
- Create/open project = pick a local folder
- Block editor: Heading, Action, Character, Dialogue, Parenthetical
- Final-Draft-style keyboard flow (Tab to cycle block type)
- Autosave to `.fountain`
- Scene list sidebar with navigation

### Data model foundation
- Characters and Locations with basic auto-extraction (all-caps names before
  dialogue)
- Stable per-scene IDs (`[[id:]]`)

### Brújula (AI analysis) — simple version
- "Analyze" button sends the full script to the user's configured AI
  provider (BYOK)
- Report with fixed sections: Strengths, Main Issues, What's Missing/Excess
- Each finding has a review state: unreviewed / accepted / dismissed —
  user stays in control

### Export
- PDF in standard industry format

### Settings
- Screen to paste AI provider key (Anthropic / OpenAI / Gemini)
- UI language toggle (ES / EN)

## Phase 2+ (post-MVP, in rough priority order)

1. **Tauri desktop build** — solves File System Access API browser gap,
   adds OS keychain for API keys
2. **Constelación** — character/relationship force graph (depends on solid
   character extraction from MVP)
3. **Pulso** — per-scene emotional intensity / dramatic tension metrics
   (depends on AI analysis being mature)
4. **Ruta** — act/beat structure timeline (layer on top of scene structure)
5. **Version history / compare versions**
6. **Multi-episode / season support** (MVP is single-script)
7. **Character profile sliders** (empathy, moral ambiguity, volatility, etc.)

## Explicitly out of scope for now

- Multi-user collaboration
- Any server-side component
- Mobile native apps (PWA covers mobile browser use for now)

## MVP success criteria

- A writer can create a project, write a full scene in Bitácora, close the
  app, reopen it, and find their work exactly as they left it — with zero
  network dependency for the writing itself.
- Running Brújula on a real script returns findings a working screenwriter
  would recognize as useful, not generic filler.
- No API key or script content ever touches a ScriptDirect-owned server.
