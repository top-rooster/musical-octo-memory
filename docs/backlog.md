# Safe Room - design decision backlog

This file is the current design decision register. It is not an implementation log or history archive.

Historical versions remain available in Git. A suggestion is not a decision.

## Status

- **DECIDED BY SIMON** - Simon explicitly chose this.
- **OPEN - SIMON TO DECIDE** - a real design question still needs an answer.
- **DEFERRED** - intentionally postponed.

## Current decision queue

1. **WATER-01 [P0]** - Duration of filling a container from a Puddle remains undecided.
2. **FLASHLIGHT-01 [P1]** - Exact Flashlight Battery drain rate remains undecided.
3. **PROCESS-02 [P1]** - Exact concrete rules for unfinished cooking, wound healing, Fever recovery, spoilage, and other Processes remain undecided unless a focused doc explicitly decides them.
4. **DURABILITY-01 [P2]** - Starting Durability, wear rates, and zero-Durability behavior remain undecided.
5. **SURV-01 [P2]** - Whether permanent survival pressures beyond Hydration and Satiation are needed remains open.

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

- `cards.json` owns card identity, state, structured attributes, Actions, Processes, References, and other card-owned behavior;
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

Reuse existing decided mechanisms such as Markers, Values, References, Actions, Processes, and explicitly decided structured attributes.

If an existing structure cannot express a required mechanic, record the missing design decision instead of silently creating new JSON.

Do not publish speculative JSON examples as though they were decided schema.

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

Do not recreate invisible hunger/fullness/stomach systems merely for complexity.

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

A size-based carried item has exactly one of these Markers. There must not also be a separate `size` field duplicating the same information.

## CARD-D05 - Storage capacity is represented by Values
**Status:** DECIDED BY SIMON

Storage capacity is not a separate `storage` object or attribute type.

The current storage-capacity Values are `storage-small`, `storage-medium`, and `storage-large`.

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5`.

Only equipped gear contributes these Values to carried capacity.

There must not also be a separate `storage` field duplicating the same information.

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

An empty container may retain its hydration behavior payload while being non-drinkable because `contains-water` is absent. Refilling restores `contains-water`.

Do not generalize into an unrestricted scripting language.

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

# Drag feedback

## UI-D01 - Legal targets highlight during drag
**Status:** DECIDED BY SIMON

Every legal receiving card highlights as soon as a drag begins.

Ordinary legal targets become yellow when hovered for commitment. Rejecting hovered cards become red. Stack targets remain green.

Danger is communicated separately from legality color.

## UI-D02 - Known direct effects preview on affected cards
**Status:** DECIDED BY SIMON

Known direct Value changes appear as previews on the affected card as soon as dragging begins.

Examples on Body include `Satiation 67 -> 82` and `Hydration 50 -> 75`.

If several known Values change, show them all simultaneously.

---

# Rooms and travel

## ROOM-D01 - Room composition is separate from route behavior
**Status:** DECIDED BY SIMON

Travel destination/time belongs to route-card `path`, not room placement data.

## TRAVEL-D01 - Body owns generic Travel
**Status:** DECIDED BY SIMON

Dragging Body onto a route card carrying `path` executes Travel.

Current base links:

- Tunnels -> Abandoned Office: 15m;
- Abandoned Office -> Tunnels: 15m;
- Tunnels -> Deep Tunnels: 30m;
- Deep Tunnels -> Tunnels: 30m.

## SEARCH-D01 - Search deck timing and persistence
**Status:** DECIDED BY SIMON

Search is an Action with authored base duration.

Room Search decks are shuffled once at new-game creation, retain the hidden order for the run, do not reroll, and do not show remaining-card count.

Search decks are not cards.

---

# Opening

## OPEN-D01 - Opening is a loadout-selection interlude
**Status:** DECIDED BY SIMON

The Opening Room is not normal survival simulation.

During opening, Body, Mind, Spirit, Vision, and ordinary survival interaction/state are hidden until Escape begins the main game in Tunnels.

The player may take at most five offered card instances; held/equipped offered items count toward five.

## OPEN-D02 - Starting clothes/offers
**Status:** DECIDED BY SIMON

Nadir begins wearing Pants and T-Shirt, with Feet and Hands empty.

Current offers remain Pocket Knife, two Plastic Bottles with `contains-water`, two Canned Food, Simple Lighter, Flashlight, Spare Batteries, Pain Killers, Simple Backpack, and Glasses.

---

# Equipment and storage

## EQUIP-D01 - Current equipment slots
**Status:** DECIDED BY SIMON

Current slots are Left Hand, Right Hand, Head, Eyes, Trinket 1, Trinket 2, Chest, Back, Legs, and Feet.

## EQUIP-D02 - Non-Hand equipment compatibility uses References
**Status:** DECIDED BY SIMON

Compatibility with non-Hand equipment slots is represented through the existing Reference mechanism, not a separate `equip` field.

Examples: T-Shirt references Chest; Pants reference Legs; Glasses reference Eyes; Simple Backpack references Back.

The exact JSON form must reuse the existing Reference schema. Do not invent a new Reference structure.

All ordinary movable cards may be placed in either Hand through the general Hand rule. They do not need authored Left Hand/Right Hand References merely to be holdable.

Anchored world cards and Nadir-state cards may not be held.

## INV-D01 - Carried storage uses size Markers and storage Values
**Status:** DECIDED BY SIMON

There is no permanent generic five-card Inventory limit.

Item size is represented by exactly one of `small`, `medium`, or `large` Markers.

Capacity is represented by equipped-card Values: `storage-small`, `storage-medium`, and `storage-large`.

`storage-small` accepts `small`; `storage-medium` accepts `small` or `medium`; `storage-large` accepts all three size Markers. Allocate to the smallest fitting capacity first.

Equipment slots including Hands do not consume carried storage capacity.

No standalone `size`, `storage`, or `equip` field remains in the target model.

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

# Open/deferred systems

- Exact wound healing/Burn Wound/Fever recovery behavior remains open unless superseded by a focused doc.
- Rat Meat cooking timing/effects remain open.
- Exact Dead Rat spoilage rate remains open.
- Durability wear/zero behavior remains open.
- Trinket content is deferred.
- Torch recipe/burn behavior is deferred.
- Final heat-source attribute name remains open.

---

# Maintenance rule

When Simon makes a new explicit design decision:

1. update the current entry rather than creating contradictory duplicates;
2. remove obsolete prototype rules from the active decision register;
3. move unresolved implementation-blocking values into the decision queue;
4. do not turn ChatGPT suggestions into decisions;
5. keep runtime-data TODOs out of JSON;
6. never invent new JSON structure unless Simon explicitly asks for it; if existing schema is insufficient, record an open design question instead.
