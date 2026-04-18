# ownradio — CLAUDE.md

## Core Principles
- **Simplicity & minimal impact**: touch only what's necessary; no speculative abstractions.
- **Root cause only**: no bandaids, hardcoded values, or temporary fixes. If you can't state the root cause in one sentence, keep investigating.
- **Verify before done**: prove it works (tests, logs, diffs). Would a staff engineer approve?

## Workflow
- **Plan mode** for any non-trivial task (3+ steps or architectural). If things go sideways, STOP and re-plan.
- **Subagents** for research, exploration, parallel analysis — keep main context clean.
- **Autonomous bug fixing**: given a bug, just fix it. No hand-holding.
- **Elegance check** on non-trivial changes: "is there a more elegant way?" Skip for obvious fixes.

## Skills (invoke by trigger)
- **`/pre-pr-gate`** — MANDATORY before every `git push`, PR, or merge. Runs typecheck/lint/tests, verifies Dockerfile sync, monitors CI.
- **`/claim-ticket`** — before starting any GitHub issue or touching `shared/db/migrations/`. Reads `tasks/agent-collab.md` for Active Work and Migration Reservation.
- **`/deploy-gotchas`** — before touching Dockerfiles, nginx gateway, Fastify plugins, LLM adapters, or the DJ pipeline. Load-bearing incident fixes.
- **`/agent-ops`** — when running as a daemon-spawned agent, hitting a rate limit, or needing Telegram/checkpoint/L2-memory protocols.

## Self-Improvement Loop
1. Session start: read `tasks/lessons.md`.
2. On correction/mistake: append a rule (ALWAYS/NEVER) with `[category]` tag, trigger, why, example.
3. Before completion: review work against lessons.
4. Escalation: 1st → lessons.md, 2nd → CLAUDE.md Core Principles, 3rd → automated check (test/lint/hook).

## Task Tracking
Plan in `tasks/todo.md` (checkable items), mark progress, add review section on completion.
