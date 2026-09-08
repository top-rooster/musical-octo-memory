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

Whether an instance can later override its master name/picture, or exactly how a card changes into a materially different card type, is not yet decided. A water container becoming empty after use and a `Dead Rat` turning into `Rotten Meat` when Spoilage reaches 100 are concrete cases this rule will eventually need to cover.

### Attributes

All card attributes are visible on the card. There are no hidden/internal card attributes in the current model.

Every attribute is represented by an icon. There are two official forms:

- **Marker** — icon only; presence carries the meaning.
- **Value** — icon plus an integer value.

Examples: `Player`, `Anchored`, `Powered`, `Cutting Tool`, `Dress`, `Health 100`, `Progress 42`, `Durability 80`, `Spoilage 63`, `Clean 70`.

Markers may describe functional roles used by interaction matching. `Cutting Tool` is a confirmed example. Anything Nadir can eat or otherwise ingest must also carry an ingestion Marker; its final user-facing name has not yet been fixed.

`Durability` is an ordinary Value. A tool therefore does not need a generic `Reusable` Marker: a knife can be a `Cutting Tool` with a current `Durability` value. The scale and wear rules are still open.

Process progress is also represented as a normal visible Value, but its **player-facing name may be specific to the Process**. Mechanically/code-wise, these are the same progress concept. `Spoilage` on `Dead Rat` is the confirmed example: it is the visible name of that card's Process progress, not a separate timed-state system.

Wounds keep treatment state in the same attribute model: `Clean` is a Value representing current wound cleanliness, while `Dress` is a Marker whose presence means the wound is currently dressed.

A `Burn Wound` also carries a Value whose effect is to accelerate Nadir's dehydration over time. The final name and scale of that burn-specific Value are not yet fixed, and the exact card/attribute representation of dehydration itself is still open.

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

Movement is distinct from interaction.

### Universal interaction language

**Every gameplay interaction is initiated by putting one card on top of another card.**

An interaction always has:

- a source card being dragged,
- a target card receiving it.

A given source-card/target-card pair supports **at most one interaction**. If the pair is legal, the resulting interaction is unambiguous; the player is never asked to choose between multiple Actions, Processes, Connections, or other outcomes for that same pair.

Interaction legality is attribute-driven rather than hard-coded to exact card identities alone. A target may accept source cards carrying a required Marker and map that match to its interaction.

Confirmed examples:

- `Dead Rat` accepts a source carrying `Cutting Tool` and maps it to `Skin` / the `Skinning` Action. A knife works because it has the `Cutting Tool` Marker, not because the rat specifically recognizes a knife master definition.
- Nadir's ingestion interaction accepts cards carrying the ingestion Marker. That Marker tells the interaction logic that the card can be dropped onto the relevant Nadir ingestion target; eating currently uses **Body**.

The exact data syntax for target requirements and interaction effects is not yet fixed.

Bare zone space can receive a card for legal movement/placement, but that is movement rather than an interaction.

This rule applies across the game: food onto a Nadir card, medicine onto a Nadir card, a cutting tool onto a dead rat, a machine onto a power outlet, material or tool onto a machine, a water container onto Fever, and card combinations that start Actions, Processes, or Connections.

A card-on-card interaction does not have to remain stacked afterward. It may resolve immediately, start an Action, consume a card, alter attributes, create a Stack, start a Process, create a Connection, or produce another interaction-specific result.

Consumption or continued use is an interaction outcome rather than a universal `Consumable`/`Reusable` classification. For example, Skinning returns the cutting tool but consumes the dead rat; eating consumes the ingested card. Specific functional Markers and Values describe what a card can do and its current state.

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

An **Action** is work that requires Nadir's personal involvement.

The initiating cards do not have to include a Nadir card. What matters is that Nadir must personally spend the time doing the work. `Skinning` is an Action even though the initiating cards are a cutting tool and a dead rat.

When an Action is committed:

1. an Action window opens,
2. the window displays the Action and its participating cards,
3. the window animation represents the Action's duration,
4. the corresponding amount of game time advances,
5. the Action completes as soon as the window animation terminates,
6. the Action-specific result is applied.

Actions do **not** use Process progress. Their progress/time passage is already represented by the Action window.

Concrete example: skinning a dead rat.

1. `Dead Rat` accepts a source card carrying `Cutting Tool` as the starter for `Skin`.
2. The player moves a cutting tool, such as a knife, onto `Dead Rat`.
3. The rat card displays `Skin`, the available Action.
4. Dropping the cutting tool commits it.
5. A window appears displaying `Skinning` and the cutting tool and dead rat cards.
6. The Action represents **15 minutes** of game time.
7. When the window animation terminates, the cutting tool returns to where it came from.
8. The `Dead Rat` dissolves/is consumed.
9. A `Rat Skin` card and a `Rat Meat` card are created.

A knife is a concrete `Cutting Tool` and has a `Durability` Value. The exact effect of Skinning on Durability has not yet been fixed.

The duration and result belong to the specific Action. Other Actions may use different durations and completion effects.

#### Process

A **Process** is unattended change that can continue while Nadir spends game time doing something else.

Starting or existing as a Process does **not** force time forward to completion. Instead, it progresses when game time passes because Nadir is occupied with Actions or other activities.

A Process can involve several cards, as with cooking, or it can be embodied by a single card whose state changes over time, as with spoilage, a wound, or Fever.

Processes are allowed in both Room and Inventory, including on or between Nadir-related cards in Inventory.

Most Processes use a visible progress Value on a 0–100 scale. Mechanically/code-wise, this is the same Process progress concept regardless of the player-facing label. The visible Value name may be specific to the Process when that makes the changing state easier to understand.

`Spoilage` on `Dead Rat` is the confirmed example of a process-specific progress label. Other Processes may later use other contextual names; no such names are fixed until explicitly decided.

There is no universal progress calculation: each Process defines its own progression from relevant state and elapsed game time. Conditions may speed up, slow down, or stop progress.

Concrete examples:

- `Dead Rat` is a single-card Process whose visible progress is `Spoilage`. Spoilage rises over game time and at 100 transforms the card into `Rotten Meat`.
- `Rat Meat` placed on a lit camp fire starts a cooking Process. It progresses while the fire remains lit and Nadir spends time doing other things.
- A bowl on a condenser can progress according to room moisture, room temperature, and elapsed game time while Nadir is occupied elsewhere.
- `Flesh Wound` and `Burn Wound` are single-card Processes whose progress represents healing.
- `Fever` is a single-card Process whose progress represents recovery.

When a Process reaches its completion state, the result is Process-specific. A Process can consume or transform participating cards, create output cards, change attributes, separate participants, remove itself, or combine these effects.

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
- each has an `Infection` Value that rises over time if the wound is not adequately managed;
- each has a `Clean` Value representing current wound cleanliness;
- a wound may carry the `Dress` Marker; its presence means the wound is currently dressed;
- cleaning improves `Clean` and helps keep Infection down;
- `Dress` improves healing over time and causes Infection to decrease over time;
- when Infection becomes too high, healing over time is reduced;
- severe Infection spawns a `Fever` condition card.

In addition, each `Burn Wound` has another Value that accelerates Nadir's dehydration over time. The exact name/scale of that Value and the exact representation of dehydration are not yet fixed.

The exact source cards, interactions, Action durations, Value changes, and rules for adding/removing `Dress` are not yet decided. The exact Infection threshold or thresholds for impaired healing and Fever spawning are also not fixed.

`Fever` is cumulative. If Nadir has **three Fever cards**, he dies.

Each `Fever` card is itself a single-card Process. Its Process progress represents recovery over game time and the card disappears when that progress reaches 100. Its eventual player-facing progress label is not yet fixed.

Fever can also be treated with water: dragging a water container onto a Fever card removes that Fever card and empties the container. The exact Fever recovery rate, the exact representation of an emptied container, and whether the water treatment itself consumes game time are not yet fixed.

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
9. Invalid targets should not suggest that they accept the card.

Example: dragging an ingestible food card over **Body** should preview something like:

`Hunger 67 → 98`

The preview should appear on or immediately adjacent to the affected stat.

### Eating and spoilage

Anything Nadir can eat or otherwise ingest must carry a visible ingestion Marker. The exact final name of that Marker is not yet fixed.

The ingestion Marker is what makes the card a legal source for Nadir's ingestion interaction. Eating currently uses **Body** as the receiving card.

Dropping an ingestible food card on Body applies the food's interaction-specific effects, consumes the food card, and updates affected visible state immediately. Ordinary food can, for example, change Hunger; Hunger is clamped to its valid range.

`Dead Rat` is a single-card Process whose visible progress is named `Spoilage`. Spoilage increases over game time. When it reaches **100**, the Dead Rat turns into a `Rotten Meat` card.

`Rotten Meat` remains ingestible. If Nadir eats it:

- the Rotten Meat card is consumed,
- Nadir receives a mood debuff,
- a `Fever` card is created.

The exact representation, magnitude, and duration of the mood debuff are not yet fixed.

For the first prototype, do **not** add a second hidden stomach/fullness system. This remains a prototype simplification rather than a permanent design rule.

### Dehydration

Dehydration is a survival pressure that can worsen over game time. Its exact representation has not yet been fixed.

`Burn Wound` cards carry a Value that accelerates Nadir's dehydration rate while the wound exists. The name and scale of that wound Value and the dehydration formula remain open.

## Product principles

- Prefer direct manipulation over nested menus.
- Prefer visible consequences over hidden arithmetic, while preserving meaningful discovery.
- Let specific visible attributes define what cards can do; avoid generic classifications such as `Reusable` when a concrete functional Marker and state Value express the behavior more directly.
- Give Process progress a contextual player-facing name when that improves comprehension, while keeping it one common mechanic underneath.
- Discovery, relational understanding, exploratory play, and knowledge unlocks are intended parts of play rather than problems for the UI to eliminate.
- Do not turn the game into exhaustive deterministic planning by revealing every consequence before commitment.
- Exploratory play should not cause severe, unforeseeable punishment. Meaningful danger should be reasonably telegraphed even when details remain unknown.
- A player's uncertainty should come from the situation, incomplete knowledge, discovery, and genuine risk — not from unclear UI rules.
- Known danger does not imply known outcome, but when Nadir understands the likelihood the player should receive a clear non-numeric sense of how strongly the odds lean.
- Game time should primarily advance through Nadir's **Actions** and other explicit time-consuming activities. Processes progress concurrently with that elapsed game time rather than creating an independent real-time pressure loop.
- Avoid adding systems merely because comparable survival games have them.
- Keep the play area readable; complexity should emerge from combinations of cards and attributes.
- No direct player violence is part of the broader concept; defensive violence, if present later, is indirect/automated.
- Do not introduce artificial real-time pressure by default. Risk should often come from player-chosen actions, noise, exposure, or external windows.

## Narrative context

The protagonist is Nadir Veylan. He is a fundamentally decent man damaged by a coercive and corrupt military culture. He has survived partly by lying to himself about things he cannot live with. The story should not frame him as stupid or casually manipulative.

His relationship with Elina is intended to be a genuine love story complicated by concealment, fear, and his past — not a reveal that he was simply using her.

Detailed narrative material should live in separate narrative documentation as it becomes implementation-relevant.