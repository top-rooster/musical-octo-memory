# Explore deck

This document records the current decided Tunnels Explore-deck behavior for Safe Room.

## DECIDED BY SIMON

The **Tunnels** room contains a Search deck named `Explore` in authored room data.

A Search deck is **not a card**. It is a separate room-local interactive object that contains and produces cards. Card-instance rules, card attributes, Anchored behavior, stacking, card inspection, and discard behavior do not automatically apply to decks.

### Presentation

All Search decks use the same dedicated face-down backside artwork:

`images/search-back.png`

The artwork covers the complete deck face and contains a stylized `Search` as part of the image. Explore does not receive a room-specific backside.

The player is not shown how many cards remain.

### Searching

The player searches by clicking the deck.

Search has a base Action duration of **15 minutes**. Effective Vision may multiply that duration according to `docs/lighting-and-vision.md`:

- Vision 0 or lower: searching unavailable;
- Vision 1: 3x search time;
- Vision 2: 2x search time;
- Vision 3 or higher: normal search time.

When the Search Action resolves, one card is visibly drawn from the deck.

Because Search is an Action, the resulting elapsed time advances the central game clock and is available to Processes.

### Depletion

Explore is finite and starts with **10 cards**.

Each successful Search removes exactly one card. A drawn card does not automatically return to the deck and the deck does not refill.

When the final card is drawn, the exhausted deck disappears from the room immediately with **no deck-removal animation**. This exhausted-deck behavior is provisional and may be redesigned later.

### Draw order

Like every Search deck in the world, Explore is shuffled once at new-game creation, even if the containing room were not yet discovered.

That shuffled order becomes the fixed hidden draw order for the run. There is no reshuffle between draws and no per-draw reroll.

### Draw animation and placement

The drawn card must visibly animate outward from the deck rather than simply appearing.

It then settles in the nearest legal free Room position beside the deck. If that position is occupied, choose the nearest other legal free position. A draw must not create ordinary card overlap.

### Current composition

The Tunnels Explore deck contains exactly:

- `Scrap Metal` x2
- `Pipe` x1
- `Squatter` x1
- `Dead Rat` x1
- `Plastic Bottle` x1, starting empty
- `Puddle of Water` x1
- `Go to deep tunnels` x1
- `Go to abandoned office` x1
- `Service Cabinet` x1, starting `Locked`

The authored composition is also present in `data/rooms.json` and should not be duplicated as a TypeScript constant.

### Travel cards revealed by Explore

`Go to abandoned office` and `Go to deep tunnels` are persistent navigation cards once drawn. They remain in Tunnels rather than being consumed when used.

Both are `Anchored` to Tunnels.

- `Go to abandoned office` + Body -> travel Action to Abandoned Office, base **15m**;
- `Go to deep tunnels` + Body -> travel Action to Deep Tunnels, base **30m**.

Vision may multiply travel time. A Flashlight is not a hard requirement for Deep Tunnels.

The mechanics of Pipe, Squatter, Puddle of Water, and Service Cabinet remain intentionally undefined for Milestone 2.

## OPEN

The following remain open:

- whether a future explicit rule can return cards to a Search deck;
- future representation/behavior of an exhausted deck;
- exact card-draw animation timing/visual polish beyond the required visible draw.
