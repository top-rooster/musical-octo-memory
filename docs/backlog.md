# Safe Room - design decision backlog

This file is a compact decision register, not an implementation plan.

Most importantly: **a suggestion is not a decision.**

## Status

- **DECIDED BY SIMON** - Simon explicitly chose this.
- **OPEN - SIMON TO DECIDE** - a real design question still needs an answer.
- **SUGGESTED BY CHATGPT** - recommendation only.
- **DEFERRED** - intentionally not worth deciding yet.

## Priority

- **P0 - Now** - foundational/current prototype.
- **P1 - Soon** - important to the core model.
- **P2 - Later** - answer before implementing that system.
- **P3 - Parked** - preserve without spending attention now.

## Conversation rule

Normally discuss only the single highest-priority open decision.

---

# Current decision queue

1. **SURV-01 [P2]** - Are there other permanent survival pressures beyond Hydration and Satiation?

---

# Core card model

## CARD-D01 - All interactable entities are cards
**Status:** DECIDED BY SIMON

Every interactable entity is a card. Confirmed examples: materials, machines, food, Nadir, and passages to other rooms.

## CARD-D02 - Universal card presentation
**Status:** DECIDED BY SIMON

Every card has a title/name, a picture, and zero or more optional attributes.

## CARD-D03 - Attributes define card function
**Status:** DECIDED BY SIMON

Cards have no separate categories, tags, capability lists, or card classes. A card is functionally defined only by its attributes unless a concrete future need proves that insufficient.

## ATTR-D01 - Attribute representation and names
**Status:** DECIDED BY SIMON

All card attributes are visible and represented by icons. There are no hidden/internal card attributes in the current model.

- **Marker** - icon only; presence carries meaning (`Player`, `Anchored`, `Powered`, `Cutting Tool`, `Dressed`, `Fabric`, `Container`, `Contains-Water`, and `Sterilized`).
- **Value** - icon plus integer (`Hydration 50`, `Satiation 50`, `Progress 42`, `Durability 80`, `Spoilage 63`, `Infection 50`).

Unless Simon explicitly states a different range for a specific Value, every Value is bounded and clamped from **0 to 100**.

`Sterilized` is the Marker used on fabric that is safe to use as wound dressing. `Fabric+Sterilized` therefore means a source card must carry both Markers. Wounds do not have a separate cleanliness Value; their cleanliness/infection state is represented by the `Infection` Value.

Parser-facing Marker names may use hyphens for ease of parsing. `Contains-Water` is displayed in the UI as **Contains Water**.

## ATTR-D02 - Anchored
**Status:** DECIDED BY SIMON

`Anchored` is a Marker that prevents a card from coming to rest outside its home zone.

Anchored does not prevent:

- repositioning within the home zone,
- crossing zone boundaries while being dragged,
- dragging the card onto another card in another zone for a legal interaction.

If an anchored card is released onto bare space in another zone, or otherwise released without a legal interaction that accepts it, it returns to its home zone.

A legal cross-zone interaction does not transfer the anchored card's home zone.

## ATTR-D03 - Durability is an ordinary Value
**Status:** DECIDED BY SIMON

Durability is represented through the normal visible attribute system as a `Durability` **Value**.

A tool does not need a generic `Reusable` Marker. Its functional role is represented by specific capability Markers such as `Cutting Tool`, while its current wear/state can be represented by `Durability`.

The exact wear rate, zero-durability behavior, and which interactions change Durability are not yet fixed. Durability uses the default 0-100 Value bounds unless Simon later states otherwise.

## ATTR-D04 - Process progress may have a process-specific visible name
**Status:** DECIDED BY SIMON

Most Processes use a visible progress Value, but the player-facing name of that Value should be specific to the Process when that improves understanding.

The different labels do **not** create different mechanics or attribute types. Code-wise/mechanically, they are the same Process progress concept.

Confirmed example:

- `Dead Rat` is a single-card Process whose progress Value is shown to the player as `Spoilage`. Spoilage increases over game time, and at **100** the Dead Rat is discarded and a `Rotten Meat` card is drawn in its place.

Other Processes may likewise use a contextual player-facing name instead of the generic word `Progress`. Their exact UI labels are not fixed unless explicitly decided.

## CARD-D04 - Master definition and card instances
**Status:** DECIDED BY SIMON

Each reusable card type has one **master definition** containing name/title, picture, and starting attributes.

Each spawned card is a separate **card instance**. It receives the starting attributes and thereafter maintains its own current attributes independently.

## CARD-D05 - First-release card face
**Status:** DECIDED BY SIMON

For the first release, a normal card shows only title/name, picture, and visible attributes. Description text is deferred.

## CARD-D06 - Current relationship model is complete for now
**Status:** DECIDED BY SIMON

For now, the game assumes the currently defined card relationship forms are sufficient. Do not add a separate containment, attachment, equipment, fuel, or similar relationship mechanism unless a concrete future design need cannot be expressed with the existing model.

- **Stack** exists only to visually reduce card clutter in the **Room** zone. It has no mechanical meaning.
- **Process** represents unattended ongoing change/work and may exist in Room or Inventory.
- **Connection** represents a persistent mechanically meaningful relationship and may exist in Room or Inventory.
- **Action** is not a persistent relationship; it is Nadir-performed work resolved through the Action window.

This closes the earlier CARD-07 question for now rather than asserting that every conceivable future relationship must fit these forever.

## CARD-D07 - Identity changes use discard and draw
**Status:** DECIDED BY SIMON

Preserve the physical-card analogy when a card becomes a materially different card identity.

The old card is **discarded** and the replacement card is **drawn**. The replacement appears at the same location as the discarded card so the transformation does not move the represented thing spatially.

Confirmed example:

- at `Spoilage 100`, discard the `Dead Rat` card and draw a `Rotten Meat` card at exactly the Dead Rat's previous location.

This is distinct from ordinary state changes. A card can still change its own Values or Markers in place without being discarded when it remains the same card identity.

Do not model a material identity change by silently switching an existing instance to another master definition or overriding its master name/picture.

## DATA-D01 - Card master data is authored in terse text files
**Status:** DECIDED BY SIMON

All authored card data is stored in plain text files and loaded by the game code. Card master definitions must not be duplicated as hard-coded TypeScript/React constants.

The authoring format follows the earlier Safe Room **Data language** direction: extremely low boilerplate, easy to edit from a phone, no required tabs or braces, no explicit list/array lengths, and no repeated field names such as `name` or `damage` where context already makes them obvious.

The detailed authoring constraints live in `docs/data-language.md`. Code may parse, validate, index, and transform this data into runtime structures, but the text files remain the authored source of truth.

## DATA-D02 - Level design is loaded from the same text-data system
**Status:** DECIDED BY SIMON

The game's authored level design is also stored as text data and read by the code rather than being embedded in room-specific setup code.

At minimum this includes rooms and the card instances/starting state placed in them. As more authored world relationships become implementation-relevant, extend the text-data format rather than moving level facts into application code.

Card data and level design should share the same low-boilerplate authoring philosophy and parser/tooling family described in `docs/data-language.md`.

## DATA-D03 - Actions and Processes have explicit time
**Status:** DECIDED BY SIMON

Every Action and Process must explicitly state its time in authored data. Instant Actions use `0m`; there is no implicit duration.

Confirmed examples include `Sleep 8h`, `Skin 15m`, `Drink 0m`, and a repeating Body Hydration Process evaluated every `15m`.

## DATA-D04 - Conditional numeric bands use explicit range syntax
**Status:** DECIDED BY SIMON

Conditional Value bands are written using `start..end` rather than comparison operators.

The current Flesh Wound data uses:

- `if Infection 0..24 progress +2`
- `if Infection 25..49 progress +1`
- `if Infection 50..74 progress +0`
- `if Infection 75..100 progress -1`

The bands are non-overlapping and cover the full default `0..100` Infection range.

## CARD-10 - Other non-interactable state and temporary conditions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Temporary conditions applying to Nadir are confirmed as cards. It remains undecided whether other non-interactable state or temporary conditions elsewhere also use cards.

## CARD-12 - Card descriptions
**Status:** DEFERRED
**Priority:** P2

Descriptions are not part of the first release. Revisit later if cards need explanatory or narrative text beyond title, picture, and visible attributes.

---

# Zones, positioning, movement, and card combinations

## ZONE-D01 - Two top-level zones: Room and Inventory
**Status:** DECIDED BY SIMON

The play space has two zones:

- **Room** - the currently viewed physical space; its contents change when Nadir moves to another room.
- **Inventory** - persistent cards that remain on screen when Nadir moves to another room.

The previously proposed separate Nadir zone is removed. Nadir's cards live in Inventory.

Inventory contains both ordinary persistent possessions and Nadir's persistent/condition cards. `Anchored`, rather than a separate zone, prevents Nadir's cards from being ordinarily moved into Room.

## MOVE-D01 - Room/Inventory transfer
**Status:** DECIDED BY SIMON

Cards can normally be dragged between Room and Inventory when legal. `Anchored` prevents a card from coming to rest outside its home zone while preserving cross-zone dragging and legal card-on-card interaction.

## MOVE-D02 - Free positioning within a zone
**Status:** DECIDED BY SIMON

Every card can be positioned within its current zone to the player's liking, including anchored cards.

## MOVE-D03 - No accidental overlap
**Status:** DECIDED BY SIMON

Cards may not overlap in ordinary placement. Deliberately combined cards snap into a neat aligned presentation.

## MOVE-D04 - Inventory capacity is five non-anchored cards for now
**Status:** DECIDED BY SIMON

Inventory has a capacity limit. For now, it can contain at most **five non-anchored cards**.

`Anchored` cards do not count toward this limit. This means Nadir's Body, Mind, Spirit, and temporary anchored condition cards do not consume the ordinary carrying capacity.

Every non-anchored card instance in Inventory occupies one of the five slots. Inventory does not use Stacks, so identical carried cards remain separate and each consumes one slot.

The number five is a tuning value rather than a permanent constant and may be changed later if playtesting shows a better number.

## MOVE-D05 - Card zone changes are always free
**Status:** DECIDED BY SIMON

A legal card transfer between **Room** and **Inventory** is always free.

Changing a card's zone does not, by itself:

- advance game time,
- create noise,
- or create another gameplay consequence.

When a transfer is legal, the transfer itself has no cost.

## MOVE-D06 - Only Anchored and Inventory capacity block transfer for now
**Status:** DECIDED BY SIMON

For now, the only reasons a card can be prevented from coming to rest in the other top-level zone are:

- the card has `Anchored` and the destination is not its home zone;
- Inventory is already at its five non-anchored-card capacity.

There are no additional contextual Room/Inventory transfer blockers in the current design.

## STACK-D01 - Stack, Process, Connection
**Status:** DECIDED BY SIMON

The three persistent forms of deliberate card combination are **Stack**, **Process**, and **Connection**.

### Stack

A `Stack` exists solely to reduce visual card clutter in the Room zone by compressing identical cards. Represented cards remain separate instances, individual cards need not all remain exposed, the Stack shows a count, and it has no mechanical effect merely because it exists.

### Process

A `Process` is unattended work/change that continues while Nadir spends game time doing other things. A Process may involve multiple cards or may be embodied by a single card whose state changes over time.

### Connection

A `Connection` is a persistent mechanically meaningful relationship. It begins immediately, lasts until the player separates the cards, and relationship-dependent effects disappear when it is broken.

Example: a machine connected to a power outlet gives the machine the `Powered` Marker. Disconnecting removes `Powered`. One outlet can power only one card at a time.

`Action` is a separate card-on-card interaction type, not a persistent stacking form; see ACTION-D01.

## STACK-D02 - Process progress is mechanically common but player-facing names may differ
**Status:** DECIDED BY SIMON

Most Processes use a visible progress Value on a 0-100 scale unless a specific Process states otherwise.

Mechanically/code-wise, this is the same Process progress concept regardless of the player-facing label. The visible name can be chosen per Process to make its meaning clearer.

`Spoilage` on `Dead Rat` is the confirmed example of a process-specific progress label. Other contextual labels may be chosen later as needed; do not treat any suggested label as decided until Simon chooses it.

There is no universal progress calculation. Each Process defines its own progression from relevant state and elapsed game time.

A Process progresses only when game time advances through an **Action**. Relevant conditions can speed up, slow down, stop, or reverse it.

Examples:

- `Dead Rat` is a single-card Process whose visible progress is `Spoilage`; at 100 the Dead Rat is discarded and `Rotten Meat` is drawn at the same location,
- `Rat Meat` on a lit camp fire progresses while the fire is lit and Actions advance game time,
- fabric sterilization progresses while its required cards form the Process and Actions advance game time,
- a bowl on a condenser can progress according to room moisture, room temperature, and elapsed game time created by Actions,
- `Flesh Wound` and `Burn Wound` are single-card Processes whose progress represents healing,
- `Fever` is a single-card Process whose progress represents recovery and is discarded when complete,
- Body has a repeating Process that reduces `Hydration` by 2 every 15 minutes of elapsed game time.

## PROCESS-D01 - Processes are unattended
**Status:** DECIDED BY SIMON

The name **Process** is reserved for ongoing change that does not require Nadir's continuous personal involvement.

Starting or existing as a Process does not itself advance game time. A Process advances when an **Action** advances game time.

A Process does not have to be a multi-card stack. `Dead Rat` spoilage, `Flesh Wound`, `Burn Wound`, `Fever`, and Body's Hydration loss are confirmed single-card Processes.

Concrete multi-card examples include putting `Rat Meat` on a lit camp fire to start cooking, and combining an appropriate heat-source card, a water-filled container, and non-sterilized `Fabric` to sterilize the fabric. These Processes continue unattended as Nadir performs Actions that advance game time.

## PROCESS-D03 - Process progress labels are UI names over the same mechanic
**Status:** DECIDED BY SIMON

Most Processes need a progress Value, but the generic word `Progress` is not required as the player-facing label.

A Process may expose that same underlying mechanical progress through a context-specific Value name that helps the player understand what is changing. This is a UI/player-facing naming difference only; it does not create a separate progress system in code.

`Dead Rat` is the confirmed example: its single-card Process exposes progress as `Spoilage`, and at `Spoilage 100` the Dead Rat is discarded and `Rotten Meat` is drawn at the same location.

A Process can also directly change another Value on its card rather than using a separate completion progress Value. Body's Hydration loss is a confirmed example: every `15m` of elapsed game time it applies `Hydration -2`.

## PROCESS-D04 - Fabric sterilization is a one-hour Process
**Status:** DECIDED BY SIMON

Sterilizing fabric by boiling is a **Process**, not an Action.

The Process requires three participating cards:

1. a `Campfire` or another card carrying the appropriate heat-source Marker,
2. a card carrying `Contains-Water`,
3. a card carrying `Fabric` without `Sterilized`.

The Process takes **1 hour** of elapsed game time created by Actions. On completion, the water card loses `Contains-Water` and the fabric gains `Sterilized`.

---

# Universal interaction model

## INTERACT-D01 - Every gameplay interaction is card-on-card
**Status:** DECIDED BY SIMON

Every gameplay interaction is initiated by putting one card on top of another card.

An interaction always has a dragged **source** card and a receiving **target** card.

Bare zone space can receive a card for ordinary movement/placement, but that is movement rather than a gameplay interaction.

## INTERACT-D02 - At most one interaction per source/target pair
**Status:** DECIDED BY SIMON

A given source-card/target-card pair supports at most one interaction.

If the pair is legal, there is a single interaction to perform. The game never needs to ask the player to choose between multiple Actions, Processes, Connections, or other outcomes for the same dragged source and receiving target.

No interaction-selection or disambiguation UI is required for a card pair.

## INTERACT-D03 - Interaction legality can match source attributes against target requirements
**Status:** DECIDED BY SIMON

Card interaction legality is driven by attributes rather than by hard-coded card identity alone.

A target may define an interaction that accepts source cards carrying one or more required Markers. Compound requirements use `+` in authored data.

Confirmed examples:

- `Dead Rat` accepts the `Cutting Tool` Marker as the starter for `Skin` / the `Skinning` Action. A knife works because it has `Cutting Tool`, not because the interaction specifically names the knife master definition.
- Body accepts ingestible cards for eating.
- A wound accepts a source carrying `Contains-Water` for `Clean`.
- A wound accepts a source carrying both `Fabric` and `Sterilized` for `Dress`, authored as `Fabric+Sterilized`.

## INTERACT-D04 - Consumption/reuse is an interaction result, not a generic reusable classification
**Status:** DECIDED BY SIMON

There is no need for a generic `Reusable` Marker on tools.

Cards instead describe what they can do through specific functional attributes, while each interaction decides what happens to its participants:

- a knife is a `Cutting Tool` with a `Durability` Value;
- the Skinning Action returns the cutting tool and discards the dead rat;
- an ingestible card may be discarded/consumed by the ingestion interaction;
- drinking from a Plastic Bottle removes `Contains-Water` from the bottle without replacing the bottle card.

## INTERACT-D05 - Drops commit without confirmation
**Status:** DECIDED BY SIMON

A legal card-on-card drop commits its interaction immediately. The game does **not** add confirmation dialogs or a second "are you sure?" step, including for dangerous interactions.

The player should receive whatever preview, warning, or risk information Nadir currently understands **before** the drop. Once the player drops the card on the legal target, that is the decision.

An `Action` window is part of executing and displaying an Action, not a confirmation prompt. Dropping the source card commits the Action before that window runs.

## INTERACT-D06 - Only Actions advance game time
**Status:** DECIDED BY SIMON

All game-time advancement requires an **Action**.

Immediate interactions, movement, Stack changes, Process creation, and Connection changes do not advance game time by themselves. If an interaction needs to consume time, it must be modeled as an Action. An instant Action explicitly uses `0m` and therefore advances zero minutes.

Processes respond to elapsed game time but never create that elapsed time themselves.

This resolves the time portion of the earlier INTERACT-04 question. Noise behavior is intentionally deferred with the rest of the noise mechanic.

---

# Discovery, risk, target highlighting, and previews

## DISC-D01 - Discovery is part relational understanding and part exploratory play
**Status:** DECIDED BY SIMON

The game should support discovery rather than expose every causal relationship immediately.

Understanding can come from:

- **relational understanding** - visible cards, attributes, room state, and their relationships let the player infer danger/opportunity;
- **exploratory play / knowledge unlocks** - interaction, observation, reading, or other discovery can improve what Nadir and the player understand later.

The intended progression can move from unknown to suspected to understood.

## RISK-D01 - Severe danger must be reasonably foreseeable
**Status:** DECIDED BY SIMON

Exploratory play should not inflict severe punishment that the player had no reasonable way to anticipate.

Danger can be telegraphed by visible relationships or by Nadir articulating what he understands. Telegraphing danger does not require revealing an exact probability or exact outcome.

Design example: a flooded room with exposed electrical outlets is obviously dangerous from visible elements and their relationship; Nadir may explicitly articulate that danger. The example is not a universal electrical-simulation specification.

## PREVIEW-D01 - Direct known stat preview
**Status:** DECIDED BY SIMON

Direct visible stat consequences can preview before the drop, e.g. `Satiation 67 -> 82` for Rat Meat, `Satiation 67 -> 92` for Canned Food, or `Hydration 50 -> 75` on Body.

## PREVIEW-D02 - Previews are knowledge-dependent, not omniscient
**Status:** DECIDED BY SIMON

Previews reflect what Nadir/the player currently understands.

- Known consequences may be shown accurately, including indirect consequences when understood.
- Undiscovered relationships should not automatically be spoiled by hovering cards together.
- Known meaningful danger may be communicated qualitatively even when the exact result remains uncertain.
- The UI should not reveal a complete causal future and turn play into exhaustive deterministic planning.

Design example: repairing an exposed electrical outlet can carry a known risk of shock. A shock can produce a burn-wound condition; if the risk outcome does not produce a shock, the repair can instead result in a functional outlet.

## PREVIEW-D03 - Uncertain likelihoods are calibrated but non-numeric
**Status:** DECIDED BY SIMON

When Nadir understands an uncertain risk, the UI should communicate likelihood clearly enough to distinguish materially different odds, such as roughly even chances from a clearly favored outcome.

Do not normally expose the underlying percentage or numerical odds. Coarse labels such as only `Low`, `Moderate`, and `High` are not precise enough.

The exact user-facing vocabulary is provisional and not locked. Revisit after UI testing if needed.

## PREVIEW-D04 - Multiple known direct changes are shown simultaneously
**Status:** DECIDED BY SIMON

When dragging a source would cause several known direct attribute changes, show all of those known changes simultaneously on the affected cards/attributes. Do not collapse them to one representative change or require hovering a particular target to reveal additional known direct effects.

## TARGET-D01 - Legal interaction targets highlight
**Status:** DECIDED BY SIMON

While dragging, every card that can legally receive it as an interaction target highlights. Legal movement destinations may use a placement affordance but are not interaction targets.

## TARGET-D02 - One common legality language, with Stack exception
**Status:** DECIDED BY SIMON

Use one common target-highlight language across Actions, Processes, Connections, consumption, repair, and other mechanically meaningful interactions. Do not use separate target colors merely to identify interaction type.

A legal target is green while available and yellow when the dragged card is currently over it and release would commit the interaction.

**Stack is the exception:** a legal Stack target remains green even while hovered/release-ready, because Stack has no gameplay consequence beyond visual compression.

## TARGET-D03 - Dangerous legal interactions keep normal legality colors
**Status:** DECIDED BY SIMON

Danger does not alter the green/yellow legality language. A dangerous interaction that is legal still uses the normal legal-target highlight and yellow release-to-commit state.

Known danger, uncertainty, or risk is communicated separately through previews, warnings, or risk presentation. Target color answers whether the interaction is valid, not whether it is safe.

## PREVIEW-04 - Long-term deterministic consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Preview only immediate understood effects or also known longer-term effects?

## TARGET-03 - Inaccessible interactions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Remain hidden or sometimes appear disabled?

## TARGET-04 - Highlight intensity
**Status:** DEFERRED
**Priority:** P3

Test visually.

---

# Nadir and survival

## NADIR-D01 - Nadir cards live in Inventory
**Status:** DECIDED BY SIMON

Nadir's representation is part of the persistent **Inventory** zone. There is no separate Nadir zone.

For now, his persistent representation is divided across three cards:

- **Body** - physical state,
- **Mind** - cognitive / will state,
- **Spirit** - emotional / spiritual state.

## NADIR-D02 - Character state uses card attributes
**Status:** DECIDED BY SIMON

Relevant character state lives as attributes on Nadir's cards rather than in a separate character-stat UI.

## NADIR-D03 - Nadir may be represented by multiple cards
**Status:** DECIDED BY SIMON

Nadir is not required to fit on a single card. His representation may span several simultaneously visible cards in Inventory.

## NADIR-D04 - Three persistent Nadir cards: Body, Mind, Spirit
**Status:** DECIDED BY SIMON

For now, Nadir has three persistent representation cards:

1. **Body** - physical state;
2. **Mind** - cognitive / will state;
3. **Spirit** - emotional / spiritual state.

More persistent Nadir cards may be added later if a concrete need appears.

## NADIR-D05 - Temporary conditions are cards in Inventory
**Status:** DECIDED BY SIMON

Conditions currently applying to Nadir are represented as temporary cards in Inventory rather than being forced into Body, Mind, or Spirit.

Examples explicitly given by Simon include `Exhausted`, `Flesh Wound`, `Burn Wound`, and `Fever`.

## NADIR-D06 - Condition lifecycle is condition-specific
**Status:** DECIDED BY SIMON

Temporary Nadir conditions do not share one universal expiry rule.

### Exhausted

`Exhausted` is removed through sleep:

1. drag `Exhausted` onto **Body**,
2. the interaction is `Sleep`,
3. `Sleep` is an **8-hour Action**,
4. when the Action completes, the `Exhausted` card is discarded.

Any effects of sleep beyond removing `Exhausted` are not yet decided.

### Flesh Wound and Burn Wound

`Flesh Wound` and `Burn Wound` are **single-card Processes**.

- Each wound has a process progress Value from 0 to 100 representing healing. Its eventual player-facing label can be process-specific; no exact label is fixed yet.
- The wound card is discarded when its process progress reaches 100.
- Each wound starts at `Infection 50`.
- `Infection` uses the default **0 to 100** Value bounds. Lower is better; higher is worse.
- A wound can carry the `Dressed` Marker. Once added, `Dressed` remains for the lifetime of that wound card.
- Water is represented by a `Contains-Water` Marker on a container card such as a `Plastic Bottle`.
- Cleaning a wound is a **15-minute Action**. It reduces `Infection` by 40, clamped at 0, and removes `Contains-Water` from the source card.
- Dressing a wound is a **15-minute Action** requiring a source carrying both `Fabric` and `Sterilized`. It consumes the fabric card and adds `Dressed` to the wound.
- Fabric can be sterilized by a one-hour boiling Process requiring an appropriate heat-source card, a card with `Contains-Water`, and non-sterilized `Fabric`. On completion, the water card loses `Contains-Water` and the fabric gains `Sterilized`.
- `Dressed` improves healing over time and causes Infection to decrease over time; the exact rates are still open.
- Severe Infection can spawn `Fever`; the exact threshold remains open.

`Flesh Wound` has a confirmed repeating healing Process evaluated every **15 minutes** of elapsed game time:

- `Infection 0..24` -> progress `+2`
- `Infection 25..49` -> progress `+1`
- `Infection 50..74` -> progress `+0`
- `Infection 75..100` -> progress `-1`

`Burn Wound` uses the injury Process model but its exact healing rate is still undecided. It also carries another Value/effect that accelerates loss of Body `Hydration`; the exact burn modifier is still open.

### Fever

`Fever` is a **single-card Process**.

- It has a process progress Value from 0 to 100 representing recovery as Actions advance game time. Its eventual player-facing label can be process-specific; no exact label is fixed yet.
- The Fever card is discarded when its process progress reaches 100.
- Dragging a card carrying `Contains-Water` onto a Fever card discards that Fever card and removes `Contains-Water` from the source card.

The water-on-Fever interaction does not advance game time unless it is later redesigned as an Action. The exact Fever recovery rate/duration is not yet fixed.

## NADIR-D07 - All Nadir cards are Anchored to Inventory
**Status:** DECIDED BY SIMON

All of Nadir's cards, including Body, Mind, Spirit and temporary condition cards, have `Anchored` with **Inventory** as their home zone.

They can cross into Room while being dragged but cannot come to rest there as ordinary placement. If released in Room without a legal accepting card interaction, they return to Inventory. They may be dropped onto a Room card for a legal interaction without changing home zone.

## WOUND-D01 - Severe Infection slows healing and creates Fever
**Status:** DECIDED BY SIMON

If a wound's `Infection` becomes too high:

- healing over time can be reduced or reversed;
- severe Infection spawns a `Fever` condition card.

Flesh Wound now has explicit Infection-dependent healing bands. The exact Infection threshold for Fever spawning is not yet fixed.

## WOUND-D02 - Wound treatment state uses Infection Value and Dressed Marker
**Status:** DECIDED BY SIMON

Wound treatment state is represented directly on the wound card:

- `Infection` is a **Value** from 0 to 100 by the default Value rule, where lower is better and higher is worse;
- `Dressed` is a **Marker** whose presence means the wound is currently dressed.

There is no separate wound `Clean` Value. Cleaning, dressing, natural worsening, and severe-infection effects all operate on the single `Infection` axis.

Once a wound gains `Dressed`, it keeps that Marker until the wound card itself is discarded. There is no dressing-expiry/removal mechanic in the current design.

## WOUND-D03 - Contains-Water cleans wounds; Fabric+Sterilized dresses them
**Status:** DECIDED BY SIMON

A source card carrying `Contains-Water` can clean a wound. A source carrying both `Fabric` and `Sterilized` can dress it.

Cleaning is a 15-minute Action, reduces Infection by 40 to a minimum of 0, and removes `Contains-Water` from the source card.

Dressing is a 15-minute Action, consumes the fabric source card, and adds `Dressed` to the wound.

## SURV-D01 - Hydration and Satiation are permanent Body survival Values
**Status:** DECIDED BY SIMON

Body currently has two permanent survival Values:

- `Hydration 50`
- `Satiation 50`

Reaching 0 in either causes game over.

## SURV-01 - Other permanent survival pressures
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should Body, Mind, or Spirit have other permanent survival Values beyond Hydration and Satiation, or should other pressures mostly be represented by temporary cards/Processes?

---

# Suggested implementation principles

These are ChatGPT suggestions, not Simon decisions.

- **IMPL-01:** keep interaction legality/state transitions outside one-off presentation code.
- **IMPL-02:** keep the parser/runtime model simple and let the text data remain the authored source of truth.
- **IMPL-03:** highlighting and committing should use the same legality rules.
- **IMPL-04:** preview and commit should use the same deterministic effect calculation for information the preview actually reveals.
- **IMPL-05:** knowledge state should gate what the preview layer reveals without changing the underlying interaction result.

---

# Maintenance rule

When Simon answers an open decision:

1. mark it **DECIDED BY SIMON**,
2. record the decision plainly,
3. remove it from the current queue,
4. promote the next relevant question by priority,
5. keep ChatGPT suggestions separate,
6. never rewrite a ChatGPT recommendation as if Simon proposed it.