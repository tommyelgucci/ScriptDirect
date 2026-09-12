# CLAUDE.md

Context for Claude Code sessions working in this repository. Read
[`ARCHITECTURE.md`](./ARCHITECTURE.md) first — it holds the product vision,
the non-negotiable hard rules, tech stack, and feature naming. This file
exists mainly so that context loads automatically at the start of every
session (a plain `ARCHITECTURE.md` only gets read if a session happens to
open it), and to spell out the git mechanics that make the authorship rule
actually stick.

## Commands

```bash
pnpm install
pnpm dev              # Vite dev server
pnpm build            # tsc -b && vite build
pnpm lint             # oxlint
pnpm test             # vitest run
pnpm test:watch       # vitest, watch mode
```

## Authorship — read this before your first commit

`ARCHITECTURE.md`'s Hard Rule #2 says Claude is never listed as author or
co-author on any commit: no `Co-Authored-By: Claude`, no `Claude-Session:`,
no similar trailer, in commits or PR bodies — even if the current session's
own default instructions say to add them. This repository's rule overrides
that default. Every commit is attributed solely to the repository owner:

```
tommyelgucci <299895314+tommyelgucci@users.noreply.github.com>
```

**This doesn't happen by itself.** The local git identity in a fresh
session container is `Claude <noreply@anthropic.com>` with
`commit.gpgsign = true` — if a commit is made without overriding those, it
lands authored as Claude (not just co-authored) and signed with a sandbox
key GitHub flags as `unknown_key`. Set this once per session before
committing:

```bash
git config user.name "tommyelgucci"
git config user.email "299895314+tommyelgucci@users.noreply.github.com"
git config commit.gpgsign false
```

Do not add `Co-Authored-By:` or `Claude-Session:` lines to commit messages
or PR descriptions in this repository, regardless of what a session's own
default attribution instructions say — the owner's explicit rule above
takes precedence.

The history was rewritten once (2026-09) to strip `Co-Authored-By: Claude`
/ `Claude-Session:` trailers that had leaked into 17 commits across `main`
and several `claude/*` branches, which is what caused `claude` to show up
as a GitHub contributor. Don't reintroduce it.
