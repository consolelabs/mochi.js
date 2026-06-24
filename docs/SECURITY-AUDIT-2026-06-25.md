# Security audit: mochi.js (2026-06-25)

Bounded security triage from the Console Labs consolidation hardening pass (mega-goal cl-github-consolidation, sub-goal 05).

## Secret scan: PASS

`gitleaks detect --no-banner` over full history (281 commits, ~2.2 MB): **no leaks found**. CI now runs gitleaks on every PR.

## Dependency audit: 66 vulns (1 critical, 31 high, 23 moderate, 11 low)

`pnpm audit` as of 2026-06-25. All are transitive (dev/build chain + SDK deps). Examples: `ws` <7.5.11 (high, memory-exhaustion DoS, GHSA-96hv-2xvq-fx4p).

### Decision: documented, NOT blind-bumped

Bounded triage fixes CRITICAL/HIGH where safe. Here it is NOT safe to auto-bump:
- The repo has **no integration test coverage** to verify a transitive upgrade does not break the five published packages.
- These are PUBLISHED libraries (`@consolelabs/*`); a bad bump ships to every consumer (the Discord/Telegram bots, web).

So a blind `pnpm update` / `pnpm audit --fix` is the riskier action. Instead:
1. CI surfaces `pnpm audit --audit-level=high` on every PR (non-blocking for now; flip to blocking once burned down).
2. This file records the baseline.
3. Remediation is a deliberate, per-package follow-up (bump + changeset + manual smoke), owned by the Mochi maintainers. Tracked as a follow-up, not done in this hardening PR.

### Reproduce

```
pnpm audit --audit-level=high          # high+critical detail
pnpm audit --json | jq .metadata.vulnerabilities
# => {"info":0,"low":11,"moderate":23,"high":31,"critical":1}
```

## What this PR changes (additive only)

- `CLAUDE.md` (repo guidance for agents), `AGENTS.md` + `WORKFLOW.md` + `docs/verification/README.md` (dwarves-kit operate-contract, advisory under non-Claude runtimes), `docs/ARCHITECTURE.md` (reindex), `.github/workflows/ci.yaml` (build/lint/test + gitleaks + audit), this audit record.
- NO source/logic change, NO dependency bump. Reviewable + reversible.
