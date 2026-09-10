# Rooms and navigation

This document records the current decided room model for Safe Room.

## DECIDED BY SIMON

Nadir starts in the room named **Safe Room**.

The generic room currently shown by the prototype should be treated as that Safe Room rather than as an abstract unnamed room.

Rooms are navigable locations. Passage/exit points are represented as ordinary interactable cards in the Room zone, consistent with the universal card-on-card interaction language.

The Safe Room contains a navigation card titled:

`To the tunnels`

Dragging Nadir's **Body** card onto `To the tunnels` commits a **15-minute Action** that moves Nadir from **Safe Room** to **Tunnels**.

Because traversal is an Action, those 15 minutes advance game time and all active Processes update from that elapsed time under the normal Action rules.

### Tunnels navigation

The **Tunnels** room contains a navigation card titled:

`To the safe room`

Dragging Nadir's **Body** card onto `To the safe room` commits the corresponding room-traversal Action and returns Nadir to **Safe Room**. Room traversal currently takes **15 minutes**.

### Room-local cards

Cards in the Room zone belong to the current room. They do not follow Nadir when he changes rooms.

When Nadir leaves Safe Room:

- the Safe Room's Room-zone cards remain associated with Safe Room;
- those cards are no longer displayed as the active Room contents;
- the cards belonging to Tunnels replace them in the Room zone;
- Inventory remains persistent and visible across the room change.

Changing rooms therefore swaps the active Room-zone card set rather than transferring the existing Room cards into the destination room.

### Persistent off-screen room state

A room preserves the exact state of its cards while Nadir is elsewhere.

This includes each card's identity, current Markers and Values, relationships, and exact position within that room. Leaving a room does not reset or respawn its contents, and returning to it restores the room visually with the cards where the player left them, subject to any state changes that occurred while away.

Rooms are off-screen, not paused. Processes continue to progress according to elapsed game time even when Nadir is not present in the room. If Actions performed elsewhere advance game time, Processes in inactive rooms receive that elapsed time under the same Process rules as Processes in the current room.

For example, spoilage or another unattended Process may continue while Nadir is in Tunnels and may have changed or completed before he returns to Safe Room.

### Explore deck in Tunnels

The **Tunnels** room contains a deck of cards labeled:

`Explore`

The Explore deck is a room-local interactive deck rather than an ordinary loose card. When the player clicks the Explore deck, one card is drawn from it.

Drawing from the deck must be presented with a visible **card draw animation** so the result feels like a physical card being drawn rather than a card simply appearing instantaneously.

The exact contents of the Explore deck, draw ordering/randomization, whether cards can return to the deck, and what happens when the deck becomes empty are not yet decided.

The exact authored level-data syntax for rooms, exits, destination references, room-local card state, and deck definitions should follow the existing low-boilerplate text-data direction and be fixed when the first navigable rooms are implemented.
