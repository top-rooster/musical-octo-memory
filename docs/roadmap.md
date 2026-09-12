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

The baseline exposed architecture and UI issues that are now intentionally being corrected before adding more gameplay breadth.

### JSON authored-data migration
**Status: COMPLETE AND MERGED**

PR #7 moved runtime authored data to strict JSON, removed the old TXT runtime parsers/data, centralized JSON loading/validation, preserved the temporary travel compatibility adapter, and added a capability gate so unsupported Actions cannot partially execute.

That compatibility model is intentionally temporary. The next pass replaces it with the current attribute-driven Action model.

---

# Current implementation pass - Action, attribute, and time foundation

**Priority: NOW**

Do this before adding more survival, crafting, NPC, stealth, or narrative systems.

## 1. Implement the current trigger-based Action model

Replace the temporary receiver-owned `accept` representation with the design in `docs/action-process-model.md`.

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` matches the received card from an Action on accepted;
- `receive` matches the accepted card from an Action on received;
- trigger selectors may match card IDs, Markers, and attribute presence, including conjunctive combinations;
- effect targets use `accepted` and `received` roles;
- 0 matches means no Action;
- exactly 1 match starts the Action;
- 2+ matches are invalid authored data.

Authored-data validation must detect overlapping Action match domains and report the conflicting card IDs and Action definitions. Runtime resolution must guard against ambiguity as a safety net.

## 2. Add structured card attributes

Support card attributes that carry authored payload beyond Marker presence or a single numeric Value.

Implement the three concrete attributes currently decided:

### Path

A route/passage card has a `path` attribute containing:

- target Room ID;
- travel time.

Body owns one generic Travel Action triggered when Body is dropped on a card carrying `path`.

Travel reads destination and duration from Path. Do not duplicate destination/time in room data, a route-specific Action, or a separate `go` effect.

### Food

An edible card has a `food` attribute containing the concrete completion effects of eating it.

Body owns one generic Eat Action triggered when Body receives a card carrying `food`.

Do not put a growing list of edible card IDs or item-specific food effects on Body.

### Hydration and Contains Water

A card that can provide hydration has a `hydration` attribute containing the concrete completion effects of drinking from it.

Current water presence is represented by the mutable Marker `contains-water`.

Body owns one generic Drink Action. Its trigger requires the incoming card to satisfy the water-state requirement, including `contains-water`, and the current model also requires the `hydration` attribute that supplies the effect payload.

`hydration` does not replace `contains-water`. An empty container may retain its hydration behavior payload while becoming non-drinkable because `contains-water` has been removed. Refilling restores `contains-water` and makes the interaction legal again.

Do not duplicate drink effects on Body.

The general principle is:

> Action = what Nadir does. Triggering card state/attributes = the concrete eligibility and data/effects contributed by the object.

Do not generalize this into a broad scripting system beyond the concrete needs above.

## 3. Build one generic Action executor

Action execution must be atomic: either every required effect is supported and the Action executes, or the Action is not executable.

The existing capability gate from PR #7 should remain effective until the generic executor supports the authored effect set.

Only one Action may execute at a time.

Normal Action effects execute at completion, not once per world tick.

An Action must resolve an explicit duration when it starts. There is no default duration. The duration may be authored on the Action or supplied by its triggering attribute; Travel specifically uses `path.time`.

## 4. Centralize world-time advancement

Only Actions advance world time.

All time-consuming Action paths must use one centralized time-advance mechanism. This includes:

- card Actions;
- Travel;
- Search;
- future Action types.

While one Action executes, world time crosses zero or more global quarter-hour boundaries. Each crossed boundary causes one world tick.

If Action completion falls exactly on a world-tick boundary, resolve the world tick first and Action completion second.

## 5. Implement the global Process model

Processes have no private interval, countdown, or duration.

Remove Process timing fields such as `interval`, `intervalMinutes`, or any equivalent per-Process clock.

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

Finite/staged Processes use card state, effects, and conditions/thresholds rather than independent timers.

## 6. Support Hidden Values

Cards may have player-facing Values and non-player-facing Hidden Values.

Hidden Values:

- are numeric card-instance state;
- use stable IDs;
- clone independently from master state and support instance overrides;
- may be used by Actions, Processes, and conditions;
- do not automatically appear in player UI;
- do not require player-facing metadata unless later made visible.

Do not invent generic Hidden Value bounds/clamping or Stack behavior until those details are decided.

## 7. Remove travel compatibility code

Once Path + Travel work through the generic Action system:

- remove `CardInstance.travel`;
- remove derived travel compatibility adapters;
- remove hardcoded accepted-Body travel checks;
- keep route-card identity separate where distinct world passages require separate masters.

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

Whether Hidden Values additionally prevent Stack remains undecided.

## 11. Implement Puddle filling after its Action duration is decided

Puddle of Water:

- Anchored;
- visible `water = 3` Value.

An empty container is a card with `container` and without `contains-water`.

A successful fill:

- adds `contains-water` to the container;
- decreases Puddle water by 1;
- discards the Puddle when water reaches 0.

`contains-water` is part of the Drink trigger; filling restores the mutable water-present state that makes the container a legal Drink source.

Do not invent the fill Action duration; it remains open.

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
- enlarge player-facing attributes and Value numbers;
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

- Body, Mind, and Spirit remain the persistent Nadir-state card model; no generic Nadir card is introduced;
- card-on-card interactions use the trigger-based Action model with ambiguity validation;
- Path, Food, and Hydration attributes follow the current ownership model;
- Drink legality includes `contains-water` as current water state;
- Body has generic Travel, Eat, and Drink Actions rather than item-specific lists;
- Action execution is atomic;
- only one Action may execute at a time;
- all time-consuming Actions use centralized world-time advancement;
- Processes have no individual timers and all active Processes update on global 15-minute ticks;
- world tick resolves before Action completion when both occur at the same timestamp;
- Hydration visibly updates on crossed world ticks;
- Hidden Values can exist as non-player-facing card-instance state;
- the temporary travel adapter is removed;
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

Do not expand the game merely because infrastructure supports it.

The next milestone should be chosen from concrete gameplay needs after the corrected Milestone 2 slice is played again.

Likely future areas already present in the design include:

- richer survival Processes;
- wounds, healing, Fever, and spoilage;
- crafting and sterilization;
- noise and machinery;
- more Search/world content;
- NPC schedules and stealth/search-team systems;
- narrative progression and Nadir's notes.

These are not automatically the next implementation milestone.

---

# Roadmap ownership

- Simon decides product/design direction and milestone priority.
- ChatGPT maintains roadmap/backlog when design decisions change.
- Codex implements the agreed scope and updates technical/focused documentation to match code.
- Codex must not silently promote suggestions or unresolved backlog items into decided gameplay.
