# mochi.js architecture

pnpm + turbo monorepo of Mochi's published JS/TS client libraries. Each package ships independently to npm under the `@consolelabs/` scope; versioning + changelog are driven by changesets.

```
mochi.js/
├── packages/
│   ├── mochi-formatter/   @consolelabs/mochi-formatter  text/digit formatters + markdown components (Discord/Telegram)
│   ├── mochi-rest/        @consolelabs/mochi-rest        typed SDK for the Mochi API + response-schema validation
│   ├── mochi-id/          @consolelabs/mochi-id          identity helpers
│   ├── mochi-number/      @consolelabs/mochi-number      number formatting
│   └── mochi-mock/        @consolelabs/mochi-mock        mock data for tests
├── .changeset/            changesets (version + changelog source of truth)
├── turbo.json             turbo task graph (build/dev/lint/test)
├── pnpm-workspace.yaml    workspace globs
└── .github/workflows/     CI (rebuild trigger + the hardening CI added 2026-06-25)
```

## Dependency direction

`mochi-rest` and the formatter components consume the lower-level helpers (`mochi-number`, `mochi-id`); `mochi-mock` is test-only. Consumers (the Discord/Telegram bots, web) import the published packages, not this repo directly.

## Build / release flow

`pnpm build` runs turbo across packages (topologically). Release: a changeset per change -> `pnpm release` publishes the bumped packages to npm with public access. A push to `main` also fires `.github/workflows/trigger.yaml` to rebuild the Mochi Discord preview.

## Notes for agents

- This is a published-library repo: public API changes are user-facing. Treat a package's exported surface as a contract; breaking it needs a major changeset.
- No integration test harness against the live Mochi API; `mochi-rest` ships a schema validator instead. Verify changes with the package's own unit tests (`pnpm test`).
