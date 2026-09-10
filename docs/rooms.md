# Rooms and navigation

This document records the current decided room model for Safe Room.

## DECIDED BY SIMON

Nadir starts in the room named **Safe Room**.

The generic room currently shown by the prototype should be treated as that Safe Room rather than as an abstract unnamed room.

Rooms are navigable locations. Passage/exit points are represented as ordinary interactable cards in the Room zone, consistent with the universal card-on-card interaction language.

All travel/navigation cards are `Anchored` to their home room. They may be interacted with by dragging Nadir's **Body** onto them, but they cannot be carried away or permanently moved into another zone.

The Safe Room contains a navigation card titled:

`To the tunnels`

Dragging Nadir's **Body** card onto `To the tunnels` commits a **15-minute Action** that moves Nadir from **Safe Room** to **Tunnels**.

Because traversal is an Action, those minutes advance game time and all active Processes update from that elapsed time under the normal Action rules.

### Tunnels navigation

The **Tunnels** room contains a navigation card titled:

`To the safe room`

Dragging Nadir's **Body** card onto `To the safe room` commits a **15-minute Action** and returns Nadir to **Safe Room**.

The Tunnels Explore deck can also reveal two additional travel cards. Once drawn, they remain as persistent room-local navigation cards in Tunnels:

- `Go to abandoned office` — dragging Body onto it commits a **15-minute Action** and moves Nadir to **Abandoned Office**.
- `Go to deep tunnels` — dragging Body onto it commits a **30-minute Action** and moves Nadir to **Deep Tunnels**.

Both cards are `Anchored` to Tunnels, consistent with the rule that all travel cards are anchored to their home room.

### Return travel from discovered rooms

Travel is symmetric for these first discovered rooms.

The **Abandoned Office** contains an Anchored travel card back to **Tunnels**. Dragging Body onto it commits a **15-minute Action** and returns Nadir to Tunnels.

The **Deep Tunnels** contains an Anchored travel card back to **Tunnels**. Dragging Body onto it commits a **30-minute Action** and returns Nadir to Tunnels.

For these links, the return trip therefore uses the same travel time as the outbound trip.

### Room backgrounds

Each room has its own background image.

The background belongs to the room itself and changes when the active room changes. It provides place identity and atmosphere only; mechanically meaningful state remains represented by cards rather than being encoded into the background image.

Safe Room, Tunnels, Abandoned Office, and Deep Tunnels therefore each have their own room background.

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

### Search decks

Search decks are room-local. They stay with their room and do not follow Nadir.

All search decks use the same basic interaction:

1. the player clicks the deck;
2. clicking commits a **15-minute Action**;
3. when that Action resolves, one card is drawn from the deck using the normal visible card-draw animation;
4. the deck is depleted by exactly one card.

Because searching is an Action, those 15 minutes advance game time and all active Processes everywhere receive the elapsed time under the normal rules.

All search decks are finite and depletable. Each deck has an authored finite set of cards and does not automatically refill.

Every search deck is shuffled once when a new game starts. The resulting order becomes that deck's fixed hidden draw order for the entire run. Search decks are not reshuffled between draws, and drawing a card does not reroll the result. This means two new games may produce different discovery sequences while a single run remains deterministic after its initial shuffle.

When the final card is drawn, the exhausted search deck is removed from its room entirely. There is no Empty deck card or placeholder for now, and the exhausted deck itself is removed with **no animation**.

Each room may define its own search-deck size, contents, and label. Sharing the interaction, depletion, shuffle, and exhaustion rules does not imply that different rooms use the same card pool or the same number of cards.

The **Tunnels** room contains the currently defined `Explore` deck. Detailed rules and current composition for that deck are recorded in `docs/explore-deck.md`.

The **Abandoned Office** has its own search deck, separate from the Tunnels deck.

The **Deep Tunnels** has its own search deck, separate from both the Tunnels and Abandoned Office decks.

The exact labels, sizes, and compositions of the Abandoned Office and Deep Tunnels search decks have not yet been decided.

The exact authored level-data syntax for rooms, backgrounds, exits, destination references, room-local card state, and deck definitions should follow the existing low-boilerplate text-data direction and be fixed when the first navigable rooms are implemented.
