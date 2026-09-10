# Explore deck

This document records the current decided Explore-deck behavior for Safe Room.

## DECIDED BY SIMON

The **Tunnels** room contains a deck of cards labeled `Explore`.

The player interacts with the deck by clicking it. Clicking the deck commits a **15-minute Action** and draws one card from the deck when that Action resolves.

Because Explore is an Action, those 15 minutes advance game time and all active Processes update from that elapsed time, including Processes in rooms where Nadir is not present.

The draw must use a visible card-draw animation so the new card is presented as being drawn from the deck rather than simply appearing.

The Explore deck belongs to the Tunnels room. It is not part of Inventory and does not follow Nadir to another room.

### Depletion

The Explore deck is finite and depletable.

For now, the Tunnels Explore deck starts with **10 cards**.

Each successful Explore draw removes exactly one card from the deck. A drawn card does not automatically return to the deck and the deck does not automatically refill or reshuffle.

The exact composition and order of those ten cards remain separate design decisions.

## OPEN

The following details are not yet decided:

- the exact ten cards that can be drawn from Explore;
- whether draw order is random, weighted, or fixed;
- where the drawn card is initially placed in the room;
- whether an explicit future rule can ever return a drawn card to the deck;
- what happens when the deck is exhausted;
- the exact animation timing and visual treatment.
