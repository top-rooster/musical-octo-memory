# Safe Room - implementation roadmap

This roadmap tracks implementation order, not design history.

Detailed design decisions live in focused docs and `docs/backlog.md`. Git history preserves older milestone contracts.

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
- cards, rooms, Markers, and Values use stable IDs;
- remove obsolete custom parsers when migration is complete;
- move unresolved data comments/TODOs into `docs/backlog.md`.

## 2. Clarify data ownership

`cards.json` owns card behavior and card-master state.

`rooms.json` owns room/world composition and card-instance placement/state overrides.

`attributes.json` owns player-facing attribute metadata.

Room data must not encode card behavior merely because a card instance exists in a room.

## 3. Make travel fully card-driven

Remove travel destination/time behavior from room data.

Route-card masters define:

- which card they accept;
- Action duration;
- destination effect.

Remove hardcoded runtime assumptions that travel always means dragging Body onto an object with a travel field.

Use separate card IDs for routes with different behavior even when they share the same visible name and art.

Current examples:

- `go-tunnels-from-office` - visible name `Go to tunnels`, 15m
- `go-tunnels-from-deep-tunnels` - visible name `Go to tunnels`, 30m

## 4. Implement real Process execution

Centralize world-time advancement.

Only Actions advance world time.

All active Processes update only when world time crosses a global quarter-hour boundary:

- `:00`
- `:15`
- `:30`
- `:45`

Tick count for an Action is equivalent to:

`floor(newElapsedMinutes / 15) - floor(oldElapsedMinutes / 15)`

Search, travel, and future time-consuming Actions must all use the same time-advance path so no Action can bypass Processes.

### First concrete recurring Process

Body:

- starts Hydration 50;
- every global Process tick applies Hydration -2;
- Hydration 0 is game over;
- do not invent Satiation decay yet.

The Process model must leave room for both recurring and finite Processes without implementing unfinished mechanics prematurely.

## 5. Correct the opening scene

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

## 6. Equipment correction

Replace `Neck` with:

- Trinket 1
- Trinket 2

Keep universal Hand behavior:

- ordinary movable items may go in either Hand;
- Anchored world cards and Nadir-state cards may not;
- Hand placement does not require authored `equip Hand`;
- special effects still require their authored activation condition;
- held cards do not consume carried capacity.

## 7. Correct Stack semantics

There is never a Stack Marker.

Cards may Stack only when:

- same master ID;
- same Marker-ID set;
- neither card contains any Value attributes.

Cards with Values never Stack, even when current numbers match.

Stack remains Room-only visual organization with separate underlying instances.

## 8. Implement Puddle filling

Puddle of Water:

- Anchored;
- visible `water = 3` Value.

An empty container is a card with `container` and without `contains-water`.

A successful fill:

- adds `contains-water` to the container;
- decreases Puddle water by 1;
- discards the Puddle when water reaches 0.

Do not invent the Action duration for filling; it remains open in the backlog.

## 9. Correct Deep Tunnels Flashlight state

- Opening Flashlight remains Battery 20.
- Deep Tunnels Search Flashlight starts Battery 0.
- Battery drain rate remains undecided and must not be invented.

## 10. UI legibility correction

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

- JSON migration is complete;
- obsolete text parsers/data are removed where no longer needed;
- travel behavior is card-authored rather than room-authored/hardcoded;
- all time-consuming Actions use centralized time advancement;
- Hydration visibly updates on crossed global quarter-hours;
- Opening Room no longer exposes Body/Mind/Spirit;
- Stack, equipment, Puddle, and Flashlight corrections work;
- UI issues above are manually browser-verified;
- focused technical documentation matches the implementation;
- unresolved design values are recorded in `docs/backlog.md` rather than invented;
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
