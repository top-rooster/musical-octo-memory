# Safe Room - implementation roadmap

This roadmap tracks implementation order, not design history.

Detailed design decisions live in focused docs and `docs/backlog.md`. The current Action/Process contract is in `docs/action-process-model.md`. Git history preserves older milestone contracts.

## Current status

### Milestone 1 - core card interaction prototype
**Status: COMPLETE**

Validated the basic Room/Inventory card workspace, drag/drop, Anchored behavior, card-on-card interactions, Value previews, food consumption, collision rejection, and exact-origin restoration.

### Milestone 2 - playable world slice
**Status: BASELINE COMPLETE AND MERGED TO `main`**

Established the opening evacuation scene, persistent rooms, Search decks, travel, Vision/light, equipment, carried storage, item selection, and deployment/test coverage.

### JSON authored-data migration
**Status: COMPLETE AND MERGED**

Runtime authored data now uses strict JSON. The current runtime still contains temporary schema/behavior inherited from the baseline that the next correction pass must replace.

---

# Next Codex iteration - Action, attribute, time, and card-model correction

**Priority: NOW**

The next Codex iteration should correct the existing slice before adding new gameplay breadth.

## Non-negotiable implementation constraints

### Do not invent JSON structure

Codex must not introduce new authored JSON fields, object shapes, arrays, wrappers, or special-purpose datatypes unless Simon explicitly asks for a new JSON structure.

Use the structures already decided and already present in the project, including:

- Markers;
- Values;
- References;
- Actions;
- Processes;
- the explicitly decided structured attributes `path`, `food`, and `hydration`.

If the existing schema cannot represent a required mechanic, stop at that point and document the missing design decision. Do not solve it by inventing syntax.

In particular, do not invent a new Reference representation. Reuse the project's existing Reference schema.

## 1. Replace the temporary card-on-card interaction model

Replace receiver-owned `accept` behavior with the trigger-based Action model from `docs/action-process-model.md`.

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` Actions belong to accepted and match received;
- `receive` Actions belong to received and match accepted;
- selectors may use card IDs, Markers, structured-attribute presence, and decided conjunctive combinations;
- effect targets use `accepted` and `received`;
- 0 matches = no Action;
- exactly 1 = execute;
- 2+ = invalid authored data.

Validation must reject overlapping Action match domains. Runtime resolution must also guard against ambiguity.

## 2. Implement the three decided structured attributes

### Path

Route cards carry `path` with destination Room and travel time.

Body owns one generic Travel Action. Body is dragged onto a card carrying `path`.

Travel reads destination and duration from Path. Remove duplicated travel destination/time behavior from legacy route handling.

### Food

Edible cards carry `food` with the concrete effects of eating them.

Body owns one generic Eat Action. Food is dropped on Body.

Do not keep item-specific Eat Actions on Body.

### Hydration and Contains Water

A card capable of providing hydration carries `hydration` with the concrete Drink effects.

Current water presence is the mutable Marker `contains-water`.

Body owns one generic Drink Action. A legal Drink source must satisfy the decided trigger including `contains-water` and the hydration behavior required by the current model.

`hydration` does not replace `contains-water`. Drinking removes the current water state as authored; refilling restores `contains-water`.

## 3. Build the generic atomic Action executor

The Action executor must:

- support the concrete effect set required by current authored behavior;
- validate that the entire Action is executable before applying any effects;
- never partially execute an unsupported/invalid Action;
- execute only one Action at a time;
- apply normal effects at Action completion;
- require an explicit/resolved duration; there is no default duration.

Do not broaden this into an unrestricted scripting engine.

## 4. Centralize world-time advancement

Only Actions advance world time.

All time-consuming paths must use the same time-advance mechanism, including:

- card Actions;
- Travel;
- Search.

The world tick grid is global at `:00`, `:15`, `:30`, and `:45`.

Every crossed boundary produces one world tick.

If an Action completes exactly on a tick boundary:

1. resolve the world tick;
2. resolve Process consequences;
3. complete the Action;
4. apply completion effects.

## 5. Implement the global Process model

Processes have no private interval/countdown/timer.

Every active Process updates once on each global world tick.

Body starts with:

- Hydration 50;
- Satiation 50.

Each global 15-minute world tick applies:

- Hydration -2;
- Satiation -1.

Hydration 0 is game over.

Remove legacy per-Process timing fields that conflict with this model.

## 6. Preserve Body / Mind / Spirit

Nadir remains represented by three persistent anchored Inventory cards:

- Body;
- Mind;
- Spirit.

Do not create a generic Nadir card.

Body holds Hydration/Satiation and the current generic physical Actions. Mind holds Vision. Spirit remains persistent even where later mechanics are not yet decided.

Body, Mind, and Spirit remain hidden during the opening and appear when the normal simulation begins in Tunnels.

## 7. Migrate item size to Markers

Remove the standalone item `size` field/type.

Use exactly one of these ordinary Markers for size-based carried items:

- `small`;
- `medium`;
- `large`.

Add the appropriate player-facing attribute metadata using the existing attribute metadata model.

Storage/packing logic must inspect the size Marker.

Do not retain the legacy size field as a second source of truth.

## 8. Migrate storage capacity to Values

Remove the standalone `storage` object/type.

Use ordinary Values:

- `storage-small`;
- `storage-medium`;
- `storage-large`.

Current decided examples:

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5`.

Only equipped gear contributes these Values to active carried capacity.

Packing convention:

- `storage-small` accepts `small`;
- `storage-medium` accepts `small` or `medium`;
- `storage-large` accepts all three;
- allocate to the smallest fitting capacity first.

The opening's five-offered-card limit remains a scene rule and must not be encoded by inventing storage-phase schema.

## 9. Migrate equipment compatibility to References

Remove the standalone authored `equip` field from the target card model.

Non-Hand equipment compatibility uses the project's existing Reference mechanism.

Semantics include:

- T-Shirt -> Chest;
- Pants -> Legs;
- Glasses -> Eyes;
- Simple Backpack -> Back.

Use the existing Reference schema exactly. Do not invent a replacement Reference JSON structure.

Hands are not authored per card:

- every ordinary movable card may be placed in Left Hand or Right Hand;
- ordinary cards do not need Hand References;
- Anchored world cards and Nadir-state cards cannot be held;
- held cards do not consume carried storage capacity.

## 10. Remove temporary compatibility code

Once the new models are active, remove legacy compatibility/adapters instead of keeping duplicate sources of truth.

This includes, where present:

- receiver-owned `accept` handling;
- legacy travel adapters / route-specific travel behavior;
- hardcoded accepted-Body travel checks;
- dedicated item-size handling;
- dedicated storage-object handling;
- dedicated `equip` handling for non-Hand slots;
- per-card authored Hand compatibility.

Do not retain old and new representations side by side.

## 11. Preserve and correct the opening scene

During the opening:

- Body, Mind, and Spirit are hidden/unusable;
- ordinary survival-state UI is hidden;
- offered items may be carried/equipped;
- equipment management is free;
- the player may take at most five offered card instances;
- held/equipped offered cards count toward five;
- Escape remains available.

Normal survival simulation begins in Tunnels.

## 12. Preserve current Stack semantics

There is no Stack Marker.

Current eligibility remains:

- same master ID;
- same current Marker set;
- cards with visible Values do not Stack;
- Stack is Room-only presentation;
- underlying card instances remain separate.

Whether Hidden Values affect Stack remains unresolved and must not be invented.

## 13. Keep Puddle and Flashlight within decided scope

Puddle of Water:

- Anchored;
- `Water 3`;
- filling an eligible empty container adds `contains-water`;
- filling reduces Puddle Water by 1;
- discard Puddle at 0.

The fill Action duration remains undecided. Do not invent it.

Flashlight:

- opening instance Battery 20;
- Deep Tunnels Search instance Battery 0;
- Vision +1 only while active in a Hand and Battery > 0.

Battery drain rate remains undecided. Do not invent it.

## 14. Correct drag feedback and UI legibility

Preserve/implement the decided drag language:

- all legal card targets highlight when dragging begins;
- ordinary legal targets become yellow when hovered for commitment;
- rejecting hovered cards are red;
- Stack targets remain green;
- known direct Value changes preview immediately on affected cards.

Correct the existing UI issues:

- equipment targets large enough to read/use;
- slot labels remain visible while dragging;
- Inventory divider reserves actual layout space;
- no cards render under the divider;
- attribute icons and Value numbers are clearly readable;
- cards should visually dominate backgrounds, not vice versa;
- background source art is not regenerated or modified in this pass.

---

# Completion gate for the next Codex iteration

Do not consider the iteration complete until all of the following are true:

- Body/Mind/Spirit remain the Nadir-state model;
- trigger-based Actions replace the legacy `accept` interaction model;
- Path, Food, and Hydration follow the decided ownership model;
- Drink requires `contains-water` as decided;
- Body owns generic Travel, Eat, and Drink Actions;
- Action execution is atomic;
- only Actions advance time;
- all time-consuming Actions use centralized time advancement;
- all active Processes update on global 15-minute ticks;
- each tick applies Hydration -2 and Satiation -1 to Body;
- tick-before-completion ordering is correct;
- standalone item `size` data is removed and size is represented by Markers;
- standalone `storage` data is removed and storage capacity is represented by Values;
- standalone `equip` data is removed for equipment compatibility;
- non-Hand equipment compatibility uses the existing Reference system;
- ordinary Hand compatibility is a general rule and is not authored per card;
- no new JSON schema has been invented;
- old compatibility paths are removed once superseded;
- opening behavior remains correct;
- Stack semantics remain correct;
- drag feedback/stat previews match the design;
- relevant docs are updated to match the final implementation;
- unresolved design values remain unresolved rather than guessed;
- `pnpm test` passes;
- `pnpm build` passes;
- the corrected slice is manually browser-verified.

Develop the implementation on a dedicated branch and review before merging to `main`.

---

# Explicitly out of scope for this iteration

Do not expand into these areas merely because the infrastructure could support them:

- new crafting systems;
- new wound/healing rules;
- Fever recovery design;
- spoilage timing beyond already-decided behavior;
- new NPC/stealth systems;
- new narrative systems;
- new permanent survival Values;
- durability rules;
- exact Flashlight drain;
- Puddle fill duration;
- new JSON schema.

---

# Roadmap ownership

- Simon decides product/design direction and JSON/schema direction.
- ChatGPT maintains roadmap/backlog and must not invent product/schema decisions.
- Codex implements the agreed scope and updates technical/focused documentation to match code.
- Codex must not silently promote suggestions, unresolved questions, or implementation convenience into authored schema.