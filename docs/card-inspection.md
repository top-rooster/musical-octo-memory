# Card inspection

This document records the current decided hover-inspection behavior for Safe Room.

## DECIDED BY SIMON

A card should remain visually compact during ordinary play, while additional explanation is available by hovering it with the mouse.

When the mouse cursor is over a card and no card is currently being dragged, show a textbox near the cursor and keep that textbox following the cursor while it remains over the card.

The textbox contains:

- a description of the card;
- one explanatory paragraph for every visible attribute currently on the card.

The attribute paragraph explains what the attribute means rather than merely repeating its name or current number.

Dragging takes precedence over inspection. Starting a drag hides/suppresses the textbox. The textbox returns only when the pointer is again hovering a card while no card is being dragged.

The textbox should be positioned so it remains readable and does not run outside the visible viewport.

### Description authoring

Card descriptions are authored in `data/cards.txt` as part of the card master definition.

The description is a line beginning with `>` immediately after the picture path. Example:

```text
Body
images/body.png
> Nadir's physical condition and basic survival needs.
Anchored
Hydration 50
Satiation 50
```

A card description is optional in authored data. If a card has no description, hovering the card must still show the inspection textbox, and its card-description section displays exactly:

`missing description`

The absence of a description must therefore never suppress the inspection textbox.

### Attribute descriptions

Attribute explanatory text is defined centrally as a **master description for each attribute** and reused on every card carrying that attribute. The same `Hydration`, `Anchored`, `Satiation`, `Cutting Tool`, etc. explanation should not be copied into individual card definitions.

The master attribute descriptions live in `data/attributes.txt`.

Each attribute entry uses the attribute name as its first line and its explanatory paragraph as the following line, with blank lines separating entries. Example:

```text
Hydration
How well hydrated Nadir is. Reaching zero is fatal.

Satiation
How well fed Nadir is. Reaching zero is fatal.

Anchored
This card belongs permanently to its home zone.
```

Attribute descriptions are authored data, not hard-coded tooltip prose in React components.
