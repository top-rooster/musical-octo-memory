# Safe Room — current game design

## Design goal

Safe Room is a narrative survival/stealth game about isolation, preparation, and risk. The interface should feel like a physical workspace: **all interactable entities are represented as cards**. Rooms are stable spatial contexts; the player learns and acts on the world primarily through cards rather than navigating separate interaction menus.

The game should create complexity from interactions between a relatively small number of visible systems. Avoid exposing many redundant bars, sub-stats, or overlapping resource models when the same decision can be expressed directly on cards.

## Current interaction model

### Cards

All interactable entities are cards. Confirmed examples include materials, machines, food, Nadir, and passages to other rooms.

For the first release, every normal card face shows only:

- a name/title,
- a picture,
- zero or more visible attributes.

Description text is deferred.

Cards do not currently have separate categories, tags, or capabilities. A card is functionally defined only by its attributes unless a concrete future need proves that insufficient.

#### Master definitions and instances

Each reusable card type has one **master definition** supplying name/title, picture, and starting attributes.

Cards created from that master are separate **card instances**. Each instance receives the starting attributes and thereafter maintains its own current attributes independently.

Two identical objects are therefore still two distinct card instances. A Stack can compress their presentation, but it does not merge them into one underlying card.

When something remains the same card identity, its Values and Markers may change in place. When it becomes a materially different card identity, preserve the physical-card analogy: **discard the old card and draw the replacement card** rather than changing the existing instance into another master definition. The replacement is placed at the exact location occupied by the discarded card unless a specific rule says otherwise.

Confirmed example: when a `Dead Rat` reaches `Spoilage 100`, discard the Dead Rat and draw `Rotten Meat` at exactly the same position.

#### Authored data and level design

All authored card data lives in plain text files and is loaded by the game code. The text files are the source of truth for card master definitions and their authored state/behavior; TypeScript/React code may parse, validate, index, and transform that data into runtime structures but should not duplicate the card masters as code constants.

The same authoring approach is used for **level design**. Rooms and the card instances/starting state placed in them are read from text data rather than built through room-specific setup code. As more authored world relationships become implementation-relevant, they should be added to the text-data format instead of being moved into application code.

The authoring format follows the earlier Safe Room **Data language** direction: very low boilerplate, pleasant to edit from a phone, no required braces or tabs, no explicit array/list lengths, dynamic lists, and no repeated field labels such as `name` or `damage` when context already makes their meaning obvious. It should remain a purpose-built terse text format rather than being replaced by JSON, YAML, TOON, or the older modified-properties approach for implementation convenience.

Every Action and Process has explicit time in authored data. Instant Actions use `0m`; there is no implicit duration. Parser-friendly numeric conditions use explicit `start..end` ranges. Parser-facing attribute names may use hyphens and render as spaces in the UI, e.g. `Contains-Water` displays as **Contains Water**.

Detailed authoring constraints are maintained in `docs/data-language.md`. The language should grow only when concrete Safe Room data requires new syntax rather than being designed upfront as a general-purpose configuration language.

### Attributes

All card attributes are visible on the card. There are no hidden/internal card attributes in the current model.

Every attribute is represented by an icon. There are two official forms:

- **Marker** — icon only; presence carries the meaning.
- **Value** — icon plus an integer value.

Examples include `Player`, `Anchored`, `Powered`, `Cutting Tool`, `Fabric`, `Dressed`, `Sterilized`, `Container`, `Contains-Water`, `Hydration 50`, `Satiation 50`, `Progress 42`, `Durability 80`, `Spoilage 63`, and `Infection 50`.

Unless Simon explicitly defines a different range for a particular Value, every Value is bounded and clamped from **0 to 100**.

`Sterilized` is the Marker used on fabric that is safe to use as wound dressing. A wound-dressing source must carry both `Fabric` and `Sterilized`, expressed in authored data as `Fabric+Sterilized`.

`Contains-Water` is a mutable Marker meaning that a container currently contains water. It is displayed to the player as **Contains Water**. A `Plastic Bottle` remains the same card when filled or emptied: adding/removing `Contains-Water` changes its state without changing its identity.

Wounds do not have a separate cleanliness Value; their cleanliness/infection state is represented by the `Infection` Value.

Markers may describe functional roles used by interaction matching. `Cutting Tool` is a confirmed example. Anything Nadir can eat or otherwise ingest must also carry an ingestion Marker; its final user-facing name has not yet been fixed.

`Durability` is an ordinary Value. A tool therefore does not need a generic `Reusable` Marker: a knife can be a `Cutting Tool` with a current `Durability` value.

Process progress is also represented as a normal visible Value, but its **player-facing name may be specific to the Process**. Mechanically/code-wise, these are the same progress concept. `Spoilage` on `Dead Rat` is the confirmed example: it is the visible name of that card's Process progress, not a separate timed-state system.

Wounds keep treatment state in the same attribute model: `Infection` is a Value where lower is better and higher is worse, while `Dressed` is a Marker whose presence means the wound is currently dressed. A newly created wound starts at `Infection 50`. Once added, `Dressed` remains until the wound card itself is discarded.

#### Anchored

`Anchored` is a Marker that prevents a card from coming to rest outside its home zone.

Anchored does **not** mean the card cannot cross a zone boundary while being dragged. An anchored card can still:

- be repositioned within its home zone,
- cross into another zone during a drag,
- be dragged onto another card in another zone for a legal interaction.

If an anchored card is released onto bare space in another zone, or otherwise released without a legal interaction that accepts it, it returns to its home zone rather than remaining in the foreign zone.

A legal cross-zone interaction does not transfer the anchored card's persistent home.

All cards representing Nadir or conditions currently applying to him are `Anchored` to Inventory.

### Zones and positioning

The main play space has two zones:

- **Room** — the currently viewed physical space. Its contents change when Nadir moves to another room.
- **Inventory** — persistent cards that remain on screen when Nadir moves to another room.

There is no separate Nadir zone. Nadir is represented entirely through cards in Inventory.

Inventory currently has a provisional capacity of **five non-anchored cards**. Anchored cards do not count toward that limit, so Body, Mind, Spirit, and anchored condition cards do not consume ordinary carrying capacity. Every non-anchored Inventory card instance consumes one slot. Five is a tuning value and may change after playtesting.

Inventory does **not** use `Stack` presentation. Identical carried cards remain separate card instances and therefore each consume one of the five ordinary Inventory slots. With the current two-zone model, Stacks are confined to Room.

Inventory cards, including Nadir's anchored cards and condition cards, may still participate in **Processes** and **Connections**.

Equipment is represented by ordinary cards. An equipment card is considered **equipped while it is in Inventory** and unequipped when moved out. There is no separate equipment zone, equipment-slot system, attachment relationship, or `Equipped` Marker.

Within a zone, every card can be positioned to the player's liking. Cards may not overlap in ordinary placement. Deliberately combined cards snap into a neat aligned presentation.

A legal transfer of a card between **Room** and **Inventory** is always free. The zone change itself does not advance game time, create noise, or cause another gameplay consequence. Rules such as `Anchored`, Inventory capacity, or other legality constraints may prevent a transfer, but a successful transfer has no cost.

Movement is distinct from interaction.

### Universal interaction language

**Every gameplay interaction is initiated by putting one card on top of another card.**

An interaction always has:

- a source card being dragged,
- a target card receiving it.

A given source-card/target-card pair supports **at most one interaction**. If the pair is legal, the resulting interaction is unambiguous; the player is never asked to choose between multiple Actions, Processes, Connections, or other outcomes for that same pair.

A legal card-on-card drop is also the **commitment** to perform that interaction. There is no separate confirmation dialog or second "are you sure?" step, including for dangerous interactions. Whatever consequence, warning, or risk information Nadir currently understands should be communicated before the drop; once the player releases the card onto the legal target, the interaction proceeds.

An Action window is part of executing and displaying an Action, not a confirmation prompt. Dropping the source card commits the Action before its window runs.

Interaction legality is attribute-driven rather than hard-coded to exact card identities alone. A target may accept source cards carrying one or more required Markers. Compound Marker requirements use `+` in authored data.

Confirmed examples:

- `Dead Rat` accepts a source carrying `Cutting Tool` and maps it to `Skin` / the `Skinning` Action. A knife works because it has the `Cutting Tool` Marker, not because the rat specifically recognizes a knife master definition.
- Nadir's ingestion interaction accepts cards carrying the ingestion Marker. Eating uses **Body** as the receiving card; Rotten Meat explicitly authors this as `eat Body`.
- a wound accepts a source carrying `Contains-Water` for the wound-cleaning Action;
- a wound accepts a source carrying both `Fabric` and `Sterilized` for the wound-dressing Action, authored as `Fabric+Sterilized`;
- a Plastic Bottle can use `action Body Drink 0m` when it itself has `Contains-Water`.

Bare zone space can receive a card for legal movement/placement, but that is movement rather than an interaction.

A card-on-card interaction does not have to remain stacked afterward. It may resolve immediately, start an Action, discard a card, draw a card, alter attributes, create a Stack, start a Process, create a Connection, or produce another interaction-specific result.

**Only Actions advance game time.** Immediate interactions, movement, Stack changes, Process creation, and Connection changes do not consume game time by themselves. If an interaction is intended to consume time, it must be represented as an Action. An instant Action is still explicitly authored as `0m` and advances zero minutes.

Consumption or continued use is an interaction outcome rather than a universal `Consumable`/`Reusable` classification. For example, Skinning returns the cutting tool but discards the dead rat; eating consumes/discards the ingested card; drinking removes `Contains-Water` from a Plastic Bottle while keeping the bottle card.

### Stack, Action, Process, and Connection

For now, the defined relationship model is considered complete. There are three persistent forms of deliberate card state/combination: **Stack**, **Process**, and **Connection**. **Action** is a separate interaction type for work Nadir personally performs; it resolves through a temporary Action window instead of remaining as an ongoing card combination.

#### Stack

A Stack exists solely to reduce visual card clutter in Room by compressing identical cards.

- The cards remain separate card instances.
- All cards in the Stack come from the same master definition.
- All cards have identical current attributes.
- If any Marker differs, or any Value/value differs, they cannot share a Stack.
- The Stack shows a count.
- It has no mechanical effect merely because it exists.
- Stacks are not allowed in Inventory; with the current two-zone model, Stack presentation exists only in Room.

Dragging a Stack peels off its top card:

- Stack 3 → dragged card + Stack 2,
- Stack 2 → dragged card + ordinary card.

A single remaining card is shown normally rather than as Stack 1. The Stack count is presentation, not currently a normal `Value` attribute.

#### Action

An **Action** is work that requires Nadir's personal involvement and is the **only mechanism that advances game time**. If something is meant to take game time, it must be an Action.

Every Action explicitly states a time in data. Confirmed examples include:

- `Skin 15m`,
- `Sleep 8h`,
- wound cleaning `15m`,
- wound dressing `15m`,
- `Drink 0m`.

The initiating cards do not have to include a Nadir card. What matters is that Nadir must personally perform the work.

When an Action is committed:

1. an Action window opens,
2. the window displays the Action and its participating cards,
3. the window animation represents the Action's duration,
4. the corresponding amount of game time advances,
5. active Processes update from that elapsed game time,
6. the Action completes as soon as the window animation terminates,
7. the Action-specific result is applied.

Actions do **not** use Process progress. Their progress/time passage is already represented by the Action window.

Concrete example: skinning a dead rat.

1. `Dead Rat` accepts a source card carrying `Cutting Tool` as the starter for `Skin`.
2. The player moves a cutting tool, such as a knife, onto `Dead Rat`.
3. The rat card displays `Skin`, the available Action.
4. Dropping the cutting tool commits it.
5. A window appears displaying `Skinning` and the cutting tool and dead rat cards.
6. The Action represents **15 minutes** of game time.
7. When the window animation terminates, the cutting tool returns to where it came from.
8. The `Dead Rat` is discarded.
9. A `Rat Skin` card and a `Rat Meat` card are drawn as the Action outputs.

A knife is a concrete `Cutting Tool` and has a `Durability` Value. The exact effect of Skinning on Durability has not yet been fixed.

The duration and result belong to the specific Action. Other Actions may use different durations and completion effects.

#### Process

A **Process** is unattended change that can continue while Nadir performs Actions.

Starting or existing as a Process does **not** advance game time. Instead, it progresses when an Action advances game time.

Every Process explicitly states either its required elapsed duration or its repeat/tick interval in data.

A Process can involve several cards, as with cooking or fabric sterilization, or it can be embodied by a single card whose state changes over time, as with spoilage, an injury, Fever, or Body's Hydration loss.

Processes are allowed in both Room and Inventory, including on or between Nadir-related cards in Inventory.

Most Processes use a visible progress Value on a 0–100 scale, but a Process may also directly modify another Value rather than maintaining a separate progress bar. Body's Hydration Process is a confirmed example.

Mechanically/code-wise, contextual Process progress names are still the same underlying progress concept. `Spoilage` on `Dead Rat` is the confirmed named-progress example.

There is no universal progress calculation: each Process defines its own progression from relevant state and elapsed game time. Conditions may speed up, slow down, stop, or reverse progress.

Concrete examples:

- `Dead Rat` is a single-card Process whose visible progress is `Spoilage`. At 100, discard the Dead Rat and draw `Rotten Meat` at exactly the same location.
- `Rat Meat` placed on a lit camp fire starts a cooking Process. Its exact duration is still undecided.
- Fabric sterilization is a three-card Process requiring an appropriate heat source, a card carrying `Contains-Water`, and `Fabric` without `Sterilized`. It completes after one hour of elapsed game time, removes `Contains-Water` from the water card, and adds `Sterilized` to the fabric.
- All injuries use the Process model for now. `Flesh Wound` and `Burn Wound` are concrete single-card injury Processes whose progress represents healing.
- `Fever` is a single-card Process whose progress represents recovery.
- **Body** has a Process evaluated every `15m` of elapsed game time that applies `Hydration -2`.

When a Process reaches its completion state, the result is Process-specific. A Process can discard cards, draw replacement/output cards, change attributes, separate participants, or combine these effects.

#### Connection

A Connection is a persistent mechanically meaningful relationship between cards. Creating it starts the effect immediately.

Connections are allowed in both Room and Inventory, including relationships involving Nadir-related cards in Inventory.

Every participating card remains individually identifiable and every card name stays visible.

A Connection lasts until the player separates its cards. Effects granted by the Connection disappear when it is broken.

Example: connecting a machine to a power outlet gives the machine the `Powered` Marker. Disconnecting removes `Powered`. One outlet can power only one card at a time.

### Nadir

Nadir Veylan is represented by cards in **Inventory**, not by a separate character sheet or zone.

For now, his persistent representation is divided across three cards:

- **Body** — physical state,
- **Mind** — cognitive / will state,
- **Spirit** — emotional / spiritual state.

More persistent Nadir cards may be added later if a concrete need appears.

Relevant persistent character state is expressed as attributes on those cards.

#### Body survival state

Body starts with:

- `Hydration 50`,
- `Satiation 50`.

Both use the default 0–100 Value bounds.

If **Hydration or Satiation reaches 0, the game ends**.

There is no separate Body `Health` Value. Physical injury and health consequences are represented through injury/condition cards instead, avoiding a redundant parallel health system.

Body continuously participates in a repeating Process evaluated every **15 minutes of elapsed game time**:

- `Hydration -2`.

The corresponding ongoing Satiation rule has not yet been decided.

A `Plastic Bottle` has the `Container` Marker. When filled, that bottle instance also carries `Contains-Water`. Its `Drink` interaction is an instant Action:

- target: **Body**,
- duration: `0m`,
- requires `Contains-Water` on the bottle,
- applies `Hydration +25` to Body,
- removes `Contains-Water` from the bottle.

Because Values default to 0–100, drinking cannot raise Hydration above 100 unless that Value's range is explicitly changed later.

#### Condition cards

Conditions that currently apply to Nadir are represented as **temporary cards in Inventory** rather than being forced into Body, Mind, or Spirit.

Confirmed examples include:

- `Exhausted`,
- `Flesh Wound`,
- `Burn Wound`,
- `Fever`.

All of Nadir's persistent cards and temporary condition cards are `Anchored` to Inventory. They cannot come to rest in Room as ordinary placement, but they can cross the boundary while being dragged and can be dropped onto a Room card for a legal interaction. If released in Room without a legal accepting interaction, they return to Inventory.

Nadir-related cards may participate in **Processes** and **Connections** while remaining in Inventory. They may not be compressed into `Stacks` there.

#### Condition lifecycles

Condition lifecycles are condition-specific rather than using one universal timer/removal rule.

**All injuries use the Process model for now.** This is the default representation for injury conditions unless a later concrete design need leads to revisiting the rule. `Flesh Wound` and `Burn Wound` are the current concrete examples.

**Exhausted** is removed by sleeping. Dragging `Exhausted` onto **Body** exposes the `Sleep` Action. `Sleep` takes **8 hours**, advances game time through the normal Action window, and discards the `Exhausted` card when complete. Any additional sleep effects are still undecided.

**Flesh Wound** and **Burn Wound** are single-card Processes:

- each has a Process progress Value from 0 to 100 representing healing; its eventual player-facing label can be process-specific, but no exact label is fixed yet;
- each is discarded when its Process progress reaches 100;
- each starts at `Infection 50`;
- `Infection` uses the default 0–100 Value bounds; lower is better and higher is worse;
- a wound may carry the `Dressed` Marker; once added, it remains until the wound card is discarded;
- a source carrying `Contains-Water` can clean the wound;
- a source carrying both `Fabric` and `Sterilized` can dress the wound;
- cleaning is a **15-minute Action**, reduces `Infection` by **40** to a minimum of 0, and removes `Contains-Water` from the source card;
- dressing is a **15-minute Action**, consumes the fabric source card, and adds `Dressed` to the wound;
- fabric sterilization is a one-hour Process requiring an appropriate heat source, a card carrying `Contains-Water`, and `Fabric` without `Sterilized`; on completion the water card loses `Contains-Water` and the fabric gains `Sterilized`;
- `Dressed` improves healing and causes Infection to decrease over time; exact rates remain open;
- severe Infection can spawn `Fever`; the Fever threshold remains open.

**Flesh Wound** has a confirmed 15-minute healing tick. Its current authored bands are:

- `if Infection 0..24 progress +2`
- `if Infection 25..49 progress +1`
- `if Infection 50..74 progress +0`
- `if Infection 75..100 progress -1`

The bands are non-overlapping and cover the full default Infection range.

`Burn Wound` also accelerates loss of Body `Hydration`. Hydration itself is now a confirmed Body Value; the exact burn-specific modifier Value/name and acceleration formula remain open.

`Fever` is cumulative. If Nadir has **three Fever cards**, he dies.

Each `Fever` card is itself a single-card Process. Its Process progress represents recovery as Actions advance game time and the card is discarded when that progress reaches 100. Its eventual player-facing progress label and recovery rate are not yet fixed.

A source carrying `Contains-Water` can also be dropped onto Fever. That immediate interaction discards the target Fever and removes `Contains-Water` from the source. It does not currently advance game time.

### Discovery, knowledge, risk, and previews

Safe Room should preserve substantial discovery rather than revealing the complete causal future of an interaction before commitment. Understanding can come from two sources:

- **relational understanding** — the player can infer danger or opportunity from visible cards, attributes, room state, and relationships between them;
- **exploratory play and knowledge unlocks** — using, observing, reading about, or otherwise learning a system can improve what Nadir and the player understand about it later.

Previews should therefore be **knowledge-dependent** rather than omniscient. Known consequences can be shown accurately. Undiscovered relationships should not automatically be spoiled by hovering cards together.

However, exploratory play should not unexpectedly inflict severe punishment that the player had no reasonable way to anticipate. Serious danger must be sufficiently telegraphed through visible context, Nadir's existing understanding, or an explicit qualitative warning. Nadir may articulate obvious danger when appropriate.

Example: a flooded room containing exposed electrical outlets is likely to electrocute Nadir. The danger does not need an exact numerical preview because the relevant elements are visible and their relationship is understandable; Nadir may also explicitly recognize that the room is dangerous.

Uncertainty can remain after the danger is understood. Attempting to repair an exposed electrical outlet may carry a known risk of electric shock. A shock can result in a burn wound, while a successful risk outcome can leave a functional outlet. The player should be able to understand that the repair is dangerous without being shown the exact result in advance.

When Nadir understands an uncertain risk, the UI should communicate **likelihood clearly but normally without numerical probability**. The wording must have enough resolution that the player can distinguish materially different odds — for example, a roughly even gamble from an outcome that is clearly favored — without displaying percentages such as `50%` or `75%`.

Coarse labels such as only `Low`, `Moderate`, and `High` are not precise enough for this purpose. The exact user-facing wording remains provisional and can be revisited after UI testing; it is not locked yet.

The intended information progression is therefore closer to **unknown → suspected → understood** than to either complete opacity or complete prediction.

### Drag affordances

Whenever the player drags a card:

1. Every card that can legally receive it as an interaction target highlights.
2. Attribute matching is part of legality: targets may accept a dragged card because it carries required Markers such as `Cutting Tool`, `Contains-Water`, `Fabric+Sterilized`, or the ingestion Marker.
3. Each legal source/target pair has at most one interaction, so a highlighted target never requires a follow-up interaction chooser.
4. Legal zone placement for movement should remain legible without being confused with a card interaction target.
5. Consequences that Nadir/the player currently understands may be previewed before the drop is committed.
6. Meaningful known danger may be communicated even when an exact outcome remains uncertain.
7. Known uncertain likelihood should be communicated with calibrated plain language rather than routine percentages; exact wording remains provisional.
8. An available Action may communicate its name on the target before commitment, as `Skin` does when a cutting tool is moved onto a dead rat.
9. Releasing a card on a legal interaction target commits the interaction immediately; there is no follow-up confirmation step.
10. Invalid targets should not suggest that they accept the card.

Examples of direct known previews include:

- `Satiation 67 → 98`
- `Hydration 50 → 75`

The preview should appear on or immediately adjacent to the affected stat.

### Eating and spoilage

Anything Nadir can eat or otherwise ingest must carry a visible ingestion Marker. The exact final name of that Marker is not yet fixed.

The ingestion Marker is what makes the card a legal source for Nadir's ingestion interaction. Eating uses **Body** as the receiving card.

Dropping an ingestible food card on Body applies the food's interaction-specific effects, consumes/discards the food card, and updates affected visible state immediately. Because eating is not currently an Action, it does not advance game time. If eating is later intended to consume time, it must be modeled as an Action.

`Dead Rat` is a single-card Process whose visible progress is named `Spoilage`. Spoilage increases only as Actions advance game time. When it reaches **100**, discard the Dead Rat and draw a `Rotten Meat` card in exactly the same position.

`Rotten Meat` remains ingestible and explicitly targets **Body** in authored data (`eat Body`). If Nadir eats it:

- the Rotten Meat card is consumed/discarded,
- Nadir receives a mood debuff,
- a `Fever` card is drawn/created.

The exact representation, magnitude, and duration of the mood debuff are not yet fixed.

For the first prototype, do **not** add a second hidden stomach/fullness system. This remains a prototype simplification rather than a permanent design rule.

### Survival pressures

The confirmed permanent Body survival Values are:

- Hydration,
- Satiation.

They both start at 50. Reaching 0 in either causes game over.

There is no general Body Health Value. Physical health is represented through injury/condition cards instead.

Hydration currently decreases by **2 every 15 minutes of elapsed game time** through Body's Process. The ongoing Satiation rate remains to be designed.

Burn Wounds accelerate Hydration loss; the exact acceleration formula remains open.

### Noise

The noise mechanic is intentionally **shelved for now**. The broader possibility that noisy Actions may matter later is preserved, but its representation, propagation, risk model, masking, and relationship to search behavior should not be designed or implemented until the mechanic is explicitly revisited.

## Product principles

- Prefer direct manipulation over nested menus.
- Prefer visible consequences over hidden arithmetic, while preserving meaningful discovery.
- Preserve the physical-card analogy: when something becomes a different card identity, discard the old card and draw the replacement rather than morphing the existing card; keep the replacement in the old card's location unless a specific effect moves it.
- Let specific visible attributes define what cards can do; avoid generic classifications such as `Reusable` when a concrete functional Marker and state Value express the behavior more directly.
- Author card masters and level design in terse text data files and keep those files as the source of truth rather than duplicating authored game content in application code.
- Give Process progress a contextual player-facing name when that improves comprehension, while keeping it one common mechanic underneath.
- Communicate understood consequences before commitment, then treat the card drop as the player's decision; avoid confirmation dialogs that interrupt the interaction flow.
- **Game time advances only through Actions.** Processes react to that elapsed time; other interactions and movement do not create elapsed game time themselves.
- Every Action/Process explicitly states its time in authored data; instant Actions use `0m`.
- Values default to a 0–100 range unless a specific exception is explicitly designed.
- Discovery, relational understanding, exploratory play, and knowledge unlocks are intended parts of play rather than problems for the UI to eliminate.
- Do not turn the game into exhaustive deterministic planning by revealing every consequence before commitment.
- Exploratory play should not cause severe, unforeseeable punishment. Meaningful danger should be reasonably telegraphed even when details remain unknown.
- A player's uncertainty should come from the situation, incomplete knowledge, discovery, and genuine risk — not from unclear UI rules.
- Known danger does not imply known outcome, but when Nadir understands the likelihood the player should receive a clear non-numeric sense of how strongly the odds lean.
- Avoid adding systems merely because comparable survival games have them.
- Keep the play area readable; complexity should emerge from combinations of cards and attributes.
- No direct player violence is part of the broader concept; defensive violence, if present later, is indirect/automated.
- Do not introduce artificial real-time pressure by default. Risk should often come from player-chosen actions, exposure, or external windows.
- Keep noise mechanics shelved until their role is clearer rather than forcing an early danger-meter design.

## Narrative context

The protagonist is Nadir Veylan. He is a fundamentally decent man damaged by a coercive and corrupt military culture. He has survived partly by lying to himself about things he cannot live with. The story should not frame him as stupid or casually manipulative.

His relationship with Elina is intended to be a genuine love story complicated by concealment, fear, and his past — not a reveal that he was simply using her.

Detailed narrative material should live in separate narrative documentation as it becomes implementation-relevant.
