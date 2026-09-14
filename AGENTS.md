# Repository operating guide

## Documentation authority

Read the active Markdown files before material work. Their authority is:

1. `docs/next-iteration.md` is the only source of current implementation scope. It contains task IDs only.
2. `docs/backlog.md` is the single detailed authority for approved rules, tasks, acceptance criteria, implementation status, open questions, suggestions, superseded decisions, and useful history. Completed tasks remain there.
3. `docs/game-design.md` describes Safe Room only at a high level. It is not authority for detailed mechanics or implementation scope.
4. Runtime JSON is authored content and implementation input, not evidence that Simon approved an undocumented design choice.

Git is the archive. Do not create milestone, history, roadmap, or parallel detailed-design Markdown files. Keep active documentation within this four-file structure.

## Mandatory scope validation

Before implementing anything from `docs/next-iteration.md`:

1. read every task ID in the file;
2. find exactly one matching task in `docs/backlog.md`;
3. verify that its `Decision` is exactly `APPROVED BY SIMON`.

If any ID is missing, duplicated/ambiguous, or not approved, **STOP IMMEDIATELY**. Do not modify source code or data. Do not guess approval, substitute another task, or silently remove the invalid ID. Report the inconsistency to Simon.

Only listed IDs are scope. Priority, approval, importance, or implementation status does not independently put a task in scope.

## Design discipline

- Simon owns design decisions. `QUESTION FOR SIMON` and `SUGGESTED BY CHATGPT` are never requirements and cannot be implemented as decisions.
- Each detailed rule has one authoritative backlog-task owner. Cross-reference that task instead of copying competing specifications.
- Never invent JSON fields, structures, wrappers, or datatypes. If approved requirements do not fit the approved schema, record or update a `QUESTION FOR SIMON` task and stop that part of the implementation.
- Treat code as evidence of implementation status, not design approval. When code and approved design differ, document the discrepancy rather than redefining the rule.
- If implementation exposes a design hole, update the backlog with a question instead of silently choosing behavior. Record material implementation discoveries and status changes in the owning task.
- Preserve unrelated user work and keep changes within validated scope. Do not add frameworks or broad abstractions without a concrete approved need.
- Card masters and behavior belong in `data/cards.json`; world composition and instances belong in `data/rooms.json`; shared attribute presentation belongs in `data/attributes.json`. Do not duplicate authored content in components.
- Keep game rules and state transitions separate from React rendering where practical.

## Verification and delivery

The prototype uses React, TypeScript, Vite, Vitest, and pnpm.

- Install: `pnpm install`
- Run locally: `pnpm dev`
- Test: `pnpm test`
- Build: `pnpm build`

Run focused checks during implementation. At the end of every code or data iteration, run the full tests and production build. Such iterations must also satisfy the GitHub Pages verification in `DEPLOY-01`, including a successful workflow and a deployed build that loads and supports testing the implemented behavior. Documentation-only iterations do not require a Pages deployment.

Never commit credentials, tokens, private keys, generated secrets, dependency directories, build output, or temporary local backups.
