# Rooms and navigation

This document records the current decided room model for Safe Room.

## DECIDED BY SIMON

### Opening and starting state

The game opens with a short **evacuation interlude** in an initial room rather than beginning with Nadir already established in a permanent Safe Room/base.

The immediate premise of the interlude is that **the authorities are coming and Nadir has to leave**. Before escaping, the player can choose a few available things to take by dragging those cards into Inventory. This acts as the player's starting-loadout choice rather than giving every new game the same fixed starting equipment.

After the interlude, Nadir escapes into **Tunnels**. The main survival/exploration game begins there.

Nadir therefore starts the main game without an established base of operations. One of the early play experiences is finding somewhere suitable and gradually establishing a base rather than receiving a prebuilt Safe Room at the beginning.

The exact name and contents of the opening room, exactly how many items the player may take, how the urgency of the escape is presented, and whether that opening room can ever be revisited are still open.

This supersedes the earlier assumption that `Safe Room` is Nadir's permanent starting base with a normal two-way 15-minute connection to Tunnels.

Rooms are navigable locations. Passage/exit points are represented as ordinary interactable cards in the Room zone, consistent with the universal card-on-card interaction language.

All travel/navigation cards are `Anchored` to their home room. They may be interacted with by dragging Nadir's **Body** onto them, but they cannot be carried away or permanently moved into another zone.

Because traversal is an Action, travel time advances game time and all active Processes update from that elapsed time under the normal Action rules.

### Tunnels navigation

**Tunnels** is the starting room for the main survival/exploration phase after the evacuation interlude.

The Tunnels search deck can reveal two additional travel cards. Once drawn, they remain as persistent room-local navigation cards in Tunnels:

- `Go to abandoned office` — dragging Body onto it commits a **15-minute Action** and moves Nadir to **Abandoned Office**.
- `Go to deep tunnels` — dragging Body onto it commits a **30-minute Action** and moves Nadir to **Deep Tunnels**.

Both cards are `Anchored` to Tunnels, consistent with the rule that all travel cards are anchored to their home room.

### Return travel from discovered rooms

Travel is symmetric for these first discovered rooms.

The **Abandoned Office** contains an Anchored travel card back to **Tunnels**. Dragging Body onto it commits a **15-minute Action** and returns Nadir to Tunnels.

The **Deep Tunnels** contains an Anchored travel card back to **Tunnels**. Dragging Body onto it commits a **30-minute Action** and returns Nadir to Tunnels.

For these links, the return trip therefore uses the same travel time as the outbound trip.

### World existence and discovery

Persistent world rooms exist from the beginning of a new game whether or not Nadir has discovered a route to them yet.

Discovery controls access and what travel options become visible to the player. It does not create, instantiate, or activate the destination room.

Tunnels, Abandoned Office, and Deep Tunnels therefore all exist from game start. Their room-local state can exist and evolve before Nadir first gains access to them, subject to the normal rules for off-screen room state and Processes.

The opening evacuation room is a special introductory location. Whether it remains part of the persistent world after Nadir escapes is still open.

### Room backgrounds

Each room has its own background image.

The background belongs to the room itself and changes when the active room changes. It provides place identity and atmosphere only; mechanically meaningful state remains represented by cards rather than being encoded into the background image.

Tunnels, Abandoned Office, Deep Tunnels, and the opening room therefore each have their own room background.

### Room-local cards

Cards in the Room zone belong to the current room. They do not follow Nadir when he changes rooms.

When Nadir changes room:

- the current room's Room-zone cards remain associated with that room;
- those cards are no longer displayed as the active Room contents;
- the destination room's cards replace them in the Room zone;
- Inventory remains persistent and visible across the room change.

Changing rooms therefore swaps the active Room-zone card set rather than transferring the existing Room cards into the destination room.

### Persistent off-screen room state

A persistent room preserves the exact state of its cards while Nadir is elsewhere.

This includes each card's identity, current Markers and Values, relationships, and exact position within that room. Leaving a persistent room does not reset or respawn its contents, and returning to it restores the room visually with the cards where the player left them, subject to any state changes that occurred while away.

Persistent rooms are off-screen, not paused. Processes continue to progress according to elapsed game time even when Nadir is not present in the room. If Actions performed elsewhere advance game time, Processes in inactive persistent rooms receive that elapsed time under the same Process rules as Processes in the current room.

For example, spoilage or another unattended Process may continue while Nadir is elsewhere and may have changed or completed before he returns.

### Search decks

Search decks are room-local. They stay with their room and do not follow Nadir.

A search deck is **not a card**. It is a separate interactive room object that contains and produces cards. Card-instance rules, attributes, stacking, Anchored behavior, inspection, and discard behavior do not automatically apply to decks unless a future deck rule explicitly says so.

All search decks use the same basic interaction:

1. the player clicks the deck;
2. clicking commits a **15-minute Action**;
3. when that Action resolves, one card is drawn from the deck using the normal visible card-draw animation;
4. the deck is depleted by exactly one card.

Because searching is an Action, those 15 minutes advance game time and all active Processes everywhere receive the elapsed time under the normal rules.

All search decks are finite and depletable. Each deck has an authored finite set of cards and does not automatically refill.

**All search decks in the world are shuffled at game start, including decks in rooms Nadir has not yet discovered.** The resulting order becomes each deck's fixed hidden draw order for the entire run. Search decks are not reshuffled between draws, and drawing a card does not reroll the result. This means two new games may produce different discovery sequences while a single run remains deterministic after its initial shuffle.

The player is **not shown how many cards remain** in a search deck for now.

For the current implementation, when the final card is drawn, the exhausted search deck is removed from its room entirely. There is no Empty deck object or placeholder, and this deck removal uses **no animation**.

That exhausted-deck behavior is intentionally provisional and should be revisited later rather than treated as the final deck model.

Each room may define its own search-deck size, contents, and label. Sharing the interaction, depletion, shuffle, and current exhaustion rules does not imply that different rooms use the same card pool or the same number of cards.

The **Tunnels** room contains the currently defined `Explore` deck. Detailed rules and current composition for that deck are recorded in `docs/explore-deck.md`.

The **Abandoned Office** has its own search deck, separate from the Tunnels deck. For now, it contains **10 blank placeholder cards** so the room and search mechanics can be implemented before its actual contents are designed.

The **Deep Tunnels** has its own search deck, separate from both the Tunnels and Abandoned Office decks. For now, it also contains **10 blank placeholder cards**.

Those blank cards are temporary implementation scaffolding rather than final game content. Their real compositions remain open and should be designed later.

The exact labels of the Abandoned Office and Deep Tunnels search decks have not yet been decided.

The exact authored level-data syntax for rooms, backgrounds, exits, destination references, room-local card state, and deck definitions should follow the existing low-boilerplate text-data direction and be fixed when the first navigable rooms are implemented.
