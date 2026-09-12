# Safe Room - current game design

## Design goal

Safe Room is a narrative survival/stealth game about isolation, preparation, and risk.

The interface should feel like a physical workspace. Interactable world entities are represented as cards, and complexity should emerge from interactions between a relatively small number of visible systems rather than from many overlapping hidden bars and special-purpose subsystems.

The player should usually be able to understand the state needed for a decision by looking at the cards in front of them.

## Core workspace

The main play space has two top-level zones:

- **Room** - the currently viewed physical location;
- **Inventory** - persistent carried/equipped/Nadir state that remains present across room changes.

Cards can be positioned freely within their legal areas. Ordinary placement may not overlap other cards. A legal Room/Inventory move is free unless an authored Action says otherwise.

### Anchored cards

`Anchored` prevents a card from coming to rest outside its home zone.

Anchored cards may still cross zone boundaries while being dragged and may participate in legal cross-zone interactions. If released illegally in another zone, they return to their legal/home position.

Body, Mind, Spirit, and Nadir condition cards are anchored to Inventory.

## Nadir

Nadir Veylan is represented by three persistent anchored cards in Inventory:

- **Body** - physical state and bodily survival needs;
- **Mind** - perception/cognitive state;
- **Spirit** - emotional/spiritual state.

There is no generic Nadir card.

Current confirmed permanent player-facing Values include:

- Body: `Hydration 50`, `Satiation 50`;
- Mind: `Vision 4`.

Spirit remains a persistent part of the representation even where its concrete Values are not yet decided.

Conditions that deserve their own identity/lifecycle may appear as separate anchored cards, for example wounds, Fever, or Exhausted.

## Cards and visible state

Every card instance has a stable master identity plus independent instance state.

A reusable card master supplies display data, starting attributes, explicitly decided structured attributes, Actions, Processes, and other already-decided authored behavior.

Instances clone master starting state and then evolve independently.

When something becomes a materially different object, discard the old card and draw the replacement rather than silently changing its master ID.

Player-facing card state is primarily expressed through:

- **Markers** - presence/absence represented by an icon;
- **Values** - integer state represented by an icon and number;
- explicitly decided structured attributes where payload beyond Marker/Value state is required.

References are also a decided semantic concept for relationships such as non-Hand equipment compatibility, but the authored JSON representation of References is not yet decided.

Values normally use `0..100` unless explicitly designed otherwise.

Hidden Values are allowed for concrete internal mechanics, but they must not be used simply to make routine survival decisions opaque.

### Size and storage use existing systems

Item size is not a separate field/type.

- `small`, `medium`, and `large` are ordinary Markers;
- a size-based carried item has exactly one of them.

Storage capacity is not a separate object/type.

- `storage-small`, `storage-medium`, and `storage-large` are ordinary Values on equipment cards;
- only equipped gear contributes those Values as active carrying capacity.

There is no standalone `size` field and no standalone `storage` object in the target model.

## Authored data and schema discipline

Runtime authored content uses strict JSON:

- `data/cards.json` - card masters and card-owned behavior;
- `data/rooms.json` - world composition, instances, Nadir-state/equipment/opening state, Search decks;
- `data/attributes.json` - player-facing attribute metadata.

Runtime identity uses stable lowercase kebab-case IDs separate from display names.

Design notes and unresolved values belong in docs/backlog, not runtime JSON.

### Do not invent JSON structure

ChatGPT and Codex must not invent new JSON fields, object shapes, arrays, wrappers, or special-purpose authored datatypes unless Simon explicitly asks for a new JSON structure.

If the current decided schema cannot express a required mechanic, that is a design question. Record it as unresolved instead of creating syntax to solve it.

Documentation must not present speculative JSON examples as decided schema.

The current repository does not contain a generic authored Reference JSON schema. The `reference(...)` helper in `src/data/jsonValidation.ts` only validates ordinary ID strings and is not a Reference representation.

Therefore Reference encoding remains an explicit open schema decision.

## Universal interaction language

Gameplay interactions are initiated by dragging one card onto another.

For card-on-card drag/drop:

- the dragged card is **accepted**;
- the card underneath is **received**.

A given accepted/received pair may resolve at most one Action. The player is not asked to choose between several verbs after dropping.

A legal drop is the commitment to perform the interaction. There is no separate confirmation dialog.

### Trigger directions

Actions may be authored on either participating card:

- `on` - Action belongs to accepted and matches received;
- `receive` - Action belongs to received and matches accepted.

Selectors may match stable card IDs, Marker requirements, or structured-attribute presence. These requirements may be conjunctive.

Resolution must yield:

- 0 matching Actions - no Action;
- 1 matching Action - execute it;
- 2+ matches - invalid authored data.

Authored validation must detect overlapping match domains.

## Actions describe what Nadir does

Generic physical verbs belong on Body; object-specific eligibility/data/effects belong with the object used.

Current examples:

```text
Travel -> Body is dropped on a card with Path
Eat    -> food is dropped on Body
Drink  -> a water-containing card is dropped on Body
```

Body owns generic Travel, Eat, and Drink Actions rather than item-specific lists.

### Structured attributes

Current concrete structured attributes are:

- `path` - destination Room ID and travel time;
- `food` - concrete completion effects contributed when eaten;
- `hydration` - concrete completion effects contributed when drunk.

For Drink, current water presence remains explicit state: the incoming card must carry `contains-water` as part of the trigger. `hydration` supplies the concrete effect payload and does not replace `Contains Water`.

The principle is:

> Action = what Nadir does. Triggering card state/attributes = the concrete eligibility and data/effects contributed by the object.

Do not generalize this into an unrestricted scripting system.

## Drag feedback and previews

Dragging should expose interaction possibilities immediately.

When a card starts being dragged:

- every card that can legally receive it highlights;
- ordinary legal targets use the normal legal highlight;
- when hovered for commitment they become yellow;
- a rejecting hovered card becomes red;
- Stack targets remain green because stacking has no gameplay consequence;
- legal zone placement receives a subtle zone highlight.

Known direct effects should be previewed on the affected visible attributes as soon as dragging begins, not only after hovering.

Examples on Body include:

- Rat Meat with `Satiation 67` -> `67 -> 82`;
- Canned Food with `Satiation 67` -> `67 -> 92`;
- a known water source with `Hydration 50` -> the resulting Hydration value.

If an interaction has several understood direct effects, show all relevant previews at once.

## Actions and world time

An **Action** is work Nadir personally performs and is the only mechanism that advances world time.

Every executable Action resolves an explicit duration. There is no implicit duration.

A duration may come from the Action itself or from a triggering structured attribute. Travel uses `path.time`.

Normal Action effects execute at completion.

Only one Action executes at a time.

Execution is atomic: unsupported or invalid effects must not partially apply.

### Global world ticks

The world has one global quarter-hour update grid:

- `:00`;
- `:15`;
- `:30`;
- `:45`.

Every crossed boundary while an Action advances time causes one world tick.

If Action completion lands exactly on a tick boundary:

1. world tick resolves;
2. Process consequences resolve;
3. Action completes;
4. completion effects apply.

Search, Travel, and every future time-consuming Action use the same centralized time-advance mechanism.

## Processes

A **Process** is unattended change that progresses when Actions advance world time.

Processes have no private intervals or timers. Every active Process updates once on every crossed global world tick.

JSON ordering must not become gameplay ordering.

Finite/staged Processes use card state, effects, and conditions/thresholds rather than independent clocks.

### Current survival drain

Body starts with:

- `Hydration 50`;
- `Satiation 50`.

Each global 15-minute world tick applies:

- `Hydration -2`;
- `Satiation -1`.

Hydration 0 causes game over.

## Survival design principle

Current permanent survival Values are Hydration and Satiation on Body.

Avoid adding hidden stomach contents, fullness, eating-frequency adaptation, or similar invisible simulation merely to create complexity.

If future hidden state is introduced, it should solve a concrete gameplay problem rather than make routine survival choices unreadable.

## Stack

Stack exists only to reduce Room clutter.

Underlying cards remain separate instances and Stack has no mechanical effect.

Current Stack eligibility:

- same master ID;
- same current Marker set;
- cards containing visible Values do not Stack;
- Stack presentation is Room-only.

Dragging a Stack peels off one card.

Whether Hidden Values affect Stack eligibility remains undecided.

## Equipment and carried Inventory

Equipment uses explicit slots in the persistent Inventory interface.

Current slots:

- Left Hand;
- Right Hand;
- Head;
- Eyes;
- Trinket 1;
- Trinket 2;
- Chest;
- Back;
- Legs;
- Feet.

### Equipment compatibility

Simon has decided that compatibility with non-Hand equipment slots is a **Reference** relationship.

Required semantics:

- T-Shirt references Chest;
- Pants reference Legs;
- Glasses reference Eyes;
- Simple Backpack references Back.

There should not be a dedicated `equip` array in the final model.

However, the JSON representation for References is still open. The current runtime has no generic authored Reference schema, so the migration away from legacy non-Hand `equip` data must wait until Simon explicitly decides that encoding.

Hands are a general rule rather than authored compatibility. Any ordinary movable card may be placed in either Hand without authored Hand compatibility. Anchored world cards and Nadir-state cards may not be held.

A card in a compatible equipment slot is active/equipped. A merely carried card is not.

### Carrying capacity

Carried storage uses ordinary Marker/Value systems:

- item size is one Marker: `small`, `medium`, or `large`;
- storage capacity is expressed by Values `storage-small`, `storage-medium`, and `storage-large` on equipped gear;
- only equipped gear contributes storage Values.

Current contributions:

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5` in the main game.

Packing convention:

- `storage-small` accepts `small`;
- `storage-medium` accepts `small` or `medium`;
- `storage-large` accepts all three size Markers;
- use the smallest fitting available capacity first.

Equipment slots, including Hands, do not consume carried capacity.

The opening evacuation separately limits the player to taking five offered card instances.

## Vision and lighting

Vision is a visible Value on Mind and starts at 4.

Current modifiers include:

- Glasses in Eyes: +1;
- active Flashlight in Hand with Battery > 0: +1;
- Bright: 0;
- Dim: -1;
- Twilight: -3;
- Darkness: -4.

Current effective-Vision consequences:

- <=0: cannot Search; travel x3;
- 1: Search x3; travel x2;
- 2: Search x2;
- >=3: Search normal.

Deep Tunnels are soft-gated by Vision rather than hard-gated by possession of a specific item.

## Rooms and travel

Persistent first-slice rooms are:

- Tunnels;
- Abandoned Office;
- Deep Tunnels.

Travel points are anchored route cards carrying `path`.

Body is dragged onto a route card to Travel.

Current links:

- Tunnels -> Abandoned Office: 15m;
- Abandoned Office -> Tunnels: 15m;
- Tunnels -> Deep Tunnels: 30m;
- Deep Tunnels -> Tunnels: 30m.

Route cards may share display names while remaining different masters.

## Search decks

Search decks are room-local interactive objects, not cards.

Search is an Action with authored base duration, modified by Vision where applicable.

Each room deck is shuffled once at new-game creation and keeps that hidden order for the run. There is no reshuffle/reroll and no visible remaining-card count.

## Opening

The game begins with an evacuation/loadout interlude before normal survival simulation.

Nadir may take at most five offered card instances. Equipped/held offered items count toward the five.

During the opening, Body, Mind, Spirit, and normal survival interaction/state are hidden until Escape transitions into Tunnels and the main simulation starts.

Nadir begins wearing Pants and T-Shirt and is barefoot.

Current offered items include Pocket Knife, two water bottles, two Canned Food, Simple Lighter, Flashlight, Spare Batteries, Pain Killers, Simple Backpack, and Glasses.

## Water and containers

Puddle of Water is anchored and currently has `Water 3`.

An empty container is a card with `container` and without `contains-water`.

A successful fill consumes one Puddle Water unit and adds `contains-water` to the container. Puddle is discarded at 0.

`contains-water` is part of the Drink trigger.

The fill Action duration remains undecided and must not be invented.

## Flashlight

The opening Flashlight starts at `Battery 20`.

The Deep Tunnels Search Flashlight starts at `Battery 0`.

Flashlight gives Vision +1 only while active in a Hand and Battery > 0.

Exact Battery drain remains undecided.

## Narrative direction

Nadir is a good man shaped and damaged by a toxic military system. He uses self-deception as a survival mechanism for things he has done or caused and cannot comfortably live with.

His flight from returning to military service must remain compatible with the relationship being a genuine love story with Elina rather than reducing her to a calculated escape tool.

His notes may reflect moral tension between player choices, past trauma, and the stories he tells himself without making him appear foolish.

## Design discipline

A suggestion is not a decision.

Do not invent missing durations, rates, Values, Markers, probabilities, Process rules, Reference encoding, JSON structures, or extra systems to make implementation appear complete.

Prefer concrete gameplay needs over abstract infrastructure. Keep the number of systems small, and reuse existing mechanisms before introducing new concepts.
