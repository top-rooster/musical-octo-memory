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

Whether an instance can later override its master name/picture, or how a card changes into a materially different card type, is not yet decided.

### Attributes

All card attributes are visible on the card. There are no hidden/internal card attributes in the current model.

Every attribute is represented by an icon. There are two official forms:

- **Marker** — icon only; presence carries the meaning.
- **Value** — icon plus an integer value.

Examples: `Player`, `Anchored`, `Powered`, `Health 100`, `Progress 42`.

#### Anchored

`Anchored` is a Marker that prevents a card from being transferred between Room and Inventory. It does not prevent repositioning within the current zone or dragging the card onto another card for an interaction.

The introduction of the Nadir zone does not yet redefine `Anchored`; exact transfer restrictions involving that zone remain open if needed.

### Zones and positioning

The main play space has three zones:

- **Room** — the currently viewed physical space.
- **Inventory** — persistent carried possessions.
- **Nadir** — Nadir's persistent representation cards plus temporary condition cards that currently apply to him.

The Nadir zone replaces the earlier assumption that Nadir's representation lives in Inventory. Nadir remains represented through cards rather than through a separate character sheet or alternate character views.

Cards can be moved between zones when the relevant rules allow it. The exact transfer rules for the Nadir zone are not yet fully decided.

Within a zone, every card can be positioned to the player's liking. Cards may not overlap in ordinary placement. Deliberately combined cards snap into a neat aligned presentation.

Movement is distinct from interaction.

### Universal interaction language

**Every gameplay interaction is initiated by putting one card on top of another card.**

An interaction always has:

- a source card being dragged,
- a target card receiving it.

Bare zone space can receive a card for legal movement/placement, but that is movement rather than an interaction.

This rule applies across the game: food onto a Nadir card, medicine onto a Nadir card, machine onto a power outlet, material or tool onto a machine, and any card combination that starts a Process or Connection.

A card-on-card interaction does not have to remain stacked afterward. It may resolve immediately, consume a card, alter attributes, create a Stack, start a Process, create a Connection, or produce another process-specific result.

### Stack, Process, and Connection

There are three forms of deliberate card stacking: **Stack**, **Process**, and **Connection**.

#### Stack

A Stack is a visual convenience for identical cards.

- The cards remain separate card instances.
- All cards in the Stack come from the same master definition.
- All cards have identical current attributes.
- If any Marker differs, or any Value/value differs, they cannot share a Stack.
- The Stack shows a count.
- It has no mechanical effect merely because it exists.

Dragging a Stack peels off its top card:

- Stack 3 → dragged card + Stack 2,
- Stack 2 → dragged card + ordinary card.

A single remaining card is shown normally rather than as Stack 1. The Stack count is presentation, not currently a normal `Value` attribute.

#### Process

A Process is a finite mechanically meaningful combination of cards. Creating it starts the Process immediately.

Every participating card remains individually identifiable and every card name stays visible.

- The top card gets a `Progress` Value.
- `Progress` ranges from 0 to 100.
- When `Progress` reaches 100, the Process is complete.
- The Process may change attributes on participating cards.

There is no universal progress rate. Each Process defines its own calculation from relevant game state and elapsed game time.

Examples:

- Rat meat on a camp fire progresses with elapsed time while the camp fire is lit.
- A bowl on a condenser progresses according to room moisture, room temperature, and elapsed time.

#### Connection

A Connection is a persistent mechanically meaningful relationship between cards. Creating it starts the effect immediately.

Every participating card remains individually identifiable and every card name stays visible.

A Connection lasts until the player separates its cards. Effects granted by the Connection disappear when it is broken.

Example: connecting a machine to a power outlet gives the machine the `Powered` Marker. Disconnecting removes `Powered`. One outlet can power only one card at a time.

### Nadir

Nadir Veylan is represented in the dedicated **Nadir** zone rather than by a separate character sheet.

For now, his persistent representation is divided across three cards:

- **Body** — physical state,
- **Mind** — cognitive / will state,
- **Spirit** — emotional / spiritual state.

More persistent Nadir cards may be added later if a concrete need appears.

Relevant persistent character state is expressed as attributes on those cards.

Conditions that currently apply to Nadir are represented as **temporary cards in the Nadir zone** rather than being forced into Body, Mind, or Spirit.

Confirmed examples include:

- `Exhausted`
- `Flesh Wound`

These condition cards exist while the condition applies. Their creation, progression, healing, expiry, and removal rules are not yet decided.

This gives the Nadir zone two kinds of content without introducing a separate UI model:

- persistent cards that describe ongoing parts of Nadir,
- temporary cards that describe current conditions affecting him.

### Drag affordances

Whenever the player drags a card:

1. Every card that can legally receive it as an interaction target highlights.
2. Legal zone placement for movement should remain legible without being confused with a card interaction target.
3. Potential state changes should be previewed before the drop is committed.
4. Invalid targets should not suggest that they accept the card.

Example: dragging food over **Body** should preview something like:

`Hunger 67 → 98`

The preview should appear on or immediately adjacent to the affected stat.

### Eating

Food is consumed by dragging a food card onto **Body**.

Dropping the food applies the food's hunger effect, consumes the food card, clamps Hunger to its valid range, and updates the visible Hunger value immediately.

For the first prototype, do **not** add a second hidden stomach/fullness system. This remains a prototype simplification rather than a permanent design rule.

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
