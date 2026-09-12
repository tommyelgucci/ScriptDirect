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

## Competitive landscape check (2026-09-12)

A screenwriter (Antonio Orozco Garcin, unaffiliated) posted a 2+ year, close-
to-beta screenwriting tool in a Facebook screenwriter group, aimed at the
same audience with the same "AI assists, human keeps IP control" framing
as this project's Vision statement. Worth being honest about which of
`ARCHITECTURE.md`'s Differentiators still hold up against it, based only on
what's visible in his public posts/screenshots/comments — no access to his
actual code:

| Differentiator | Status | Evidence |
|---|---|---|
| Spanish-first market | **Neutralized** | His UI ships in Spanish (and English); marketed directly in a Spanish-language screenwriter community. |
| Local-first / offline | **Neutralized** | His own words: "es offline y no hay nube... se requiere intervención humana todo el tiempo para tener la propiedad intelectual completa." |
| BYOK | **Neutralized** | His own words: "puedes configurar tus ias personales o las que tu consideres por API." |
| No vendor lock-in (Fountain) | **Unconfirmed either way** | No screenshot shows his storage format. The one differentiator we can still credibly claim, but unverified that he lacks it too. |
| Pulso (per-scene emotional/tension metrics) | **Neutralized, arguably surpassed** | His "Analysis" screen already charts Emotional Intensity, Attention Capture, Dramatic Tension, and "Potencial Comercial" per scene, plus an emotion-palette timeline — more metrics than Pulso ships today. |

Also already matched by his tool, beyond the original differentiator list:
multi-episode/season structure (his version dropdown lists episodes per
season the same way), and version control with named snapshots and a
compare-versions view (more built-out than our version-history feature).

**Conclusion:** most of the original differentiator list no longer holds as
unique — it describes what a working product in this space needs to have,
not what makes this one different. Before investing further in feature
parity, the honest options are: (a) find and validate a real, distinct
wedge (Fountain/open-format interop is the only unverified candidate left;
true native desktop distribution via Tauri, vs. his browser-installable
PWA, is another untested one), or (b) accept this is now a race decided by
execution and timing rather than unique features, and decide deliberately
whether that's still worth it. Not decided yet — flagging it so the next
session doesn't keep building against a differentiator list that's already
stale.

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
