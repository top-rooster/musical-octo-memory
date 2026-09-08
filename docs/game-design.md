# Safe Room — current game design

## Design goal

Safe Room is a narrative survival/stealth game about isolation, preparation, and risk. The interface should feel like a physical workspace: **all interactable entities are represented as cards**. Rooms are stable spatial contexts; the player learns and acts on the world primarily through cards rather than navigating separate interaction menus.

The game should create complexity from interactions between a relatively small number of visible systems. Avoid exposing many redundant bars, sub-stats, or overlapping resource models when the same decision can be expressed directly on cards.

## Current interaction model

### Cards

All interactable entities are cards.

Confirmed examples include:

- materials,
- machines,
- food,
- Nadir,
- passages to other rooms.

A card is therefore not synonymous with an inventory item. Some cards can be carried, some are anchored, and some represent fixed world entities or navigation possibilities.

Every card must display:

- a name/title,
- a picture.

A card may additionally have zero or more attributes. Attributes are optional rather than a universal requirement.

Cards do not currently have separate categories, tags, or capabilities. A card is functionally defined only by its attributes. Do not introduce another classification or capability system unless a concrete design need appears later that attributes cannot satisfy.

#### Master definitions and instances

Each reusable card type has one **master definition**. The master definition supplies:

- name/title,
- picture,
- starting attributes.

Cards created from that master are separate **card instances**. Each instance receives the starting attributes and thereafter maintains its own current attributes independently of the master and of sibling instances.

Two identical objects are therefore still two distinct card instances. A Stack can compress their presentation, but it does not merge them into one underlying card.

Whether an individual instance can later override its master name/picture, or how a card changes into a materially different card type, is not yet decided.

Whether non-interactable state or temporary conditions should also use card representation is not yet decided.

### Attributes

All card attributes are visible on the card. There are no hidden/internal card attributes in the current model.

Every attribute is represented by an icon. There are two official attribute forms:

- **Marker** — icon only; the presence of the attribute itself carries the meaning.
- **Value** — icon plus an integer value.

Examples on Nadir:

- `Player` — Marker,
- `Anchored` — Marker,
- `Health 100` — Value.

#### Anchored

`Anchored` is a Marker that prevents a card from being transferred by dragging between the Room and Inventory zones.

Anchored does **not** mean immovable. An anchored card can still:

- be repositioned within its current zone,
- be dragged onto another card for an interaction.

This is ordinary attribute-driven behavior, not a special anchored card type.

### Zones and positioning

The main play space has at least two conceptual zones:

- **Room area** — the currently viewed physical space.
- **Inventory area** — persistent carried possessions and anchored character information.

Cards without a rule preventing transfer can be dragged between appropriate zones. A card with `Anchored` remains in its current zone.

Within a zone, every card can be positioned to the player's liking, including anchored cards.

Cards may not overlap in ordinary placement. Deliberately combined cards snap into a neat, aligned presentation.

### Stack, Process, and Connection

There are three forms of deliberate card stacking: **Stack**, **Process**, and **Connection**.

#### Stack

A Stack is a visual convenience for identical cards that would otherwise occupy unnecessary space.

- The cards remain separate card instances.
- The cards do not all need to remain individually exposed.
- The Stack shows a count of how many cards it represents.
- It has no mechanical effect merely because it exists.

Dragging a Stack peels off its top card as an individual card:

- Stack 3 → one dragged card + Stack 2,
- Stack 2 → one dragged card + one ordinary card.

A single remaining card is shown as a normal card rather than as a Stack with count 1.

The Stack count is presentation for how many card instances are compressed into the Stack; it is not currently defined as a normal `Value` attribute.

#### Process

A Process is a finite mechanically meaningful combination of cards. Creating it starts the Process immediately.

Every participating card remains individually identifiable: the name of every card remains visible.

- The top card gets a `Progress` Value.
- `Progress` ranges from 0 to 100.
- When `Progress` reaches 100, the Process is complete.
- The Process may change attributes on participating cards.

There is no universal progress rate. Each Process defines its own calculation for how `Progress` changes from relevant current game state. Time may be one input, but not necessarily the only one.

Examples:

- Rat meat on a camp fire progresses with elapsed time while the camp fire is lit.
- A bowl on a condenser progresses according to a combination of room moisture, room temperature, and elapsed time.

Process progress can therefore accelerate, slow, or stop as relevant conditions change.

#### Connection

A Connection is a persistent mechanically meaningful relationship between cards. Creating it starts the effect immediately.

Every participating card remains individually identifiable: the name of every card remains visible.

A Connection does not complete by itself. Its effect exists for as long as the relationship exists.

The player can break a Connection by separating its cards. Effects granted by the Connection disappear when it is broken.

Example: connecting a machine to a power outlet gives the machine the `Powered` Marker. Disconnecting it removes `Powered`.

A single power outlet can power only one card at a time.

### Nadir

Nadir Veylan is represented by a card in Inventory with the `Anchored` Marker. He therefore cannot be transferred into the Room zone, but his card can still be repositioned within Inventory or dragged onto other cards when an interaction allows it.

Character state is expressed primarily as attributes on Nadir's card rather than through a separate character-stat subsystem.

For the first prototype, expose at least:

- Hunger
- Health

Health is part of the current prototype scope, not yet a confirmed permanent survival attribute.

### Drag affordances

Whenever the player drags a card:

1. Every card or location that can legally accept the dragged card should highlight.
2. Potential state changes should be previewed before the drop is committed.
3. Invalid targets should not suggest that they accept the card.

Example: dragging food over Nadir should preview something like:

`Hunger 67 → 98`

The preview should appear on or immediately adjacent to the affected stat so the player does not need to mentally translate hidden effects.

### Eating

Food is consumed by dragging a food card onto Nadir.

Dropping the food on Nadir:

- applies the food's hunger effect,
- removes or consumes the food card,
- clamps Hunger to its valid range,
- updates the visible Hunger value immediately.

For the first prototype, do **not** add a second hidden stomach/fullness system. This is a prototype simplification, not yet a permanent design decision.

## Product principles

- Prefer direct manipulation over nested menus.
- Prefer visible consequences over hidden arithmetic.
- A player's uncertainty should come from the situation, incomplete knowledge, and trade-offs — not from unclear UI rules.
- Avoid adding systems merely because comparable survival games have them.
- Keep the play area readable; complexity should emerge from combinations of cards and attributes.
- No direct player violence is part of the broader concept; defensive violence, if present later, is indirect/automated.
- Do not introduce artificial real-time pressure by default. Risk should often come from player-chosen actions, noise, exposure, or external windows.

## Narrative context

The protagonist is Nadir Veylan. He is a fundamentally decent man damaged by a coercive and corrupt military culture. He has survived partly by lying to himself about things he cannot live with. The story should not frame him as stupid or casually manipulative.

His relationship with Elina is intended to be a genuine love story complicated by concealment, fear, and his past — not a reveal that he was simply using her.

Detailed narrative material should live in separate narrative documentation as it becomes implementation-relevant.