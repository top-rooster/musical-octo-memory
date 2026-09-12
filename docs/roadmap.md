# Safe Room - implementation roadmap

This roadmap tracks implementation order, not design history.

Detailed design decisions live in focused docs and `docs/backlog.md`. The current Action/Process contract is in `docs/action-process-model.md`.

## Current status

### Milestone 1 - core card interaction prototype
**Status: COMPLETE**

Validated Room/Inventory zones, authored card masters, drag/drop, Anchored behavior, card-on-card interactions, Value previews, consumption, and exact-origin restoration.

### Milestone 2 - playable world slice
**Status: BASELINE COMPLETE AND MERGED TO `main`**

Established opening evacuation/loadout, persistent rooms, Search decks, room discovery/travel, Vision/light, equipment/storage, room-local Search content, deployment, and automated build/test coverage.

### JSON authored-data migration
**Status: COMPLETE AND MERGED**

PR #7 moved runtime authored data to strict JSON, removed old runtime text parsers/data, centralized loading/validation, and added a capability gate for unsupported Actions.

---

# Current implementation pass - Nadir, Action, attribute, and time foundation

**Priority: NOW**

Do this before adding more survival, crafting, NPC, stealth, or narrative breadth.

## 1. Consolidate Nadir into one anchored card

Replace the old persistent Body/Mind/Spirit split with one anchored `nadir` card in Inventory.

Current visible permanent Nadir Values include:

- Hydration 50;
- Satiation 50;
- Vision 4.

Conditions may remain separate anchored cards when they have their own identity/lifecycle.

Do not add a separate character sheet or duplicate these stats outside the Nadir card.

## 2. Implement the trigger-based Action model

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` matches received from an Action on accepted;
- `receive` matches accepted from an Action on received;
- selectors may match card IDs, Markers, and structured-attribute presence;
- effect targets use `accepted` and `received`;
- 0 matches means no Action;
- exactly 1 match starts it;
- 2+ matches are invalid authored data.

Authored-data validation must detect overlapping Action match domains. Runtime must still guard against ambiguity.

## 3. Implement structured attributes

### Path

A route card carries `path` with target Room ID and travel time.

Nadir owns one generic Travel Action triggered when Nadir is dropped on a card carrying `path`.

### Food

An edible card carries `food` containing the concrete completion effects of eating it.

Nadir owns one generic Eat Action triggered when Nadir receives a card carrying `food`.

### Hydration

A drinkable card carries `hydration` containing the concrete completion effects of drinking from it.

Nadir owns one generic Drink Action triggered when Nadir receives a card carrying `hydration`.

General principle:

> Action = what Nadir does. Triggering attribute = concrete data/effects contributed by the object.

## 4. Preserve direct drag previews

When a card is dragged, every legal receiving card highlights immediately.

Every understood direct Value change should be previewed on the affected card before hover/drop. For Nadir this means previews such as:

- `Satiation 67 -> 82`;
- `Hydration 50 -> 75`.

Do not hide the information needed for routine eat/drink decisions behind tooltips or invisible character-state systems.

## 5. Build one generic atomic Action executor

Only one Action executes at a time.

Every Action resolves an explicit duration. There is no default duration. Duration may come from the Action or a triggering attribute such as `path.time`.

Normal effects execute at completion.

Execution is atomic: unsupported effects mean the Action is not executable, never partially applied.

## 6. Centralize world-time advancement

Only Actions advance world time.

All card Actions, Travel, Search, and future time-consuming Actions use one centralized mechanism.

Every crossed global quarter-hour boundary runs one world tick. If completion lands exactly on a tick boundary, world tick resolves first and Action completion second.

## 7. Implement the global Process model

Processes have no private timers/intervals.

Every active Process updates once on each global `:00`, `:15`, `:30`, `:45` boundary crossed by Actions.

First concrete recurring Process:

- Nadir Hydration -2 each world tick;
- Hydration 0 is game over;
- do not invent Satiation decay yet.

## 8. Support Hidden Values without hiding routine survival information

Hidden Values may exist as internal numeric card-instance state for concrete mechanics.

They do not automatically render and do not need player-facing attribute metadata.

Do not use them to recreate opaque hunger/fullness/stomach systems or hide Nadir state the player needs for ordinary decisions.

## 9. Remove compatibility behavior

Once Path + Travel use the generic model:

- remove travel compatibility adapters;
- remove hardcoded Body travel checks;
- remove receiver-owned legacy `accept` behavior;
- migrate authored data deliberately rather than retaining obsolete compatibility fields.

## 10. Correct opening and current UI

During Opening Room, normal Nadir survival interaction/state remains hidden until Escape begins the main game in Tunnels.

Preserve current equipment/storage/opening limits and separately decided Flashlight/Puddle behavior.

UI correction remains required:

- larger readable equipment targets;
- Inventory header reserves layout space;
- larger visible card attributes/Value numbers;
- less bright-white card dominance;
- subdued room backgrounds;
- direct drag previews remain legible.

---

# Completion gate

Do not consider this pass complete until:

- one anchored Nadir card replaces persistent Body/Mind/Spirit state;
- Hydration, Satiation, and Vision are visible on Nadir;
- card interactions use trigger-based Action resolution with ambiguity validation;
- Path, Food, and Hydration use the current ownership model;
- Nadir has generic Travel, Eat, and Drink Actions;
- direct known stat previews render on affected cards during drag;
- Action execution is atomic;
- all time-consuming Actions share centralized time advancement;
- Processes update only on global 15-minute ticks;
- Hydration visibly changes as world ticks occur;
- Hidden Values exist without hiding routine survival state;
- legacy travel/accept compatibility is removed;
- UI issues are manually browser-verified;
- docs match implementation;
- unresolved values are recorded rather than invented;
- `pnpm test` passes;
- `pnpm build` passes.

The work should be developed on a dedicated branch and reviewed before merge to `main`.

## After this pass

Choose the next milestone from concrete gameplay needs after replaying the corrected slice. Likely later areas include richer survival Processes, wounds/healing, crafting, noise/machinery, more Search/world content, NPC schedules/stealth, and narrative progression.

## Ownership

- Simon decides product/design direction and milestone priority.
- ChatGPT maintains roadmap/backlog when decisions change.
- Codex implements agreed scope and updates technical/focused documentation.
- Codex must not promote suggestions or unresolved items into decided gameplay.
