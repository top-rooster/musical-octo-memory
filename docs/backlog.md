# Safe Room - design decision backlog

This file is the current design decision register. It is not an implementation log or history archive.

Historical versions remain available in Git. A suggestion is not a decision.

## Status

- **DECIDED BY SIMON** - Simon explicitly chose this.
- **OPEN - SIMON TO DECIDE** - a real design question still needs an answer.
- **DEFERRED** - intentionally postponed.

## Current decision queue

1. **REF-01 [P0]** - Decide the authored JSON representation for References. Simon has decided that non-Hand equipment compatibility is a Reference, but the repository currently has no generic authored Reference schema. Do not invent one.
2. **WATER-01 [P0]** - Duration of filling a container from a Puddle remains undecided.
3. **FLASHLIGHT-01 [P1]** - Exact Flashlight Battery drain rate remains undecided.
4. **PROCESS-02 [P1]** - Exact concrete rules for unfinished cooking, wound healing, Fever recovery, spoilage, and other Processes remain undecided unless a focused doc explicitly decides them.
5. **DURABILITY-01 [P2]** - Starting Durability, wear rates, and zero-Durability behavior remain undecided.
6. **SURV-01 [P2]** - Whether permanent survival pressures beyond Hydration and Satiation are needed remains open.

---

# Foundational decisions

## DATA-D01 - Runtime authored data uses strict JSON
**Status:** DECIDED BY SIMON

Runtime authored data uses `data/cards.json`, `data/rooms.json`, and `data/attributes.json`.

No JSONC/comments in runtime JSON. Design notes and TODOs belong in docs.

## DATA-D02 - Stable IDs are separate from display names
**Status:** DECIDED BY SIMON

Gameplay references use stable lowercase kebab-case IDs, never player-facing names.

Different masters may share the same visible name.

## DATA-D03 - Ownership is separated by responsibility
**Status:** DECIDED BY SIMON

- `cards.json` owns card identity, state, explicitly decided structured attributes, Actions, Processes, and other card-owned behavior;
- `rooms.json` owns world composition, Nadir-state/equipment/opening state, card instances, Search decks, and instance overrides;
- `attributes.json` owns player-facing attribute metadata.

Room data must not define card behavior merely because an instance exists there.

## DATA-D04 - Explicit Action duration
**Status:** DECIDED BY SIMON

Every executable Action resolves an explicit duration. There is no default duration.

Duration may be authored directly on an Action or supplied by a structured triggering attribute such as `path.time`.

## DATA-D05 - Do not invent JSON schema
**Status:** DECIDED BY SIMON

ChatGPT and Codex must not invent new JSON fields, object shapes, array shapes, wrappers, or special-purpose authored datatypes unless Simon explicitly asks for a new JSON structure.

If the decided schema cannot express a required mechanic, record the missing design decision instead of silently creating JSON.

Do not publish speculative JSON examples as though they were decided schema.

## DATA-D06 - Reference is a semantic concept; encoding remains open
**Status:** DECIDED BY SIMON / ENCODING OPEN

Simon has decided that non-Hand equipment compatibility is a Reference relationship rather than an `equip` array.

The repository does not currently contain a generic authored Reference representation. The helper named `reference(...)` in `src/data/jsonValidation.ts` only validates ID strings and is not a Reference schema.

Therefore Reference JSON encoding is blocked by **REF-01** and must not be invented.

---

# Nadir and card model

## NADIR-D01 - Body, Mind, and Spirit are the persistent Nadir cards
**Status:** DECIDED BY SIMON

Nadir is represented by three persistent anchored Inventory cards:

- **Body** - physical state and bodily survival needs;
- **Mind** - perception/cognitive state;
- **Spirit** - emotional/spiritual state.

There is no separate generic Nadir card.

Current confirmed visible permanent Values include:

- Body: Hydration 50;
- Body: Satiation 50;
- Mind: Vision 4.

Conditions that have their own identity/lifecycle may remain separate anchored cards.

## CARD-D01 - Masters and instances are separate
**Status:** DECIDED BY SIMON

A card master defines stable identity, starting state, and authored behavior. Each spawned card is an independent instance.

Material identity changes use discard + draw replacement rather than changing master ID in place.

## CARD-D02 - Player-facing state is readable on cards
**Status:** DECIDED BY SIMON

Visible Markers/Values carry routine gameplay state. Hidden Values may exist for concrete internal mechanics, but they must not be used merely to hide information required for ordinary survival decisions.

## CARD-D03 - Stack is presentation only
**Status:** DECIDED BY SIMON

There is no Stack Marker.

Stack is Room-only visual compression. Underlying cards remain separate instances and stacking has no gameplay effect.

Current eligibility:

1. same master ID;
2. same current Marker set;
3. cards containing visible Values do not Stack.

Whether Hidden Values affect Stack eligibility remains open.

## CARD-D04 - Item size is represented by Markers
**Status:** DECIDED BY SIMON

Item size is not a separate card field or attribute type.

The current size Markers are `small`, `medium`, and `large`.

A size-based carried item has exactly one of these Markers.

## CARD-D05 - Storage capacity is represented by Values
**Status:** DECIDED BY SIMON

Storage capacity is not a separate `storage` object or attribute type.

The current storage-capacity Values are `storage-small`, `storage-medium`, and `storage-large`.

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5`.

Only equipped gear contributes these Values to carried capacity.

---

# Interaction and Action model

## ACTION-D01 - Card-on-card roles and triggers
**Status:** DECIDED BY SIMON

For drag/drop:

- dragged card = `accepted`;
- card underneath = `received`.

`on` Actions belong to accepted and match received.

`receive` Actions belong to received and match accepted.

Selectors may match card IDs, Markers, structured-attribute presence, or conjunctive combinations of these.

0 matches means no Action, exactly 1 executes, and 2+ is invalid authored data.

Validation must detect overlapping match domains.

## ACTION-D02 - Generic physical behavior belongs on Body
**Status:** DECIDED BY SIMON

Current generic Body Actions are:

- Travel - Body is dropped on a card with `path`;
- Eat - Body receives a card with `food`;
- Drink - Body receives a card satisfying the water trigger, including `contains-water`, and carrying the `hydration` behavior payload.

Object-specific effects belong on the triggering object attribute rather than as item lists on Body.

## ACTION-D03 - Structured attributes and mutable trigger state
**Status:** DECIDED BY SIMON

Current concrete structured attributes are `path`, `food`, and `hydration`.

`contains-water` remains the mutable Marker meaning that a container currently contains water. It is part of the Drink trigger and is not replaced by `hydration`.

## ACTION-D04 - Atomic Action execution
**Status:** DECIDED BY SIMON

Only one Action executes at a time.

Normal effects execute at completion.

Unsupported/invalid Actions must not partially execute.

---

# Time and Processes

## TIME-D01 - Only Actions advance world time
**Status:** DECIDED BY SIMON

Moving cards, equipment changes, Inventory organization, Stacking, and similar free operations do not advance time unless an authored Action does.

All time-consuming Action paths use one centralized time-advance mechanism.

## PROCESS-D01 - Global quarter-hour ticks
**Status:** DECIDED BY SIMON

Processes have no private timers or intervals.

Every active Process updates once whenever world time crosses `:00`, `:15`, `:30`, or `:45`.

If Action completion occurs exactly on a tick boundary, the world tick resolves before Action completion.

## PROCESS-D02 - Body survival drain
**Status:** DECIDED BY SIMON

At every global 15-minute world tick Body receives:

- `Hydration -2`;
- `Satiation -1`.

Hydration 0 is game over.

---

# Equipment and storage

## EQUIP-D01 - Current equipment slots
**Status:** DECIDED BY SIMON

Current slots are Left Hand, Right Hand, Head, Eyes, Trinket 1, Trinket 2, Chest, Back, Legs, and Feet.

## EQUIP-D02 - Non-Hand equipment compatibility is a Reference
**Status:** DECIDED BY SIMON

Required semantics:

- T-Shirt references Chest;
- Pants reference Legs;
- Glasses reference Eyes;
- Simple Backpack references Back.

The JSON representation is not yet decided; see **REF-01**.

All ordinary movable cards may be placed in either Hand through the general Hand rule. They do not need authored Left Hand/Right Hand compatibility. Anchored world cards and Nadir-state cards may not be held.

## INV-D01 - Carried storage uses size Markers and storage Values
**Status:** DECIDED BY SIMON

There is no permanent generic five-card Inventory limit.

Item size is represented by exactly one of `small`, `medium`, or `large` Markers.

Capacity is represented by equipped-card Values: `storage-small`, `storage-medium`, and `storage-large`.

`storage-small` accepts `small`; `storage-medium` accepts `small` or `medium`; `storage-large` accepts all three size Markers. Allocate to the smallest fitting capacity first.

Equipment slots including Hands do not consume carried storage capacity.

---

# Water and Flashlight

## WATER-D01 - Puddle of Water
**Status:** DECIDED BY SIMON

Puddle is Anchored with `Water 3`.

An eligible empty container has `container` and lacks `contains-water`.

A successful fill adds `contains-water`, reduces Puddle Water by 1, and discards Puddle at 0.

`contains-water` is part of the Drink trigger.

Fill duration remains OPEN and must not be invented.

## FLASHLIGHT-D01
**Status:** DECIDED BY SIMON

Opening Flashlight starts Battery 20. Deep Tunnels Search Flashlight starts Battery 0.

Flashlight gives Vision +1 only while active in a Hand and Battery > 0.

Exact Battery drain remains OPEN.

---

# Maintenance rule

When Simon makes a new explicit design decision:

1. update the current entry rather than creating contradictory duplicates;
2. remove obsolete prototype rules from the active decision register;
3. move unresolved implementation-blocking values into the decision queue;
4. do not turn ChatGPT suggestions into decisions;
5. keep runtime-data TODOs out of JSON;
6. never invent new JSON structure unless Simon explicitly asks for it.
