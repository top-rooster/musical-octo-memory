# Safe Room - implementation roadmap

This roadmap tracks implementation order, not design history.

Detailed design decisions live in focused docs and `docs/backlog.md`. The current Action/Process contract is in `docs/action-process-model.md`. Git history preserves older milestone contracts.

## Current status

### Milestone 1 - core card interaction prototype
**Status: COMPLETE**

Validated the basic interaction language:

- React + TypeScript + Vite browser prototype;
- Room and Inventory zones;
- authored card masters;
- drag/drop and legal-target feedback;
- Anchored behavior;
- card-on-card interactions;
- Value preview/clamping;
- food consumption;
- collision rejection and exact-origin restoration.

Milestone 1 rules that were later superseded must not be treated as current design. In particular, the old generic five-card Inventory capacity and the old custom text-data direction are obsolete.

### Milestone 2 - playable world slice
**Status: BASELINE COMPLETE AND MERGED TO `main`**

The merged baseline established:

- opening evacuation/loadout scene;
- persistent rooms;
- Search decks;
- room discovery and travel;
- Vision and room lighting;
- equipment and carried storage;
- opening item selection;
- Flashlight/Glasses Vision effects;
- room-local Search content;
- GitHub Pages deployment workflow;
- automated test/build coverage for the implemented slice.

The baseline exposed several architecture and UI issues that are now intentionally being corrected before adding more game breadth.

---

# Current implementation pass - Milestone 2 correction and foundation cleanup

**Priority: NOW**

Do this before adding more survival, crafting, NPC, stealth, or narrative systems.

## 1. Replace custom runtime text formats with JSON

Migrate:

- `data/cards.txt` -> `data/cards.json`
- `data/rooms.txt` -> `data/rooms.json`
- `data/attributes.txt` -> `data/attributes.json`

Requirements:

- valid JSON only;
- no JSONC/comments in runtime files;
- stable lowercase kebab-case IDs;
- IDs separate from display names;
- cards, rooms, Markers, Values, and Hidden Values use stable IDs;
- remove obsolete custom parsers when migration is complete;
- move unresolved data comments/TODOs into design docs/backlog.

## 2. Keep data ownership explicit

`cards.json` owns card behavior and card-master state.

`rooms.json` owns room/world composition and card-instance placement/state overrides.

`attributes.json` owns player-facing attribute metadata.

Room data must not encode card behavior merely because a card instance exists in a room.

## 3. Implement the trigger-based Action model

Replace the temporary receiver-owned `accept` representation with the decided Action model in `docs/action-process-model.md`.

For card-on-card drag/drop:

- the dragged card is `accepted`;
- the card underneath is `received`;
- an Action authored on accepted may use trigger `on` to match received;
- an Action authored on received may use trigger `receive` to match accepted;
- `requires` describes state required on the Action-owning card;
- effect targets use `accepted` and `received` roles.

There is no separate `accept` gameplay concept.

At drag-end:

- 0 matching Actions means no interaction;
- exactly 1 matching Action starts;
- 2+ matching Actions are invalid authored data.

Authored-data validation must detect overlapping Action matches and report the conflicting card IDs and Action definitions. Runtime resolution must also guard against ambiguity.

Consumable behavior belongs primarily on the consumable card. Do not turn Body into a registry containing every item that may be consumed.

## 4. Add Action execution and centralized world-time advancement

Only one Action may execute at a time.

Every Action has an explicit duration; instant Actions use `0m`.

Normal Action effects execute at Action completion, not once per world tick.

All time-consuming Action paths must use one centralized time-advance mechanism. This includes card Actions, travel, Search, and future Action types.

While an Action executes, world time crosses zero or more global quarter-hour boundaries. Each crossed boundary causes one world tick.

If Action completion falls exactly on a world-tick boundary, the world tick resolves first and Action completion occurs afterward.

## 5. Implement the global Process model

Processes have no private interval, countdown, or duration.

Remove Process timing fields such as:

- `interval`;
- `intervalMinutes`;
- any equivalent per-Process clock.

Every active Process updates exactly once on every global world tick:

- `:00`
- `:15`
- `:30`
- `:45`

Many Processes may be active while the one Action executes.

All active Processes participate in one world update. JSON ordering must not become gameplay ordering.

### First concrete Process

Body:

- starts Hydration 50;
- each global world tick applies Hydration -2;
- Hydration 0 is game over;
- do not invent Satiation decay.

Finite/staged Processes should use card state, effects, and conditions/thresholds instead of acquiring independent timers.

## 6. Support Hidden Values as card-local internal state

Cards may have player-facing Values and non-player-facing Hidden Values.

Hidden Values:

- are numeric state owned by the card instance;
- use stable IDs;
- clone independently from master state and support instance overrides;
- may be used by Actions, Processes, and conditions;
- do not automatically appear in player UI;
- do not require `attributes.json` metadata unless later made visible.

Do not invent generic Hidden Value bounds/clamping or Stack behavior until those details are decided.

## 7. Make travel use the Action model directly

Route-card masters own their trigger, Action duration, and destination effect.

A route that receives Body may express that through `trigger.receive` rather than room-authored travel metadata or hardcoded Body checks.

Remove the temporary `CardInstance.travel` compatibility adapter once generic Action execution can perform travel faithfully.

Use separate card IDs for routes with different behavior even when they share the same visible name and art.

Current examples:

- `go-tunnels-from-office` - visible name `Go to tunnels`, 15m;
- `go-tunnels-from-deep-tunnels` - visible name `Go to tunnels`, 30m.

## 8. Correct the opening scene

Treat the opening as a loadout-selection interlude rather than normal survival simulation.

During Opening Room:

- Body, Mind, and Spirit are not visible/usable;
- Vision/survival-state UI is hidden;
- offered items may be carried/equipped;
- equipment management remains free;
- five-item take limit remains;
- held/equipped offered items count toward five;
- Escape remains available.

Body, Mind, Spirit, and normal survival simulation begin on entering Tunnels.

## 9. Equipment correction

Replace `Neck` with:

- Trinket 1
- Trinket 2

Keep universal Hand behavior:

- ordinary movable items may go in either Hand;
- Anchored world cards and Nadir-state cards may not;
- Hand placement does not require authored `equip Hand`;
- special effects still require their authored activation condition;
- held cards do not consume carried capacity.

## 10. Correct Stack semantics

There is never a Stack Marker.

Current decided visible-state rule:

- same master ID;
- same Marker-ID set;
- cards containing visible Value attributes do not Stack;
- Stack is Room-only presentation and underlying instances remain separate.

Whether Hidden Values additionally prevent Stack is still a design question and must not be invented during implementation.

## 11. Implement Puddle filling after its Action duration is decided

Puddle of Water:

- Anchored;
- visible `water = 3` Value.

An empty container is a card with `container` and without `contains-water`.

A successful fill:

- adds `contains-water` to the container;
- decreases Puddle water by 1;
- discards the Puddle when water reaches 0.

Do not invent the Action duration for filling; it remains open.

## 12. Preserve decided Flashlight instance state

- Opening Flashlight remains Battery 20.
- Deep Tunnels Search Flashlight starts Battery 0.
- Battery drain rate remains undecided and must not be invented.

## 13. UI legibility correction

### Equipment area

- make equipment targets visibly larger;
- keep slot labels readable while dragging;
- keep legal/interaction highlight visible under drag preview;
- prefer reduced equipment-preview card scale when hovering equipment targets;
- ensure the player can tell exactly which slot will receive the card.

### Inventory divider

- reserve actual layout space for the `Inventory & equipment` header/divider;
- content/placement bounds begin below it;
- no card may render partly underneath it.

### Cards

- reduce bright-white visual dominance;
- enlarge Marker icons;
- enlarge Value presentation and numbers;
- make basic mechanical state readable without mouseover.

### Room backgrounds

- reduce visual dominance;
- avoid obvious enlargement/cropping where practical;
- preserve aspect ratio;
- lower brightness/saturation/contrast and/or use a subtle dark overlay;
- do not regenerate or edit source art in this pass.

Desired hierarchy:

1. cards and interaction feedback;
2. room UI;
3. background artwork.

---

# Completion gate for the current correction pass

Do not consider the pass complete until:

- JSON migration is complete and obsolete text parsers/data are removed;
- stable IDs remain runtime identity rather than display-name lookups;
- card-on-card interactions use the trigger-based Action model with ambiguity validation;
- only one Action may execute at a time;
- all time-consuming Actions use centralized world-time advancement;
- Processes have no individual timers and all active Processes update on global 15-minute ticks;
- world tick resolves before Action completion when both occur at the same timestamp;
- Hydration visibly updates on crossed world ticks;
- Hidden Values can exist as non-player-facing card-instance state;
- travel uses generic Action behavior rather than room-authored/hardcoded travel behavior;
- Opening Room no longer exposes Body/Mind/Spirit;
- Stack, equipment, Puddle, and Flashlight corrections obey current design decisions;
- UI issues above are manually browser-verified;
- focused technical documentation matches implementation;
- unresolved design values are recorded rather than invented;
- `pnpm test` passes;
- `pnpm build` passes.

The correction work should be developed on a dedicated branch and reviewed before merging to `main`.

---

# After the correction pass

Do not expand the game merely because infrastructure now supports it.

The next milestone should be chosen from concrete gameplay needs after the corrected Milestone 2 slice is played again.

Likely future areas already present in the design include:

- richer survival Processes;
- wounds, healing, Fever, and spoilage;
- crafting and sterilization;
- noise and machinery;
- more Search/world content;
- NPC schedules and stealth/search-team systems;
- narrative progression and Nadir's notes.

These are not automatically the next implementation milestone. Their exact order remains a design/roadmap decision after the current correction pass.

---

# Roadmap ownership

- Simon decides product/design direction and milestone priority.
- ChatGPT maintains roadmap/backlog when design decisions change.
- Codex implements the agreed scope and updates technical/focused documentation to match code.
- Codex must not silently promote suggestions or unresolved backlog items into decided gameplay.
