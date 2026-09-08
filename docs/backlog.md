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

1. **MOVE-03 [P2]** - Can moving a card between Room and Inventory consume time or create consequences?
2. **INTERACT-03 [P2]** - Do some drops need confirmation?
3. **INTERACT-04 [P2]** - How do immediate interactions handle time/noise consequences?
4. **WOUND-03 [P2]** - Which interactions change `Clean` and `Dress`, and how?
5. **NADIR-02 [P2]** - Do all injuries use the condition-Process model?

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

- **Marker** - icon only; presence carries meaning (`Player`, `Anchored`, `Powered`, `Cutting Tool`, `Dress`).
- **Value** - icon plus integer (`Health 100`, `Progress 42`, `Durability 80`, `Spoilage 63`, `Clean 70`).

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

The exact scale, wear rate, zero-durability behavior, and which interactions change Durability are not yet fixed.

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

## STACK-D01 - Stack, Process, Connection
**Status:** DECIDED BY SIMON

The three persistent forms of deliberate card combination are **Stack**, **Process**, and **Connection**.

### Stack

A `Stack` exists solely to reduce visual card clutter in the Room zone by compressing identical cards. Represented cards remain separate instances, individual cards need not all remain exposed, the Stack shows a count, and it has no mechanical effect merely because it exists.

### Process

A `Process` is unattended work/change that continues while Nadir spends game time doing other things. A Process may involve multiple cards or may be embodied by a single card whose state changes over time.

### Connection

A `Connection` is a persistent mechanically meaningful relationship. It begins immediately, lasts until the player separates the cards, and relationship-dependent effects disappear when it is broken.

Example: a machine connected to a power outlet gains `Powered`; disconnecting removes it. One outlet can power only one card at a time.

`Action` is a separate card-on-card interaction type, not a persistent stacking form; see ACTION-D01.

## STACK-D02 - Process progress is mechanically common but player-facing names may differ
**Status:** DECIDED BY SIMON

Most Processes use a visible progress Value on a 0-100 scale.

Mechanically/code-wise, this is the same Process progress concept regardless of the player-facing label. The visible name can be chosen per Process to make its meaning clearer.

`Spoilage` on `Dead Rat` is the confirmed example of a process-specific progress label. Other contextual labels may be chosen later as needed; do not treat any suggested label as decided until Simon chooses it.

There is no universal progress calculation. Each Process defines its own progression from relevant state and elapsed game time.

A Process progresses as game time passes while Nadir is occupied with Actions or other activities. Relevant conditions can speed up, slow down, or stop it.

Examples:

- `Dead Rat` is a single-card Process whose visible progress is `Spoilage`; at 100 the Dead Rat is discarded and `Rotten Meat` is drawn at the same location,
- `Rat Meat` on a lit camp fire progresses while the fire is lit and Nadir spends time doing something else,
- a bowl on a condenser can progress according to room moisture, room temperature, and elapsed game time,
- `Flesh Wound` and `Burn Wound` are single-card Processes whose progress represents healing,
- `Fever` is a single-card Process whose progress represents recovery and that disappears when complete.

## PROCESS-D01 - Processes are unattended
**Status:** DECIDED BY SIMON

The name **Process** is reserved for ongoing change that does not require Nadir's continuous personal involvement.

Starting or existing as a Process does not itself force game time forward to completion. It advances when game time passes because Nadir is doing something else.

A Process does not have to be a multi-card stack. `Dead Rat` spoilage, `Flesh Wound`, `Burn Wound`, and `Fever` are confirmed single-card Processes.

Concrete multi-card example: putting `Rat Meat` on a lit camp fire starts a cooking Process. The meat cooks while the fire is lit and Nadir spends time on other activities.

## PROCESS-D03 - Process progress labels are UI names over the same mechanic
**Status:** DECIDED BY SIMON

Most Processes need a progress Value, but the generic word `Progress` is not required as the player-facing label.

A Process may expose that same underlying mechanical progress through a context-specific Value name that helps the player understand what is changing. This is a UI/player-facing naming difference only; it does not create a separate progress system in code.

`Dead Rat` is the confirmed example: its single-card Process exposes progress as `Spoilage`, and at `Spoilage 100` the Dead Rat is discarded and `Rotten Meat` is drawn at the same location.

## ACTION-D01 - Nadir-involved work is an Action
**Status:** DECIDED BY SIMON

Work that requires Nadir's personal involvement is called an **Action**, not a Process.

An Action is initiated through the same universal card-on-card interaction language, but it does not remain as an ongoing card stack.

When an Action is committed:

1. an Action window opens,
2. the window shows the Action and its participating cards,
3. the window animation represents the Action's duration,
4. the corresponding amount of game time advances,
5. the Action completes when the window animation terminates,
6. its Action-specific completion result is applied.

Actions do **not** use a Process progress attribute. The Action window itself communicates the ongoing completion/time passage.

The presence of a Nadir card is not required for something to be an Action. `Skinning` is an Action because Nadir personally performs the work even though the initiating cards are a cutting tool and a dead rat.

## ACTION-D02 - Skinning example
**Status:** DECIDED BY SIMON

Concrete Action example - skinning a dead rat:

1. `Dead Rat` accepts a source card carrying the `Cutting Tool` Marker as the starter for its `Skin` Action.
2. Dragging a cutting tool such as a knife onto `Dead Rat` exposes `Skin` on the rat card.
3. Dropping the cutting tool commits the Action.
4. A window appears showing `Skinning` and the two participating cards: the cutting tool and the dead rat.
5. The Action represents **15 minutes** of game time.
6. When the Action window animation terminates, the cutting tool returns to where it came from.
7. The `Dead Rat` is consumed/discarded.
8. A `Rat Skin` card and a `Rat Meat` card are drawn/created as the Action outputs.

A knife is one concrete `Cutting Tool` and has a `Durability` Value. The exact effect of Skinning on Durability has not yet been fixed.

The 15-minute duration and outputs belong to this Action; other Actions can have different durations and results.

## ACTION-D03 - Action completion is Action-specific
**Status:** DECIDED BY SIMON

There is no single universal Action completion transformation. An Action can return tools, discard inputs, draw output cards, change attributes, or combine those effects.

`Skinning` is the confirmed example.

## PROCESS-D02 - Process completion is Process-specific
**Status:** DECIDED BY SIMON

There is no single universal Process completion transformation. Each Process defines its own result when its progress reaches the completion state.

A Process may discard cards, draw replacement/output cards, change attributes, separate its participants, remove itself, or combine such results.

Confirmed examples include:

- at `Spoilage 100`, `Dead Rat` is discarded and `Rotten Meat` is drawn at the same location;
- `Flesh Wound`, `Burn Wound`, and `Fever` remove themselves when their recovery/healing progress reaches 100.

## STACK-D03 - Dragging from a Stack peels off one card
**Status:** DECIDED BY SIMON

Dragging a Stack separates its top card as an individual card.

- Stack 3 -> dragged card + Stack 2.
- Stack 2 -> dragged card + ordinary card.
- Count 1 is never presented as a Stack.

The Stack count is presentation, not currently a normal card `Value` attribute.

## STACK-D04 - Stack members must be identical now
**Status:** DECIDED BY SIMON

Cards can share a `Stack` only when they come from the same master definition and have identical current attributes: same Marker set, same Values, same Value numbers.

## STACK-D05 - No Stacks in Inventory
**Status:** DECIDED BY SIMON

`Stack` presentation is not used in the Inventory zone.

Identical cards carried in Inventory remain separate visible card instances. Each non-anchored instance therefore counts separately against the provisional five-card Inventory capacity.

With the current two-zone model, Stack presentation is confined to Room.

## STACK-05 - Anchored participant in an ongoing Process
**Status:** DEFERRED
**Priority:** P3

If a future unattended Process needs an `Anchored` participant whose home is another zone, decide how that ongoing relationship is presented. There is no current concrete requirement; Nadir-performed work is now an Action and resolves in its window rather than remaining as an ongoing Process.

## MOVE-03 - Cost of taking/dropping
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can moving a card between Room and Inventory consume time or create consequences?

## MOVE-05 - Other reasons a card cannot change zones
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

`Anchored` handles fixed-home cards. Decide later whether capacity or contextual rules can also prevent transfer.

---

# Card-on-card interaction

## CORE-D04 - Eating
**Status:** DECIDED BY SIMON

Anything Nadir can eat or otherwise ingest must carry a visible Marker identifying it as ingestible. The exact final user-facing name of this Marker is not yet fixed.

Eating currently uses **Body** as the target. The ingestion Marker is what tells the interaction algorithm that the source can legally be dropped onto Body for ingestion.

## FOOD-D01 - Dead Rat spoils into Rotten Meat
**Status:** DECIDED BY SIMON

`Dead Rat` is a single-card Process whose visible progress Value is named `Spoilage`.

Spoilage increases over game time. At `Spoilage 100`:

1. discard the `Dead Rat` card;
2. draw a `Rotten Meat` card;
3. place the Rotten Meat at exactly the same location the Dead Rat occupied.

The exact rate/formula for Spoilage growth is not yet fixed.

## FOOD-D02 - Rotten Meat remains edible but has penalties
**Status:** DECIDED BY SIMON

`Rotten Meat` remains ingestible and therefore carries the ingestion Marker.

If Nadir eats Rotten Meat:

- the Rotten Meat is consumed;
- a mood debuff is applied to Nadir;
- one `Fever` card is created.

The exact representation, magnitude, and duration of the mood debuff are not yet decided.

## INTERACT-D01 - All interactions are card-on-card
**Status:** DECIDED BY SIMON

Every gameplay interaction is initiated by putting one card on top of another card. An interaction always has a dragged source card and a target card.

Moving a card within or between zones is movement rather than interaction. Bare zone space can receive a card for legal movement but is not an interaction target.

An interaction may resolve immediately, start an **Action**, create/change a Stack, start/alter a Process, create/change a Connection, draw cards, discard cards, or change attributes.

## INTERACT-D02 - At most one interaction per card pair
**Status:** DECIDED BY SIMON

A given source-card/target-card pair can support **at most one interaction**.

If the pair is legal, there is a single interaction to perform. The game never needs to ask the player to choose between multiple Actions, Processes, Connections, or other outcomes for the same dragged source and receiving target.

No interaction-selection or disambiguation UI is required for a card pair.

## INTERACT-D03 - Interaction legality can match source attributes against target requirements
**Status:** DECIDED BY SIMON

Card interaction legality is driven by attributes rather than by hard-coded card identity alone.

A target may define an interaction that accepts source cards carrying a required Marker. When the dragged source satisfies that requirement, the target can legally receive it and starts/resolves its one interaction for that pair.

Confirmed examples:

- `Dead Rat` accepts the `Cutting Tool` Marker as the starter for `Skin` / the `Skinning` Action. A knife works because it has `Cutting Tool`, not because the interaction specifically names the knife master definition.
- Nadir's ingestion interaction accepts cards carrying an ingestion Marker. That Marker is how the interaction algorithm knows the card can be dropped onto the relevant Nadir ingestion target; eating currently uses **Body**.

The exact data/configuration syntax for expressing target requirements and interaction effects remains undecided.

## INTERACT-D04 - Consumption/reuse is an interaction result, not a generic reusable classification
**Status:** DECIDED BY SIMON

There is no need for a generic `Reusable` Marker on tools.

Cards instead describe what they can do through specific functional attributes, while each interaction decides what happens to its participants:

- a knife is a `Cutting Tool` with a `Durability` Value;
- the Skinning Action returns the cutting tool and discards the dead rat;
- an ingestible card may be discarded/consumed by the ingestion interaction.

This replaces the earlier open question about a universal consumable-versus-reusable classification. Specific consumption rules remain interaction-specific.

## INTERACT-03 - Confirmation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should some drops require confirmation beyond the Action window or normal drop commitment?

## INTERACT-04 - Time/noise consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Action time behavior is decided by ACTION-D01. Processes consume elapsed game time indirectly as Nadir does other things. Other immediate interactions may still need separate time/noise rules.

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

Direct visible stat consequences can preview before the drop, e.g. `Hunger 67 -> 98` on Body.

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

## TARGET-D01 - Legal interaction targets highlight
**Status:** DECIDED BY SIMON

While dragging, every card that can legally receive the dragged card as an interaction target highlights. Legal movement destinations may use a placement affordance but are not interaction targets.

## PREVIEW-01 - Multiple affected attributes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much should be shown when several known attributes change?

## PREVIEW-04 - Long-term deterministic consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Preview only immediate understood effects or also known longer-term effects?

## TARGET-01 - Different highlights by interaction type
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

One validity language or different visuals for Action/Process/consume/repair/etc.?

## TARGET-02 - Dangerous but legal interactions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should dangerous legal interactions use the normal legal-target highlight, with danger communicated separately?

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
3. `Sleep` advances game time as an Action,
4. when the Action completes, the `Exhausted` card terminates/disappears.

The exact sleep duration and any effects beyond removing `Exhausted` are not yet decided.

### Flesh Wound and Burn Wound

`Flesh Wound` and `Burn Wound` are **single-card Processes**.

- Each wound has a process progress Value from 0 to 100 representing healing. Its eventual player-facing label can be process-specific; no exact label is fixed yet.
- The wound card disappears when its process progress reaches 100.
- Each wound has an `Infection` Value that rises over time if not adequately managed.
- Each wound has a `Clean` Value representing how clean the wound currently is.
- A wound can carry the `Dress` Marker to show that it is currently dressed.
- Cleaning raises or otherwise restores `Clean`, helping keep Infection down.
- `Dress` improves healing over time and causes Infection to decrease over time.
- When Infection becomes too high, the wound's healing rate is reduced.
- Severe Infection spawns a `Fever` condition card.

In addition, a `Burn Wound` has another Value that accelerates Nadir's dehydration over time while the burn exists. The final name/scale of this burn-specific Value and the exact representation of dehydration are not yet fixed.

The exact interactions, source cards, Action durations, rates, and formulas that change `Clean` or add/remove `Dress` are not yet decided. The exact Infection threshold for reduced healing / Fever spawning is also not yet decided.

### Fever

`Fever` is a **single-card Process**.

- It has a process progress Value from 0 to 100 representing recovery over game time. Its eventual player-facing label can be process-specific; no exact label is fixed yet.
- The Fever card disappears when its process progress reaches 100.
- Dragging a water container onto a Fever card removes that Fever card and empties the water container.

The exact Fever recovery rate/duration is not yet fixed. The exact representation of the now-empty container is also not yet decided. Whether treating Fever with water consumes game time has not yet been separately decided.

## NADIR-D07 - All Nadir cards are Anchored to Inventory
**Status:** DECIDED BY SIMON

All of Nadir's cards, including Body, Mind, Spirit and temporary condition cards, have `Anchored` with **Inventory** as their home zone.

They can cross into Room while being dragged but cannot come to rest there as ordinary placement. If released in Room without a legal accepting card interaction, they return to Inventory. They may be dropped onto a Room card for a legal interaction without changing home zone.

## WOUND-D01 - Severe Infection slows healing and creates Fever
**Status:** DECIDED BY SIMON

If a wound's `Infection` becomes too high:

- healing over time is reduced;
- severe Infection spawns a `Fever` condition card.

The exact Infection threshold or thresholds are not yet fixed.

## WOUND-D02 - Wound treatment state uses Clean Value and Dress Marker
**Status:** DECIDED BY SIMON

Wound treatment state is represented directly on the wound card:

- `Clean` is a **Value** representing current wound cleanliness;
- `Dress` is a **Marker** whose presence means the wound is currently dressed.

This preserves cleaning and dressing inside the existing visible attribute model rather than creating separate wound-treatment cards or a new relationship type.

Cleaning is intended to keep Infection down by improving `Clean`. A wound with `Dress` improves healing over time and causes Infection to decrease over time, as already decided.

The exact card interactions, materials, Action durations, Value changes, and rules for adding/removing `Dress` remain open in WOUND-03.

## WOUND-03 - Cleaning and dressing interactions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Which source cards can clean or dress a wound, are those interactions Actions, how much do they change `Clean`, when is `Dress` added/removed, and do those interventions consume materials or time?

## BURN-D01 - Burn Wounds accelerate dehydration
**Status:** DECIDED BY SIMON

A `Burn Wound` carries a Value whose effect is to accelerate Nadir's dehydration over game time.

This confirms dehydration as a survival pressure in the design, but not its final representation. The burn Value's name/scale, dehydration's representation, and the exact acceleration formula remain open.

## FEVER-D01 - Three Fever cards kill Nadir
**Status:** DECIDED BY SIMON

`Fever` is a temporary condition card applying to Nadir. If Nadir accumulates **three Fever cards**, he dies.

This establishes Fever accumulation as a lethal escalation path from unmanaged wound Infection or other effects such as eating Rotten Meat.

## FEVER-D02 - Fever recovers over time or can be removed with water
**Status:** DECIDED BY SIMON

`Fever` is a single-card Process that recovers as game time passes and removes itself when its process progress reaches 100.

A water container can be dragged onto a Fever card. That interaction:

- removes the targeted Fever card;
- empties the water container.

The exact Fever recovery rate is not yet fixed. The exact player-facing name of Fever's process progress, the exact representation of an emptied water container, and whether the water treatment itself consumes game time are not yet decided.

## NADIR-02 - Injury representation beyond simple condition cards
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

`Flesh Wound` and `Burn Wound` are confirmed single-card Processes. Decide later whether all injuries use a similar condition-Process model or whether some persistent/complex injuries need another representation.

## NADIR-03 - Equipment representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Ordinary Inventory cards, Connections, attributes, or something else?

## NADIR-04 - Mental/narrative state detail
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Beyond Mind and Spirit, how much mental/narrative state should be numerical, qualitative, or expressed through writing/behavior?

## SURV-D01 - Keep survival complexity legible
**Status:** DECIDED BY SIMON

Aim for high decision complexity with as few exposed systems/attributes/cards as practical.

## SURV-01 - Permanent survival pressures
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Dehydration is now confirmed as a survival pressure because Burn Wounds can accelerate it. Other candidates raised include Hunger, Health, thirst, fatigue, temperature, illness, stress, injury, and morale. Listing the other candidates is not approval.

## SURV-02 - Attribute versus condition card
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Which pressures deserve persistent Value/Marker attributes on Body, Mind, or Spirit, and which should appear as temporary condition cards?

This now explicitly includes deciding how dehydration itself is represented.

## SURV-03 - Hidden survival state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Current card attributes are never hidden. Decide whether simulation may nevertheless contain hidden state outside the card-attribute model.

**Suggested by ChatGPT:** no hidden stomach/fullness system in the first food prototype.

## SURV-04 - Attribute scales
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Common scale such as 0-100 or semantics-specific ranges?

## SURV-05 - Change over time/actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How do survival pressures change as Actions advance game time without creating arbitrary constant real-time pressure?

Burn Wounds accelerating dehydration is one confirmed modifier that this eventual rule must support.

---

# Threat and noise

## THREAT-D01 - No mandatory constant real-time pressure
**Status:** DECIDED BY SIMON

Risk should often come from player-chosen actions/exposure rather than an artificial timer.

## THREAT-D02 - Noise can make productive actions dangerous
**Status:** DECIDED BY SIMON

The player should know before deliberately choosing a meaningfully noisy action.

## THREAT-D03 - Search pressure requires a credible reason
**Status:** DECIDED BY SIMON

Attacks/searches do not happen merely to tax progress. Genuinely silent periods are possible.

## THREAT-D04 - Nadir does not perform direct violence
**Status:** DECIDED BY SIMON

Violent defense, if present, is indirect/automated.

## NOISE-01 - Mechanical representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Numerical value, discrete event, spatial signal, or combination?

## NOISE-02 - Accumulation/decay/propagation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How does noise persist and travel?

## NOISE-03 - Risk information visible to player
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much detectability/search risk is visible, subject to the knowledge-dependent preview rules above?

## NOISE-04 - Environmental masking
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How can weather/external conditions create safer windows for noisy actions?

## NOISE-05 - Persistent enemy learning
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Can repeated noise teach searchers where to investigate?

## NOISE-06 - Avoid disguised danger meter
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Mechanics must preserve the credible-threat rule rather than making attacks inevitable through meter filling.

---

# Search teams and sweeps

## SEARCH-D01 - Human search teams are a core threat
**Status:** DECIDED BY SIMON

## SEARCH-D02 - Direct violence is not Nadir's answer
**Status:** DECIDED BY SIMON

## SEARCH-01 - Persistent guards versus higher-level sweeps
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Individual schedules, higher-level sweep model, or hybrid?

## SEARCH-02 - Learnability of schedules
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How predictable/learnable are search routines?

## SEARCH-03 - Enemy knowledge about Nadir
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Nadir specifically, a code-named suspect, one unknown person, or potentially several?

## SEARCH-04 - Persistent suspicion
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How does suspicion/information persist between incidents?

## SEARCH-05 - Partial discovery
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

What happens if searchers find evidence but not Nadir?

## SEARCH-06 - Failure states
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

What meaningful failures exist besides immediate capture/death?

---

# Narrative

## NARR-D01 - Nadir is fundamentally decent
**Status:** DECIDED BY SIMON

Military culture damaged him; it did not reveal that he was secretly ruthless.

## NARR-D02 - Self-deception is a survival mechanism
**Status:** DECIDED BY SIMON

It grows from things Nadir has done, enabled, caused, or survived and should not make him appear stupid.

## NARR-D03 - Nadir and Elina genuinely love each other
**Status:** DECIDED BY SIMON

The relationship is complicated by concealment, fear, and his past, not a reveal that he merely used her.

## NOTES-D01 - Notes can reflect moral discomfort
**Status:** DECIDED BY SIMON

From Nadir's perspective, not as an authorial morality meter.

## NOTES-01 - When notes are created
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Automatic after events, manually at rest, authored triggers, or combination?

## NOTES-02 - Choices and what Nadir admits
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Can choices affect how directly he confronts fixed events from his past?

## NOTES-03 - Frequency of reflection
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

How often before it feels like commentary on every action?

## NOTES-04 - Objective account versus Nadir's account
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Does the player ever get an objective account confirming distortions?

## NOTES-05 - Fixed backstory versus interpretation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

How much is objectively fixed versus left to interpretation/discovery order?

---

# Suggested implementation principles

These are ChatGPT suggestions, not Simon decisions.

- **IMPL-01:** keep interaction legality/state transitions outside one-off presentation code.
- **IMPL-02:** use concise data-driven card definitions where it reduces boilerplate.
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