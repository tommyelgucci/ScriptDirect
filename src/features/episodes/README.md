# episodes

Multi-episode/season support. A project folder's `episodes/` directory can
hold more than one `.fountain` file — this feature lets the writer see,
create, and switch between them, rather than always opening the single
`script.fountain` file from before this existed.

- `EpisodesScreen.tsx` — lists every episode fountain file already in the
  project (via `ProjectFileSystem.listEpisodeFountainFileNames()`), and a
  small form to create a new one from a season + episode number. Opening or
  creating an episode calls `useAppStore`'s `setEpisodeFileName` and
  navigates to `/editor` — no new file is written upfront; Bitácora already
  tolerates a missing `.fountain` file on first load and creates it on
  first autosave.
- `episodeFileName.ts` — pure helpers for the `sNNeNN.fountain` naming
  convention from `ARCHITECTURE.md`: formatting a season/episode pair into
  a file name, parsing one back out, and a human-readable label for the
  list (falling back to the raw file name for a legacy single-script
  project, or any file that doesn't follow the convention).

`HomeScreen` now navigates here after opening a project folder, instead of
straight to `/editor`. There is no separate episode registry file — the
list of episodes is always read directly from disk, matching this project's
local-first, folder-is-the-database design; the richer `Episode` entity in
`entities/episode.ts` (title, explicit ordering) isn't used yet.
