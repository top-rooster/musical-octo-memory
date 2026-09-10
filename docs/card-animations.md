# Card animations

This document records decided presentation rules for card creation/removal in Safe Room.

## DECIDED BY SIMON

Card state changes that physically add or remove a card should normally be legible through animation rather than abrupt appearance/disappearance.

Search decks are **not cards**. Deck presentation/removal rules are separate and do not inherit card discard behavior automatically.

### Draw animation

When a card is drawn from a deck, it must visibly animate out from that deck before settling into its legal position in the Room.

The Tunnels Explore deck is the first concrete use of this rule.

### Discard animation

Whenever an ordinary card is discarded, it must use a visible discard animation rather than disappearing instantly.

This applies regardless of why the discard happened: an Action result, Process completion, consumption, spoilage replacement, or another game rule.

The exact visual treatment and timing of the discard animation remain open. The requirement is that the player can clearly perceive that the card was discarded before it leaves the play space.

### Search-deck exhaustion exception

For the current implementation, when a finite search deck has no cards remaining after its final draw, the deck object is removed from the room immediately.

This exhausted-deck removal uses **no animation**. It is not a card discard and therefore does not use the card discard animation.

This behavior is intentionally provisional. Search-deck exhaustion/presentation may receive different behavior later.
