# Explore deck implementation notes

This file captures implementation scope for the first Explore-deck prototype.

## Required behavior

- Tunnels contains an `Explore` deck.
- Clicking the deck draws exactly one card.
- The drawn card is visibly animated as coming from the deck.
- The deck remains room-local to Tunnels.
- Do not invent deck depletion, reshuffling, draw probabilities, card composition, or time cost until those design questions are decided.

## Scope boundary

This is a UI/game-state extension only. Preserve existing drag/drop, Room/Inventory persistence, card data, and Action/Process rules.
