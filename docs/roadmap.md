# Safe Room - implementation roadmap

This roadmap tracks implementation order, not design history.

Detailed design decisions live in focused docs and `docs/backlog.md`. The current Action/Process contract is in `docs/action-process-model.md`.

## Current status

### Milestone 1 - core card interaction prototype
**Status: COMPLETE**

Validated the basic Room/Inventory card workspace, drag/drop, Anchored behavior, card-on-card interactions, Value previews, food consumption, collision rejection, and exact-origin restoration.

### Milestone 2 - playable world slice
**Status: BASELINE COMPLETE AND MERGED TO `main`**

Established the opening evacuation scene, persistent rooms, Search decks, travel, Vision/light, equipment, carried storage, item selection, and deployment/test coverage.

### JSON authored-data migration
**Status: COMPLETE AND MERGED**

Runtime authored data uses strict JSON. The current runtime still contains temporary baseline structures that the next correction pass must replace.

---

# Next Codex iteration - Action, attribute, time, and card-model correction

**Priority: NOW**

The implementation should correct the existing slice before adding new gameplay breadth.

The iteration must start from current remote `main`, not from a stale Codex `work` snapshot.

## Non-negotiable implementation constraints

Codex must not introduce new authored JSON fields, object shapes, arrays, wrappers, or special-purpose datatypes unless Simon explicitly decided them.

If the decided schema cannot represent a required mechanic, report the missing design decision instead of inventing syntax.

The decided Reference representation is:

```json
"references": { "<reference name>": "<reference target id>" }
```

For non-Hand equipment compatibility the reference name is `equip`, for example:

```json
"references": { "equip": "chest" }
```

Do not expand References into arrays, nested objects, wrappers, or alternate forms without an explicit design decision.

## 1. Replace the temporary card-on-card interaction model

Replace receiver-owned `accept` behavior with the trigger-based Action model from `docs/action-process-model.md`.

For drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` Actions belong to accepted and match received;
- `receive` Actions belong to received and match accepted;
- 0 matches = no Action;
- exactly 1 = execute;
- 2+ = invalid authored data.

Validation must reject overlapping Action match domains. Runtime resolution must guard against ambiguity.

## 2. Implement the decided structured attributes

### Path

Route cards carry `path` with destination Room and travel time. Body owns one generic Travel Action.

### Food

Edible cards carry `food` with their concrete eating effects. Body owns one generic Eat Action.

### Hydration and Contains Water

Hydration-capable cards carry `hydration`. Current water presence is the mutable Marker `contains-water`.

Body owns one generic Drink Action. `contains-water` remains part of the Drink trigger.

## 3. Build the generic atomic Action executor

Validate the complete Action before applying effects. Unsupported/invalid Actions must not partially execute.

Only one Action executes at a time. Normal effects apply at completion. Every Action resolves an explicit duration.

Do not create a general scripting engine.

## 4. Centralize world time

Only Actions advance time. Search, Travel, and card Actions use the same time-advance path.

Global world ticks occur at `:00`, `:15`, `:30`, and `:45`.

If Action completion coincides with a tick, resolve the tick and Process consequences before Action completion effects.

## 5. Implement global Processes

Processes have no private intervals/timers.

Every active Process updates once per global world tick.

Body starts with Hydration 50 and Satiation 50.

Each tick applies:

- Hydration -2;
- Satiation -1.

Hydration 0 is game over.

## 6. Preserve Body / Mind / Spirit

Nadir remains represented by Body, Mind, and Spirit. Do not create a generic Nadir card.

Body/Mind/Spirit remain hidden during the opening and appear when normal survival simulation begins in Tunnels.

## 7. Migrate item size to Markers

Remove standalone item `size` data.

Use exactly one of:

- `small`;
- `medium`;
- `large`.

These are ordinary Markers.

## 8. Migrate storage capacity to Values

Remove standalone `storage` objects.

Use Values:

- `storage-small`;
- `storage-medium`;
- `storage-large`.

Current examples:

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5`.

Only equipped gear contributes active capacity.

Packing uses the smallest fitting capacity first.

## 9. Migrate equipment compatibility to References

Remove the standalone authored `equip` array from the target model.

Non-Hand equipment compatibility uses the decided `references` object with reference name `equip`.

Required migrations:

- T-Shirt -> `"references": { "equip": "chest" }`;
- Pants -> `"references": { "equip": "legs" }`;
- Glasses -> `"references": { "equip": "eyes" }`;
- Simple Backpack -> `"references": { "equip": "back" }`.

Validation must ensure that `references.equip` targets a valid non-Hand equipment-slot ID.

Hands are not authored per card. Every ordinary movable card may be placed in either Hand. Anchored world cards and Nadir-state cards may not be held.

## 10. Remove superseded compatibility code

Once replacement systems work, remove old paths rather than keeping duplicate sources of truth, including legacy `accept`, legacy travel adapters, standalone size handling, standalone storage-object handling, and the standalone `equip` array.

## 11. Preserve opening behavior

During Opening:

- Body/Mind/Spirit are hidden/unusable;
- normal survival state UI is hidden;
- equipment movement is free;
- max five offered instances may be taken;
- held/equipped offered cards count toward five;
- Escape remains available.

## 12. Preserve Stack semantics

There is no Stack Marker.

Current eligibility remains same master ID + same Marker set, with visible-Value cards excluded. Stack remains Room-only presentation.

## 13. Puddle and Flashlight remain within decided scope

Do not invent Puddle fill duration or Flashlight drain.

Preserve already-decided Water and Flashlight state.

## 14. Drag feedback and UI legibility

Preserve/implement legal target highlighting, yellow hovered commit target, red rejection, green Stack target, and immediate known Value previews.

Correct equipment target size/legibility, Inventory divider layout, card attribute readability, and background visual dominance without regenerating source art.

---

# Completion gate

The full iteration is complete only when:

- the implementation starts from current remote `main`;
- trigger-based Actions replace legacy `accept`;
- Path/Food/Hydration follow the decided ownership model;
- only Actions advance time;
- Processes run on global 15-minute ticks;
- each tick applies Hydration -2 and Satiation -1;
- size is represented by Markers, not standalone `size` data;
- storage capacity is represented by Values, not standalone `storage` data;
- non-Hand equipment compatibility is represented by the decided `references` object and legacy `equip` is removed;
- ordinary Hand compatibility is a general rule;
- no JSON schema was invented beyond explicit decisions;
- old compatibility paths are removed once superseded;
- opening, Stack, drag feedback, and UI rules remain correct;
- unresolved design questions remain unresolved;
- `pnpm test` passes;
- `pnpm build` passes;
- the corrected slice is manually browser-verified;
- completed code is pushed to the remote repository;
- the repository's existing GitHub Pages workflow successfully deploys the completed version;
- the deployed game is accessible and ready for Simon to test.

Develop on a dedicated branch and review before merging to the repository's normal deploy branch (`main` unless the existing workflow says otherwise).

---

# Explicitly out of scope

Do not expand into new crafting, wound/healing, Fever, spoilage, NPC/stealth, narrative, durability, Flashlight-drain, Puddle-duration, or other unresolved systems.

---

# Roadmap ownership

- Simon decides product/design and JSON/schema direction.
- ChatGPT maintains roadmap/backlog and must not invent schema decisions.
- Codex implements the agreed scope and updates technical docs to match code.
