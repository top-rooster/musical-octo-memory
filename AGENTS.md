# Repository guidance

## Purpose

This repository contains **Safe Room**, a narrative survival/stealth game centered on legible card interactions, a static room/blueprint view, and a persistent inventory.

## Sources of truth

Before making material changes, read:

- `docs/game-design.md` for current product and interaction context.
- `docs/roadmap.md` for the active implementation slice and acceptance criteria.
- `docs/backlog.md` for the design decision register, future candidates, open questions, priorities, and rationale.
- `docs/data-language.md` for the authoring rules for card data and level design.

The status labels in `docs/backlog.md` are authoritative for design ownership.

- **DECIDED BY SIMON** means an explicit design decision and may be treated as a constraint.
- **OPEN - SIMON TO DECIDE**, **DEFERRED**, and **SUGGESTED BY CHATGPT** are not design commitments.
- Never promote a suggestion or open question into an accepted design rule merely because it appears in repository documentation.
- Backlog items are not implementation commitments; implement them only when explicitly requested or promoted into `docs/roadmap.md`.
- Older focused design notes may remain in `docs/` for history, but they do not override the four sources of truth listed above.

Keep this file short. Put detailed design decisions in `docs/` rather than expanding `AGENTS.md` into an encyclopedia.

## Working practices

- Inspect the repository before making changes and preserve unrelated user work.
- Keep changes focused on the current request; do not add frameworks, dependencies, or broad scaffolding without a concrete need.
- Prefer small vertical slices that can be run and evaluated immediately.
- Card master data belongs in the project's text data files, not duplicated as TypeScript/React constants. Code may parse, validate, and transform that data into runtime structures.
- Authored level design is also a product-level text-data requirement, but follow `docs/roadmap.md` for milestone-specific scope. **Milestone 1 explicitly generates its temporary starting Room population from loaded card masters and must not invent or implement level-data syntax yet.**
- Preserve the terse, low-boilerplate, phone-friendly authoring direction in `docs/data-language.md`; do not replace it with JSON, YAML, TOON, or another verbose object format for convenience.
- Prioritize player legibility: state changes should be visible before an action is committed when the design calls for a preview.
- Follow the existing project structure and toolchain once one exists.
- Run the narrowest relevant checks after changes. If no checks exist or cannot be run, state that clearly.
- Update documentation when behavior, setup, or important decisions change.
- Never commit credentials, tokens, private keys, or generated secrets. Use environment variables or workspace secret configuration instead.

## Toolchain

The Milestone 1 prototype uses React, TypeScript, Vite, Vitest, and pnpm. This is a prototyping choice, not an irreversible engine decision. Keep dependencies minimal and isolate game rules from presentation so the design can evolve.

- Install: `pnpm install`
- Run: `pnpm dev`
- Test: `pnpm test`
- Build: `pnpm build`
