# Safe Room - design decision backlog

This file is the current design decision register. It is not an implementation log and not a history archive.

Historical versions remain available in Git. Focused design documents may contain more detail, but this file records the decisions and unresolved questions that should guide the next implementation pass.

Most importantly: **a suggestion is not a decision.**

## Status

- **DECIDED BY SIMON** - Simon explicitly chose this.
- **OPEN - SIMON TO DECIDE** - a real design question still needs an answer.
- **DEFERRED** - intentionally not worth deciding yet.

## Priority

- **P0 - Now** - blocks or directly affects the current prototype.
- **P1 - Soon** - important to the next core systems.
- **P2 - Later** - decide before implementing the affected system.
- **P3 - Parked** - preserve without spending attention now.

---

# Current decision queue

1. **WATER-01 [P0]** - Duration of filling a container from a Puddle is still undecided. Do not invent an Action duration.
2. **FLASHLIGHT-01 [P1]** - Exact Flashlight Battery drain rate is undecided.
3. **PROCESS-02 [P1]** - Exact rules/durations for unfinished cooking, wound healing, Fever recovery, spoilage, and other Processes remain undecided unless separately documented as decided.
4. **DURABILITY-01 [P2]** - Starting Durability, wear rates, and zero-Durability behavior remain undecided.
5. **SURV-01 [P2]** - Whether permanent survival pressures beyond Hydration and Satiation are needed remains open.

---

# Current foundational decisions

## DATA-D01 - Runtime authored data uses JSON
**Status:** DECIDED BY SIMON

The custom text data language is retired because the syntax became too complicated as Actions, Processes, equipment, instance overrides, and card behavior grew.

Runtime authored data will use valid JSON:

- `data/cards.json`
- `data/rooms.json`
- `data/attributes.json`

No JSONC and no comments in runtime JSON.

The old `.txt` runtime files and their custom parsers should be removed once the JSON migration is complete and nothing still depends on them.

## DATA-D02 - Comments and TODOs do not live in runtime data
**Status:** DECIDED BY SIMON

Design notes, TODOs, undecided numerical values, and explanatory comments are moved out of runtime data and into this backlog or the appropriate focused design document.

Runtime JSON contains executable game data only.

## DATA-D03 - Stable IDs are separate from display names
**Status:** DECIDED BY SIMON

Cards, rooms, Markers, and Values all have stable lowercase kebab-case IDs separate from player-facing names.

Examples:

- `body` -> `Body`
- `hydration` -> `Hydration`
- `contains-water` -> `Contains Water`
- `deep-tunnels` -> `Deep Tunnels`
- `go-deep-tunnels` -> `Go to deep tunnels`

Gameplay references use IDs, never display names. Display names may change without breaking behavior or references.

Different masters may share the same display name when they represent different identities or behavior.

## DATA-D04 - Data ownership is separated by responsibility
**Status:** DECIDED BY SIMON

`cards.json` owns card master identity and card behavior, including Markers, Values, Actions, accepted-card interactions, Processes, equipment metadata, storage effects, and other card-owned behavior.

`rooms.json` owns world composition: rooms, backgrounds, light, starting/offered/equipped cards, Search decks, card placement/population, and instance state overrides.

`attributes.json` owns player-facing attribute metadata such as name and description.

Room data must not define what a card does merely because an instance is placed in that room.

## DATA-D05 - Explicit time remains mandatory
**Status:** DECIDED BY SIMON

Every Action has an explicit duration in authored data. Instant Actions use `0m`.

There is no implicit/default Action duration.

Finite Processes also explicitly define their relevant timing when implemented. Do not invent missing durations.

---

# Card model

## CARD-D01 - Master definitions and instances are separate
**Status:** DECIDED BY SIMON

A card master defines stable identity, display data, starting attributes, and authored behavior.

Each spawned card is an independent instance with its own current Values and Markers.

A material identity change is represented by discarding the old instance and drawing the replacement at the same location, rather than silently changing its master ID.

## CARD-D02 - Visible attributes are Markers or Values
**Status:** DECIDED BY SIMON

All gameplay attributes exposed by the current model are visible.

- **Marker** - presence/absence state represented by an icon.
- **Value** - integer state represented by an icon plus number.

Values use `0..100` unless that Value explicitly defines another range.

Do not add hidden gameplay attributes merely for implementation convenience.

## CARD-D03 - Search decks are not cards
**Status:** DECIDED BY SIMON

Search decks are room-local interactive objects with a shared identical backside. They are not card instances and do not use card behavior merely because they look card-like.

Search deck names are not printed visibly on the deck backside.

## CARD-D04 - Stack is presentation only
**Status:** DECIDED BY SIMON

There is no `Stack` Marker and there must never be one.

Stack exists only to reduce Room clutter. Individual card instances remain separate and stacking has no gameplay effect.

Cards may stack only when all of the following are true:

1. same master ID;
2. same current Marker-ID set;
3. neither card has any Value attributes.

Any card containing one or more Values cannot stack, even when two instances currently have identical numerical values.

Stack is Room-only.

## CARD-D05 - Action, Process, Connection, Stack remain distinct concepts
**Status:** DECIDED BY SIMON

- **Action** - Nadir personally performs work; Actions are the only thing that advances world time.
- **Process** - unattended ongoing change that progresses as Actions advance world time.
- **Connection** - persistent mechanically meaningful relationship.
- **Stack** - visual organization only.

Do not collapse these concepts into one generic relationship mechanism.

---

# Time and Processes

## TIME-D01 - Only Actions advance world time
**Status:** DECIDED BY SIMON

Moving cards, equipping items, organizing inventory, creating a Stack, and other free UI operations do not advance time unless an authored Action explicitly says they do.

All code paths that execute time-consuming Actions must use one centralized time-advance mechanism so Processes cannot be bypassed by Search, travel, or future Actions.

## PROCESS-D01 - Process updates are synchronized to the world clock
**Status:** DECIDED BY SIMON

All Process updates occur only when world time crosses a global quarter-hour boundary:

- `:00`
- `:15`
- `:30`
- `:45`

Processes do not maintain independent 15-minute timers.

For an Action moving world time from `oldElapsedMinutes` to `newElapsedMinutes`, the number of Process updates is equivalent to:

`floor(newElapsedMinutes / 15) - floor(oldElapsedMinutes / 15)`

Examples:

- 10 -> 14: 0 updates
- 10 -> 16: 1 update
- 14 -> 31: 2 updates
- 44 -> 61: 2 updates
- 0-minute Action: 0 updates

Each crossed global quarter-hour boundary causes one update of every active Process.

## PROCESS-D02 - Body Hydration is a recurring Process
**Status:** DECIDED BY SIMON

Body starts with:

- Hydration 50
- Satiation 50

At every global Process update, Body applies:

`Hydration -2`

Hydration is clamped to its Value bounds. Hydration 0 is a game-over condition.

No recurring Satiation loss should be invented until explicitly decided/authored.

## PROCESS-D03 - Process schema must support recurring and finite Processes
**Status:** DECIDED BY SIMON

The data/runtime model must not assume every Process is an endless 15-minute decay.

It must leave room for both:

- recurring Processes such as Hydration;
- finite Processes such as sterilization, healing, cooking, and spoilage.

Only concrete decided behavior should be implemented now.

---

# Rooms and travel

## ROOM-D01 - Rooms describe world composition, not card behavior
**Status:** DECIDED BY SIMON

`rooms.json` identifies the rooms and what exists in them. It may contain room-owned properties such as background, light, Search decks, offered cards, and instance overrides.

Travel destination and travel duration are not room-instance behavior and must not be encoded on a card entry in `rooms.json`.

## TRAVEL-D01 - Travel behavior belongs to the route card
**Status:** DECIDED BY SIMON

A route card owns the accepted card, Action duration, and destination effect.

Conceptually:

`accept body -> Action -> go deep-tunnels`

The runtime must not hardcode that every travel card accepts `body` merely because it has a travel destination.

Travel is executed through the same small data-driven Action/effect mechanism used for other concrete card interactions.

## TRAVEL-D02 - Routes with different behavior have different IDs
**Status:** DECIDED BY SIMON

Two route cards may have the same player-facing name and art but must have separate master IDs when their behavior differs.

For example:

- `go-tunnels-from-office` - display name `Go to tunnels`, 15-minute Action
- `go-tunnels-from-deep-tunnels` - display name `Go to tunnels`, 30-minute Action

This is one reason stable ID and display name are separate concepts.

---

# Opening

## OPEN-D01 - Opening is a loadout-selection interlude
**Status:** DECIDED BY SIMON

The Opening Room is not yet the normal survival simulation.

During the opening:

- Body, Mind, and Spirit are not visible or usable interaction targets;
- Vision is not shown;
- survival-state UI that belongs to the main game is hidden;
- offered items may be carried/equipped;
- equipment management remains free;
- the offered-item take limit is five;
- held/equipped offered items count toward the five;
- Escape remains available.

Body, Mind, Spirit, and the normal survival simulation appear when Nadir reaches the Tunnels.

This naturally prevents consuming opening food/water through Body before completing the loadout choice.

## OPEN-D02 - Starting clothes and offers
**Status:** DECIDED BY SIMON

Nadir begins wearing Pants in Legs and T-Shirt in Chest. Feet and both Hands start empty.

Starting clothes are not opening offers and do not count against the five-item take limit.

Opening offers remain:

- Pocket Knife x1
- Plastic Bottle x2, each containing water
- Canned Food x2
- Simple Lighter x1, Fuel 50 instance override
- Flashlight x1, Battery 20 instance override
- Spare Batteries x1
- Pain Killers x1
- Simple Backpack x1
- Glasses x1

---

# Equipment and carried inventory

## EQUIP-D01 - Current equipment slots
**Status:** DECIDED BY SIMON

Equipment slots are:

- Left Hand
- Right Hand
- Head
- Eyes
- Trinket 1
- Trinket 2
- Chest
- Back
- Legs
- Feet

`Neck` is removed and replaced by the two Trinket slots.

No Trinket effects/items should be invented merely because the slots exist.

## EQUIP-D02 - Hands are universal holding slots
**Status:** DECIDED BY SIMON

Every ordinary movable card may be placed in either Hand without requiring an authored `equip Hand` declaration.

Anchored world cards and Nadir-state cards cannot be placed in Hands.

A card in Hand is active/equipped under the general equipment model, but it only gains a special effect when an authored effect applies there.

Held cards do not consume carried storage capacity.

## INV-D01 - Carried storage uses size capacities
**Status:** DECIDED BY SIMON

There is no permanent generic five-card carried Inventory limit.

Items use size classes:

- Small
- Medium
- Large

Pants add 2 Small capacity.

Simple Backpack adds 5 Medium capacity in the main game.

For current packing:

- Small capacity accepts Small only;
- Medium accepts Small or Medium;
- Large accepts Small, Medium, or Large;
- allocate carried items to the smallest compatible available capacity first.

Equipment slots, including Hands, do not consume carried storage capacity.

---

# Water and survival items

## WATER-D01 - Puddle of Water
**Status:** DECIDED BY SIMON

Puddle of Water is Anchored and has visible Value:

`Water 3`

A card may be filled from the Puddle when it has Marker `container` and does not have Marker `contains-water`.

A successful fill:

- adds `contains-water` to the container;
- reduces Puddle `water` by 1.

At `water = 0`, discard the Puddle.

For the current prototype one fill consumes exactly one Water unit.

Do not invent litres, partial fills, container capacities, fluid types, contamination, or direct drinking from the Puddle.

The Action duration for filling is still OPEN and must not be invented.

## FLASHLIGHT-D01 - Flashlight instance state
**Status:** DECIDED BY SIMON

The opening Flashlight starts at Battery 20.

The Flashlight found in the Deep Tunnels Search deck starts at Battery 0.

Flashlight provides Vision +1 only while active in a Hand and Battery > 0.

Exact Battery drain rate is still OPEN.

---

# Vision, Search, and rooms

## VISION-D01 - Effective Vision
**Status:** DECIDED BY SIMON

Mind has base Vision 4.

Current additive modifiers include:

- Glasses in Eyes: +1
- active Flashlight in Hand with Battery > 0: +1
- Bright: 0
- Dim: -1
- Twilight: -3
- Darkness: -4

Current effective-Vision consequences:

- <=0: cannot Search; travel x3
- 1: Search x3; travel x2
- 2: Search x2
- >=3: Search normal

## SEARCH-D01 - Search deck timing and persistence
**Status:** DECIDED BY SIMON

Search is an Action with an authored base duration on the Search deck.

Each room's Search deck is shuffled once when a new game is created, including undiscovered rooms. The order then remains fixed for that run.

No reshuffle/reroll and no visible remaining-card count.

Search decks disappear when exhausted.

---

# UI correction decisions

## UI-D01 - Equipment targets must remain legible during dragging
**Status:** DECIDED BY SIMON

Equipment slots are currently too small and are obscured by full-size dragged cards.

The correction must provide larger, clearly distinguishable targets. Slot labels and legality/highlight feedback must remain visible before release.

A reduced equipment-preview representation of the dragged card is preferred when dragging over the equipment area, provided underlying drag/drop semantics remain unchanged.

## UI-D02 - Inventory/equipment divider owns layout space
**Status:** DECIDED BY SIMON

The `Inventory & equipment` header/divider must reserve actual layout space. Cards and equipment content begin below it and placement bounds must use the usable content area.

No card may render partly beneath the divider.

## UI-D03 - Cards need stronger attribute legibility and less white dominance
**Status:** DECIDED BY SIMON

Cards should not read as large bright white rectangles dominating the scene.

Marker icons, Value presentation, and Value numbers must be materially larger and readable without mouseover.

Hover remains for explanation/description, not basic identification.

## UI-D04 - Background art is subordinate to gameplay
**Status:** DECIDED BY SIMON

Room backgrounds currently appear too zoomed, grainy, and visually dominant.

Renderer treatment should preserve aspect ratio, avoid obvious over-enlargement/aggressive cropping, and lower background prominence through brightness/saturation/contrast treatment and/or a subtle dark overlay.

Do not regenerate, replace, convert, or edit source art during this correction pass.

Desired visual hierarchy:

1. cards and interaction feedback;
2. room UI;
3. background artwork.

---

# Deferred/open systems

## PROCESS-OPEN-01 - Flesh Wound healing details
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

The exact player-facing healing progress name and any unfinished Infection-over-time behavior remain undecided unless a focused design document has since superseded this entry.

## PROCESS-OPEN-02 - Burn Wound healing
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Exact healing Process rules/rate/duration remain undecided.

## PROCESS-OPEN-03 - Fever recovery
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Exact recovery Process duration/behavior remains undecided.

## PROCESS-OPEN-04 - Rat Meat cooking
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Cooking is intended to be a Process, but concrete timing/effects remain undecided.

## PROCESS-OPEN-05 - Dead Rat spoilage
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Spoilage as a Process and Dead Rat -> Rotten Meat identity replacement are part of the design direction, but the exact concrete timing/rate must not be invented if not already explicitly decided in a focused document.

## EQUIP-OPEN-01 - Trinket content
**Status:** DEFERRED
**Priority:** P3

The two Trinket slots are decided. Which future items use them and what effects they provide are not.

## TORCH-OPEN-01 - Torch implementation
**Status:** DEFERRED
**Priority:** P3

Torch may later provide portable light, but recipe, burn duration, and other behavior are not part of the current prototype.

---

# Maintenance rule

When Simon makes a new explicit design decision:

1. update the relevant existing entry rather than creating a contradictory duplicate;
2. remove obsolete prototype rules from the current decision register;
3. move genuinely unresolved implementation-blocking values into the decision queue;
4. do not turn ChatGPT suggestions into decisions;
5. keep runtime-data TODOs out of JSON and record them here instead.
