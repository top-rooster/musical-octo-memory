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

### Attributes

All card attributes are visible on the card. There are no hidden/internal card attributes in the current model.

Every attribute is represented by an icon. There are two official forms:

- **Marker** — icon only; presence carries the meaning.
- **Value** — icon plus an integer value.

Examples include `Player`, `Anchored`, `Powered`, `Cutting Tool`, `Dress`, `Clean` as a Marker on fabric, `Health 100`, `Progress 42`, `Durability 80`, `Spoilage 63`, and `Clean 70` as a Value on a wound.

The label `Clean` is currently used for two different attribute forms on different cards:

- a wound has a `Clean` **Value** representing how clean the wound is;
- fabric may have a `Clean` **Marker** meaning the fabric is clean enough to be used as a dressing.

Markers may describe functional roles used by interaction matching. `Cutting Tool` is a confirmed example. Anything Nadir can eat or otherwise ingest must also carry an ingestion Marker; its final user-facing name has not yet been fixed.

`Durability` is an ordinary Value. A tool therefore does not need a generic `Reusable` Marker: a knife can be a `Cutting Tool` with a current `Durability` value. The scale and wear rules are still open.

Process progress is also represented as a normal visible Value, but its **player-facing name may be specific to the Process**. Mechanically/code-wise, these are the same progress concept. `Spoilage` on `Dead Rat` is the confirmed example: it is the visible name of that card's Process progress, not a separate timed-state system.

Wounds keep treatment state in the same attribute model: `Clean` is a Value representing current wound cleanliness, while `Dress` is a Marker whose presence means the wound is currently dressed.

A `Burn Wound` also carries a Value whose effect is to accelerate Nadir's dehydration as game time advances. The final name and scale of that burn-specific Value are not yet fixed, and the exact card/attribute representation of dehydration itself is still open.

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

The previously proposed separate **Nadir** zone has been removed. Nadir remains represented entirely through cards, but those cards live in Inventory alongside other persistent cards.

`Anchored` is what distinguishes Nadir's fixed Inventory cards from ordinary cards that may move between Room and Inventory.

Inventory currently has a provisional capacity of **five non-anchored cards**. Anchored cards do not count toward that limit, so Body, Mind, Spirit, and anchored condition cards do not consume ordinary carrying capacity. Every non-anchored Inventory card instance consumes one slot. Five is a tuning value and may change after playtesting.

Inventory does **not** use `Stack` presentation. Identical carried cards remain separate card instances and therefore each consume one of the five ordinary Inventory slots. With the current two-zone model, Stacks are confined to Room.

Inventory cards, including Nadir's anchored cards and condition cards, may still participate in **Processes** and **Connections**. The restriction is specifically against `Stack` compression in Inventory; it does not prohibit mechanically meaningful Process or Connection relationships there.

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

Interaction legality is attribute-driven rather than hard-coded to exact card identities alone. A target may accept source cards carrying a required Marker and map that match to its interaction.

Confirmed examples:

- `Dead Rat` accepts a source carrying `Cutting Tool` and maps it to `Skin` / the `Skinning` Action. A knife works because it has the `Cutting Tool` Marker, not because the rat specifically recognizes a knife master definition.
- Nadir's ingestion interaction accepts cards carrying the ingestion Marker. That Marker tells the interaction logic that the card can be dropped onto the relevant Nadir ingestion target; eating currently uses **Body**.
- a wound can accept water in a container for the wound-cleaning Action;
- a wound can accept clean fabric for the wound-dressing Action. The fabric must carry the `Clean` Marker. The exact attribute rule that identifies a card as fabric is not yet fixed.

The exact data syntax for target requirements and interaction effects is not yet fixed.

Bare zone space can receive a card for legal movement/placement, but that is movement rather than an interaction.

This rule applies across the game: food onto a Nadir card, medicine onto a Nadir card, a cutting tool onto a dead rat, a machine onto a power outlet, material or tool onto a machine, a water container onto Fever, and card combinations that start Actions, Processes, or Connections.

A card-on-card interaction does not have to remain stacked afterward. It may resolve immediately, start an Action, discard a card, draw a card, alter attributes, create a Stack, start a Process, create a Connection, or produce another interaction-specific result.

**Only Actions advance game time.** Immediate interactions, movement, Stack changes, Process creation, and Connection changes do not consume game time by themselves. If an interaction is intended to consume time, it must be represented as an Action.

Consumption or continued use is an interaction outcome rather than a universal `Consumable`/`Reusable` classification. For example, Skinning returns the cutting tool but discards the dead rat; eating consumes/discards the ingested card. Specific functional Markers and Values describe what a card can do and its current state.

### Stack, Action, Process, and Connection

For now, the defined relationship model is considered complete. There are three persistent forms of deliberate card state/combination: **Stack**, **Process**, and **Connection**. **Action** is a separate interaction type for work Nadir personally performs; it resolves through a temporary Action window instead of remaining as an ongoing card combination. Do not introduce a fourth containment/attachment/equipment relationship unless a concrete future need cannot be represented by this model.

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

The initiating cards do not have to include a Nadir card. What matters is that Nadir must personally spend the time doing the work. `Skinning` is an Action even though the initiating cards are a cutting tool and a dead rat. Cleaning and dressing wounds are also confirmed Actions.

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

A Process can involve several cards, as with cooking, or it can be embodied by a single card whose state changes over time, as with spoilage, a wound, or Fever.

Processes are allowed in both Room and Inventory, including on or between Nadir-related cards in Inventory.

Most Processes use a visible progress Value on a 0–100 scale. Mechanically/code-wise, this is the same Process progress concept regardless of the player-facing label. The visible Value name may be specific to the Process when that makes the changing state easier to understand.

`Spoilage` on `Dead Rat` is the confirmed example of a process-specific progress label. Other Processes may later use other contextual names; no such names are fixed until explicitly decided.

There is no universal progress calculation: each Process defines its own progression from relevant state and elapsed game time. Conditions may speed up, slow down, or stop progress.

Concrete examples:

- `Dead Rat` is a single-card Process whose visible progress is `Spoilage`. At 100, discard the Dead Rat and draw `Rotten Meat` at exactly the same location.
- `Rat Meat` placed on a lit camp fire starts a cooking Process. It progresses while the fire remains lit as Actions advance game time.
- A bowl on a condenser can progress according to room moisture, room temperature, and elapsed game time created by Actions.
- `Flesh Wound` and `Burn Wound` are single-card Processes whose progress represents healing.
- `Fever` is a single-card Process whose progress represents recovery.

When a Process reaches its completion state, the result is Process-specific. A Process can discard cards, draw replacement/output cards, change attributes, separate participants, remove itself, or combine these effects.

If a future Process needs an `Anchored` participant whose home is another zone, its ongoing visual presentation still needs to be decided. There is no current concrete example requiring this.

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

Conditions that currently apply to Nadir are represented as **temporary cards in Inventory** rather than being forced into Body, Mind, or Spirit.

Confirmed examples include:

- `Exhausted`
- `Flesh Wound`
- `Burn Wound`
- `Fever`

All of Nadir's persistent cards and temporary condition cards are `Anchored` to Inventory. They cannot come to rest in Room as ordinary placement, but they can cross the boundary while being dragged and can be dropped onto a Room card for a legal interaction. If released in Room without a legal accepting interaction, they return to Inventory.

Nadir-related cards may participate in **Processes** and **Connections** while remaining in Inventory. They may not be compressed into `Stacks` there.

#### Condition lifecycles

Condition lifecycles are condition-specific rather than using one universal timer/removal rule.

**Exhausted** is removed by sleeping. Dragging `Exhausted` onto **Body** exposes the `Sleep` Action. Committing it advances game time through the normal Action window, and when the Action completes the `Exhausted` card disappears. The exact sleep duration and any additional effects of sleep are not yet decided.

**Flesh Wound** and **Burn Wound** are single-card Processes:

- each has a Process progress Value from 0 to 100 representing healing; its eventual player-facing label can be process-specific, but no exact label is fixed yet;
- each disappears when its Process progress reaches 100;
- each has an `Infection` Value that rises as game time advances if the wound is not adequately managed;
- each has a `Clean` Value representing current wound cleanliness;
- a wound may carry the `Dress` Marker; its presence means the wound is currently dressed;
- water in a container can be used to clean a wound, improving the wound's `Clean` Value;
- any fabric carrying the `Clean` Marker can be used to dress a wound; dressing gives the wound the `Dress` Marker;
- fabric can be made clean by boiling it, which gives that fabric the `Clean` Marker;
- cleaning a wound is an **Action**;
- dressing a wound is an **Action**;
- `Dress` improves healing over time and causes Infection to decrease over time;
- when Infection becomes too high, healing over time is reduced;
- severe Infection spawns a `Fever` condition card.

In addition, each `Burn Wound` has another Value that accelerates Nadir's dehydration as game time advances. The exact name/scale of that Value and the exact representation of dehydration are not yet fixed.

Because cleaning and dressing are Actions, each runs through the normal Action window, advances game time, and causes active Processes to update during that elapsed time. Their exact Action durations, amount by which water changes wound `Clean`, whether/how much water is consumed, whether clean fabric is consumed or changed when dressing, how `Dress` is later removed, and the exact boiling interaction are not yet decided. The exact Infection threshold or thresholds for impaired healing and Fever spawning are also not fixed.

`Fever` is cumulative. If Nadir has **three Fever cards**, he dies.

Each `Fever` card is itself a single-card Process. Its Process progress represents recovery as Actions advance game time and the card disappears when that progress reaches 100. Its eventual player-facing progress label is not yet fixed.

Fever can also be treated with water: dragging a water container onto a Fever card removes that Fever card and empties the container. As currently described this is an immediate interaction, so it does not advance game time. If it is later intended to consume time, it must instead be represented as an Action. The exact Fever recovery rate and exact representation of an emptied container are not yet fixed.

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
2. Attribute matching is part of legality: targets may accept a dragged card because it carries a required Marker such as `Cutting Tool` or the ingestion Marker.
3. Each legal source/target pair has at most one interaction, so a highlighted target never requires a follow-up interaction chooser.
4. Legal zone placement for movement should remain legible without being confused with a card interaction target.
5. Consequences that Nadir/the player currently understands may be previewed before the drop is committed.
6. Meaningful known danger may be communicated even when an exact outcome remains uncertain.
7. Known uncertain likelihood should be communicated with calibrated plain language rather than routine percentages; exact wording remains provisional.
8. An available Action may communicate its name on the target before commitment, as `Skin` does when a cutting tool is moved onto a dead rat.
9. Releasing a card on a legal interaction target commits the interaction immediately; there is no follow-up confirmation step.
10. Invalid targets should not suggest that they accept the card.

Example: dragging an ingestible food card over **Body** should preview something like:

`Hunger 67 → 98`

The preview should appear on or immediately adjacent to the affected stat.

### Eating and spoilage

Anything Nadir can eat or otherwise ingest must carry a visible ingestion Marker. The exact final name of that Marker is not yet fixed.

The ingestion Marker is what makes the card a legal source for Nadir's ingestion interaction. Eating currently uses **Body** as the receiving card.

Dropping an ingestible food card on Body applies the food's interaction-specific effects, consumes/discards the food card, and updates affected visible state immediately. Because this is not currently an Action, eating does not advance game time. If eating is later intended to consume time, it must be modeled as an Action.

`Dead Rat` is a single-card Process whose visible progress is named `Spoilage`. Spoilage increases only as Actions advance game time. When it reaches **100**, discard the Dead Rat and draw a `Rotten Meat` card in exactly the same position.

`Rotten Meat` remains ingestible. If Nadir eats it:

- the Rotten Meat card is consumed/discarded,
- Nadir receives a mood debuff,
- a `Fever` card is drawn/created.

The exact representation, magnitude, and duration of the mood debuff are not yet fixed.

For the first prototype, do **not** add a second hidden stomach/fullness system. This remains a prototype simplification rather than a permanent design rule.

### Dehydration

Dehydration is a survival pressure that can worsen as Actions advance game time. Its exact representation has not yet been fixed.

`Burn Wound` cards carry a Value that accelerates Nadir's dehydration rate while the wound exists. The name and scale of that wound Value and the dehydration formula remain open.

### Noise

The noise mechanic is intentionally **shelved for now**. The broader possibility that noisy Actions may matter later is preserved, but its representation, propagation, risk model, masking, and relationship to search behavior should not be designed or implemented until the mechanic is explicitly revisited.

## Product principles

- Prefer direct manipulation over nested menus.
- Prefer visible consequences over hidden arithmetic, while preserving meaningful discovery.
- Preserve the physical-card analogy: when something becomes a different card identity, discard the old card and draw the replacement rather than morphing the existing card; keep the replacement in the old card's location unless a specific effect moves it.
- Let specific visible attributes define what cards can do; avoid generic classifications such as `Reusable` when a concrete functional Marker and state Value express the behavior more directly.
- Give Process progress a contextual player-facing name when that improves comprehension, while keeping it one common mechanic underneath.
- Communicate understood consequences before commitment, then treat the card drop as the player's decision; avoid confirmation dialogs that interrupt the interaction flow.
- **Game time advances only through Actions.** Processes react to that elapsed time; other interactions and movement do not create elapsed game time themselves.
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