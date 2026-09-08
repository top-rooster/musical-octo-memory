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

Whether non-interactable state or temporary conditions should also use card representation is not yet decided.

### Attributes

All card attributes are visible on the card. There are no hidden/internal card attributes in the current model.

Every attribute is represented by an icon.

There are two attribute forms:

- **icon only** — the presence of the attribute itself carries the meaning,
- **icon plus integer** — the attribute also has a numerical value.

Examples on Nadir:

- `Player` — icon only,
- `Anchored` — icon only,
- `Health 100` — icon plus integer.

Working terminology for these two forms is still undecided. ChatGPT has suggested **Marker attribute** for icon-only attributes and **Value attribute** for icon-plus-integer attributes; these names are not yet a design decision.

#### Anchored

`Anchored` is an icon-only attribute that prevents a card from being transferred by dragging between the Room and Inventory zones.

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

Cards may not overlap in ordinary placement. If cards are deliberately stacked, they snap into a neat, aligned stack rather than overlap arbitrarily.

### Stacks

A stack is either **active** or **passive**.

#### Passive stack

A passive stack is a visual convenience for identical cards that would otherwise occupy unnecessary space.

- The cards do not all need to remain individually exposed.
- The stack shows a count of how many identical cards it contains.
- The stack does not represent a process merely by existing.

#### Active stack

An active stack is mechanically meaningful. Creating the active stack starts its effect immediately.

Every participating card remains individually identifiable: the name of every card in the stack stays visible.

Active stacks have two forms: **process** and **permanent**.

##### Process active stack

A process stack is finite.

- Creating the stack starts the process.
- The top card gets a `Progress` integer attribute.
- `Progress` ranges from 0 to 100.
- When `Progress` reaches 100, the process is complete.
- The process may change attributes on cards in the stack.

What advances `Progress` is not yet decided; this must not be assumed to be real-time until the design explicitly chooses that.

##### Permanent active stack

A permanent active stack does not complete by itself. Its effect exists for as long as the stack relationship exists.

The player can break the relationship by removing a card from the stack. Effects granted by the relationship disappear when it is broken.

Example: stacking a machine on a power outlet gives the machine the icon-only `Powered` attribute. Removing the machine from the power outlet removes `Powered`.

A single power outlet can power only one card at a time.

### Nadir

Nadir Veylan is represented by a card in Inventory with the `Anchored` attribute. He therefore cannot be transferred into the Room zone, but his card can still be repositioned within Inventory or dragged onto other cards when an interaction allows it.

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
