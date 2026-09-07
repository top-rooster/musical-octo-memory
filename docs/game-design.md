# Safe Room — current game design

## Design goal

Safe Room is a narrative survival/stealth game about isolation, preparation, and risk. The interface should feel like a physical workspace: cards represent people, items, and other manipulable objects; rooms are stable spatial contexts; the player learns the world by moving and combining things rather than navigating menus.

The game should create complexity from interactions between a relatively small number of visible systems. Avoid exposing many redundant bars, sub-stats, or overlapping resource models when the same decision can be expressed directly on cards.

## Current interaction model

### Zones

The main play space has at least two conceptual zones:

- **Room area** — the currently viewed physical space.
- **Inventory area** — persistent carried possessions and anchored character information.

Movable cards can be dragged back and forth between appropriate zones.

### Nadir

Nadir Veylan is represented by an **anchored card in the inventory**. His card is not dragged around like an ordinary item.

Character state is expressed primarily as attributes on Nadir's card rather than through a separate character-stat subsystem.

For the first prototype, expose at least:

- Hunger
- Health

Other attributes can be added later only when they create meaningful decisions.

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

For now, do **not** add a second hidden stomach/fullness system. The goal of the prototype is to test whether a small number of legible attributes can still create interesting decisions.

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
