# CLAUDE.md

Guidance for AI agents (and humans) working in `mochi.js`.

## What this is

`mochi.js` is the public JS/TS monorepo for Mochi's client libraries (Console Labs). pnpm + turbo workspace. Five published packages under `packages/`:

| Package | npm | Purpose |
|---|---|---|
| mochi-formatter | `@consolelabs/mochi-formatter` | text + digit formatters and markdown components for Discord/Telegram output |
| mochi-rest | `@consolelabs/mochi-rest` | typed SDK for the Mochi API, with response-schema validation |
| mochi-id | `@consolelabs/mochi-id` | Mochi identity helpers |
| mochi-number | `@consolelabs/mochi-number` | number formatting |
| mochi-mock | `@consolelabs/mochi-mock` | mock data for tests |

## Commands

- Install: `pnpm install` (pnpm 8.6.10, see `packageManager`)
- Build: `pnpm build` (turbo)
- Lint: `pnpm lint` (eslint) · Format: `pnpm format` (prettier)
- Test: `pnpm test` (turbo)
- Release: changesets (`.changeset/`) -> `pnpm release` (publishes to npm `--access public`)

## Conventions

- One concern per package; shared config at root. Changesets drive versioning + the changelog; add a changeset for any package-facing change.
- Git hooks via lefthook + husky. Prettier + eslint enforced.
- Published packages: a breaking change to a package's public API needs a major changeset.

## Security / quality (added by the consolidation hardening pass, 2026-06-25)

- Secret scan: `gitleaks detect` (clean as of 2026-06-25).
- Dependency audit: `pnpm audit` surfaces transitive vulns (66 as of 2026-06-25: 1 critical, 31 high). See `docs/SECURITY-AUDIT-2026-06-25.md`. Do NOT blind-bump: there is no test coverage to verify a transitive upgrade does not break the published SDK. Bump deliberately, per package, with a changeset and a manual smoke.
- CI (`.github/workflows/ci.yaml`) runs build + lint + test + gitleaks + `pnpm audit` on PRs.

<!-- kit:adopt -->
## Operating layer (dwarves-kit)

@AGENTS.md

Before touching code, classify the lane: `bash dwarves-kit/lib/lane-classify.sh classify "<task>"`.
A full-lane change records its gates via `dwarves-kit/lib/gate-ledger.sh` or the ship-gate blocks the push.
<!-- /kit:adopt -->
