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

## DATA DIRECTION — SUGGESTED BY CHATGPT, NOT YET DECIDED BY SIMON

A useful authoring direction is:

- card descriptions live with card master data;
- an attribute explanation is authored once per attribute and reused wherever that attribute appears;
- explanatory prose remains data-driven rather than hard-coded in React components.

This avoids duplicating the same explanation for attributes such as `Anchored`, `Hydration`, `Satiation`, `Cutting Tool`, or `Contains-Water` across every card that uses them.
