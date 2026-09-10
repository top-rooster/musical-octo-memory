# Explore deck

This document records the current decided Explore-deck behavior for Safe Room.

## DECIDED BY SIMON

The **Tunnels** room contains a deck of cards labeled `Explore`.

A search deck is **not a card**. It is a separate room-local interactive object that contains and produces cards. Card-instance rules, card attributes, Anchored behavior, stacking, card inspection, and discard behavior do not automatically apply to decks unless explicitly defined for decks later.

The player interacts with the deck by clicking it. Clicking the deck commits a **15-minute Action** and draws one card from the deck when that Action resolves.

Because Explore is an Action, those 15 minutes advance game time and all active Processes update from that elapsed time, including Processes in rooms where Nadir is not present.

The draw must use a visible card-draw animation so the new card is presented as being drawn from the deck rather than simply appearing.

The Explore deck belongs to the Tunnels room. It is not part of Inventory and does not follow Nadir to another room.

### Depletion

The Explore deck is finite and depletable.

For now, the Tunnels Explore deck starts with **10 cards**.

Each successful Explore draw removes exactly one card from the deck. A drawn card does not automatically return to the deck and the deck does not automatically refill or reshuffle.

The player is **not shown a remaining-card count** for search decks for now.

When the final card is drawn, the now-empty Explore deck is removed from the room entirely. The deck itself uses **no removal animation** when this happens.

This exhausted-deck behavior is provisional and may be replaced by different deck behavior later. For now there is no persistent Empty deck object or placeholder.

### Draw order

The Explore deck is shuffled once when a new game starts. That shuffled result becomes the deck's fixed hidden draw order for that run.

The deck is not reshuffled between draws and an individual draw does not reroll its result. Different new games should therefore produce different Explore sequences, while a single run preserves the order established at game start.

### Draw placement

When a card is drawn, it animates outward from the Explore deck and is then placed in the nearest legal free space beside the deck.

If there is no legal free position immediately beside the deck, the game finds the nearest other legal free position in the Tunnels room. A newly drawn card must not be placed overlapping another card merely because the preferred area is occupied.

### Current 10-card composition

For now, the Tunnels Explore deck contains exactly:

- `Scrap Metal` ×2
- `Pipe` ×1
- `Squatter` ×1
- `Dead Rat` ×1
- `Plastic Bottle` ×1, starting empty (no `Contains-Water` Marker)
- `Puddle of Water` ×1
- `Go to deep tunnels` ×1
- `Go to abandoned office` ×1
- `Service Cabinet` ×1, starting locked

### Travel cards revealed by Explore

`Go to abandoned office` and `Go to deep tunnels` are persistent navigation cards once drawn. They remain in Tunnels rather than being consumed when used.

All travel/navigation cards are `Anchored` to their home room.

- `Go to abandoned office` accepts Nadir's **Body** and commits a **15-minute Action** that moves Nadir to **Abandoned Office**.
- `Go to deep tunnels` accepts Nadir's **Body** and commits a **30-minute Action** that moves Nadir to **Deep Tunnels**.

The remaining mechanics of `Pipe`, `Squatter`, `Puddle of Water`, and `Service Cabinet` are still to be designed explicitly rather than inferred from their names.

## OPEN

The following details are not yet decided:

- whether an explicit future rule can ever return a drawn card to the deck;
- the future representation/behavior of an exhausted deck;
- the exact animation timing and visual treatment beyond the requirement that the card visibly draws out from the deck.
