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

### Room-local cards

Cards in the Room zone belong to the current room. They do not follow Nadir when he changes rooms.

When Nadir leaves Safe Room:

- the Safe Room's Room-zone cards remain associated with Safe Room;
- those cards are no longer displayed as the active Room contents;
- the cards belonging to Tunnels replace them in the Room zone;
- Inventory remains persistent and visible across the room change.

Changing rooms therefore swaps the active Room-zone card set rather than transferring the existing Room cards into the destination room.

The exact authored level-data syntax for rooms, exits, destination references, and room-local card state should follow the existing low-boilerplate text-data direction and be fixed when the first navigable rooms are implemented.

## OPEN

Whether a room preserves the exact state and positions of all its cards while Nadir is away has not yet been explicitly decided.
