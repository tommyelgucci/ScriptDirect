# constelacion

Constelación — character/relationship force graph (Neural Map equivalent).

## What's here now

`ConstelacionScreen.tsx` — simple sortable tables of the characters and
locations auto-extracted from the script (`characters.json` /
`locations.json`, written by `features/bitacora/syncCharacters.ts` and
`syncLocations.ts` on every autosave), each with its derived scene count.

This is the MVP starting point, not the final feature: ARCHITECTURE.md
names Constelación as a **force graph** (`react-force-graph-2d`, per its
Tech Stack table — 2D, not 3D/Three.js, a decision already made and kept).
The tables above are exactly the data that graph will need (nodes =
characters, edges = "shared a scene together"); the graph replaces/augments
this view once built. No relationship data (`Relationship` entity) is wired
up yet — that's what turns "shared a scene" co-occurrence into an actual
edge with a type (Family/Friendship/Romance/Rivalry/...).
