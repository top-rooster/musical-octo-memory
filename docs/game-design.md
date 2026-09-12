# Safe Room - current game design

## Design goal

Safe Room is a narrative survival/stealth game about isolation, preparation, and risk.

The interface should feel like a physical workspace. Interactable world entities are represented as cards, and complexity should emerge from interactions between a relatively small number of visible systems rather than from many overlapping hidden bars and sub-systems.

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

This split is intentional. There is no separate generic Nadir card.

Current confirmed permanent player-facing Values include:

- Body: `Hydration 50`, `Satiation 50`;
- Mind: `Vision 4`.

Spirit exists as a persistent part of the representation even where its concrete Values are not yet decided.

Conditions that deserve their own identity/lifecycle may appear as separate anchored cards, for example wounds, Fever, or Exhausted.

The intent is to keep each persistent card readable and compact while allowing exceptional state to become separate cards when that adds useful gameplay.

## Cards

Every card instance has a stable master identity plus independent instance state.

A reusable card master supplies display data, starting attributes, structured attributes, Actions, Processes, and other authored behavior.

Instances clone master starting state and then evolve independently.

When something becomes a materially different object, discard the old card and draw the replacement rather than silently changing its master ID.

### Visible state

Player-facing card state is primarily expressed through:

- **Markers** - presence/absence represented by an icon;
- **Values** - integer state represented by an icon and number;
- structured attributes when they require player-facing representation.

Values normally use `0..100` unless explicitly designed otherwise.

Hidden Values are allowed for concrete internal mechanics, but they must not be used simply to make routine survival decisions opaque.

Item size deliberately does not introduce another attribute category. `small`, `medium`, and `large` are ordinary Markers. A size-based carried item has exactly one of those Markers, and there is no separate `size` field containing the same information.

Storage capacity also deliberately uses the existing attribute system. `storage-small`, `storage-medium`, and `storage-large` are ordinary Values on equipment cards. There is no separate `storage` object carrying the same information.

## Authored data

Runtime authored content uses strict JSON:

- `data/cards.json` - card masters and card-owned behavior;
- `data/rooms.json` - world composition, instances, Nadir-state/equipment/opening state, Search decks;
- `data/attributes.json` - player-facing attribute metadata.

Runtime identity uses stable lowercase kebab-case IDs separate from display names.

Design notes and unresolved values belong in docs/backlog, not runtime JSON.

Room data describes world composition. Card behavior remains card-owned.

## Universal interaction language

Gameplay interactions are initiated by dragging one card onto another.

For card-on-card drag/drop:

- the dragged card is **accepted**;
- the card underneath is **received**.

A given accepted/received pair may resolve at most one Action. The player is not asked to choose between several possible verbs after dropping.

A legal drop is the commitment to perform the interaction. There is no separate confirmation dialog.

### Trigger directions

Actions may be authored on either participating card:

- `on` - Action belongs to accepted and matches received;
- `receive` - Action belongs to received and matches accepted.

Selectors may match stable card IDs, Marker requirements, or structured-attribute presence. These selector requirements may be combined when the interaction needs all of them.

Resolution must yield:

- 0 matching Actions - no Action;
- 1 matching Action - execute it;
- 2+ matches - invalid authored data.

Authored validation must detect overlapping match domains.

## Actions describe what Nadir does

Generic verbs belong on the relevant Nadir state card; object-specific data/effects belong with the object used.

Current examples:

```text
Travel -> Body is dropped on a card with Path
Eat    -> food is dropped on Body
Drink  -> a water-containing card is dropped on Body
```

Body therefore owns generic Travel, Eat, and Drink Actions rather than item-specific lists.

### Structured attributes

Current concrete structured attributes are:

- `path` - destination Room ID and travel time;
- `food` - concrete completion effects contributed when eaten;
- `hydration` - concrete completion effects contributed when drunk.

For Drink, current water presence remains explicit card state: the incoming card must carry `contains-water` as part of the trigger. The `hydration` structured attribute supplies the concrete effect payload; it does not replace `Contains Water` as the mutable state saying that the card currently contains water.

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

For Body this means examples such as:

- Rat Meat with `Satiation 67` -> show `67 -> 82` on Body;
- Canned Food with `Satiation 67` -> show `67 -> 92` on Body;
- a known water source with `Hydration 50` -> show the resulting Hydration value on Body.

If an interaction has several understood direct effects, show all relevant previews at once.

The player should not need to memorize food restoration values or inspect an invisible stomach/fullness system to decide whether to eat.

Unknown consequences remain knowledge-dependent. Serious danger should still be telegraphed without necessarily revealing exact probabilities or outcomes.

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

### First recurring survival Process

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

If future hidden state is introduced, it should solve a concrete gameplay problem rather than reproduce the uncertainty that makes routine survival choices hard to read in other card-survival games.

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

Any ordinary movable card may be held in either Hand. A card in a compatible equipment slot is active/equipped; a merely carried card is not.

Carried storage uses the normal Marker/Value system rather than dedicated size/storage datatypes:

- item size is one Marker: `small`, `medium`, or `large`;
- storage capacity is expressed by Values such as `storage-small`, `storage-medium`, or `storage-large` on equipped gear;
- only equipped gear contributes its storage-capacity Values;
- there is no standalone `size` field and no standalone `storage` object.

Current contributions include:

- Pants: `Storage Small 2`;
- Simple Backpack: `Storage Medium 5` during the main game.

`storage-small` accepts `small`; `storage-medium` accepts `small` or `medium`; `storage-large` accepts all three size Markers. When multiple capacity classes can fit an item, use the smallest fitting capacity first.

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

`contains-water` is part of the Drink trigger. It is the mutable state that tells the interaction system whether that container currently contains water.

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

Do not invent missing durations, rates, Values, Markers, probabilities, Process rules, or extra systems to make implementation appear complete.

Prefer concrete gameplay needs over abstract infrastructure. Keep the number of systems small, but allow attributes and interactions to create depth.
