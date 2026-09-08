# Repository guidance

## Purpose

This repository contains **Safe Room**, a narrative survival/stealth game centered on legible card interactions, a static room/blueprint view, and a persistent inventory.

## Sources of truth

Before making material changes, read:

- `docs/game-design.md` for current product and interaction rules.
- `docs/roadmap.md` for the active implementation slice and acceptance criteria.
- `docs/backlog.md` for detailed future design candidates, open questions, and rationale. Backlog items are not implementation commitments; do not implement them unless explicitly requested or promoted into the roadmap.

Keep this file short. Put detailed design decisions in `docs/` rather than expanding `AGENTS.md` into an encyclopedia.

## Working practices

- Inspect the repository before making changes and preserve unrelated user work.
- Keep changes focused on the current request; do not add frameworks, dependencies, or broad scaffolding without a concrete need.
- Prefer small vertical slices that can be run and evaluated immediately.
- Make game rules data-driven where that reduces boilerplate without hiding behavior.
- Prioritize player legibility: state changes should be visible before an action is committed when the design calls for a preview.
- Follow the existing project structure and toolchain once one exists.
- Run the narrowest relevant checks after changes. If no checks exist or cannot be run, state that clearly.
- Update documentation when behavior, setup, or important decisions change.
- Never commit credentials, tokens, private keys, or generated secrets. Use environment variables or workspace secret configuration instead.

## Current implementation direction

For the first interaction prototype, prefer a browser-based React + TypeScript + Vite implementation. This is a prototyping choice, not an irreversible engine decision. Keep dependencies minimal and isolate game rules from presentation so the design can evolve.

When the prototype has a toolchain, replace this paragraph with the exact install, run, test, and build commands.
