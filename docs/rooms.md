# Rooms and navigation

This document records the current decided room model for Safe Room.

## DECIDED BY SIMON

Nadir starts in the room named **Safe Room**.

The generic room currently shown by the prototype should be treated as that Safe Room rather than as an abstract unnamed room.

Rooms are navigable locations. Passage/exit points are represented as ordinary interactable cards in the Room zone, consistent with the universal card-on-card interaction language.

The Safe Room contains a navigation card titled:

`To the tunnels`

Dragging Nadir's **Body** card onto `To the tunnels` changes the current room to **Tunnels**.

Changing room replaces the visible Room-zone contents with the contents of the destination room. Inventory remains persistent and visible across room changes.

The exact authored level-data syntax for rooms, exits, and destination references should follow the existing low-boilerplate text-data direction and be fixed when we implement the first navigable rooms.

## OPEN

Whether moving between rooms advances game time has not yet been decided.

Because only Actions advance game time in the current design, any room traversal that consumes time must be represented as an Action. If traversal is free, the Body-on-exit interaction can change rooms immediately without advancing time.
