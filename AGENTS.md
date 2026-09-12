# Repository guidance

## Purpose

This repository contains **Safe Room**, a narrative survival/stealth game centered on legible card interactions, a static room/blueprint view, and persistent Nadir/equipment/inventory state.

## Sources of truth

Before making material changes, read:

- `docs/milestone-2.md` for the **active implementation slice and acceptance criteria**.
- `docs/game-design.md` for broad product and interaction context.
- the focused design notes referenced by `docs/milestone-2.md` for newer decisions about opening, equipment, rooms, search, lighting/Vision, drag feedback, card inspection, and animation.
- `docs/data-language.md` for authoring rules for card and level data.
- `docs/backlog.md` for the historical decision register, future candidates, open questions, priorities, and rationale.

Design ownership still matters:

- **DECIDED BY SIMON** means an explicit design decision and may be treated as a constraint.
- **OPEN - SIMON TO DECIDE**, **DEFERRED**, and **SUGGESTED BY CHATGPT** are not design commitments.
- Never promote a suggestion or open question into an accepted design rule merely because it appears in repository documentation.

Some older broad documents still contain Milestone 1 rules that have since been explicitly superseded. For Milestone 2, when a focused design note contains an explicit **SUPERSEDES** statement, that newer focused decision overrides the older conflicting rule. Do not resurrect the old fixed five-card Inventory model, `Inventory = equipped`, or `all interactables are cards` where newer docs define equipment slots and Search decks separately.

`docs/roadmap.md` records Milestone 1. `docs/milestone-2.md` is the active code-iteration contract until Simon replaces it.

Keep this file short. Put detailed design decisions in `docs/` rather than expanding `AGENTS.md` into an encyclopedia.

## Working practices

- Inspect the repository before making changes and preserve unrelated user work.
- Keep changes focused on the active milestone; do not add frameworks, dependencies, or broad scaffolding without a concrete need.
- Prefer small vertical slices that can be run and evaluated immediately.
- Card master data belongs in `data/cards.json`, not duplicated as TypeScript/React constants. Code may validate and transform it into runtime structures.
- Milestone 2 level/world state comes from `data/rooms.json`; do not hard-code the current room graph, Search-deck compositions, Nadir cards, starting equipment, or opening offers into UI components.
- Runtime authored data is strict JSON. Keep stable lowercase kebab-case IDs separate from player-facing names and keep the schema concrete rather than inventing a generic scripting language.
- Prioritize player legibility: state changes should be visible before an action is committed when the design calls for a preview.
- Keep game-rule/state-transition code separate from React rendering where practical.
- Run the narrowest relevant checks after changes. At milestone completion run both tests and production build.
- Update documentation when behavior, setup, or important decisions change.
- Never commit credentials, tokens, private keys, or generated secrets. Use environment variables or workspace secret configuration instead.

## Toolchain

The prototype uses React, TypeScript, Vite, Vitest, and pnpm. This remains a prototyping choice rather than an irreversible engine decision.

- Install: `pnpm install`
- Run: `pnpm dev`
- Test: `pnpm test`
- Build: `pnpm build`
