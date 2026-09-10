# Drag feedback

This document records the current decided drag-feedback behavior for Safe Room.

## DECIDED BY SIMON

While a card is being dragged, the interface should communicate both potential interactions and what will happen if the player releases the card at its current position.

### Card target states

- A card that can legally receive the dragged card highlights using the normal legal-target highlight while it is merely available as a target.
- When the dragged card is actually hovering over a legal receiving card, that target changes to **yellow**. Yellow means: releasing the dragged card at its current position will commit the interaction/combination with the card below.
- When the dragged card is hovering over a card that cannot legally receive it, the card below highlights **red**. Red means: releasing here will not produce a legal card-on-card interaction.

The hover state therefore overrides the ordinary legal-target presentation for the card currently underneath the dragged card.

### Known effect previews

As soon as a card starts being dragged, every legal accepting target should show any known direct attribute changes that would result from that source/target interaction. The player should not need to hover the dragged card over the target before seeing the preview.

The preview belongs on or immediately adjacent to the affected attribute on the accepting card. Examples include:

- dragging Rat Meat while Body has `Satiation 67` shows `67 → 82` on Body immediately;
- dragging Canned Food while Body has `Satiation 67` shows `67 → 92` on Body immediately;
- dragging a water source for a known hydration interaction may show `Hydration 50 → 75` on the accepting card immediately.

This applies only to consequences that Nadir/the player currently understands. Knowledge-dependent uncertainty and undiscovered consequences remain governed by the broader preview rules in `docs/game-design.md`.

Hovering a legal target changes its target-state highlight to yellow, but does not control whether its known stat preview is visible.

### Zone state

The Room or Inventory background receives a **subtle zone highlight** when releasing the currently dragged card at its current position would be accepted as ordinary placement in that zone.

The zone highlight reflects the actual current drop, not merely whether that card type is generally permitted in the zone. It must therefore respect at least:

- `Anchored`,
- Inventory capacity,
- zone bounds,
- ordinary card-overlap rules.

If the dragged card is currently over another card, the card-under-pointer feedback is decisive:

- legal accepting card: target is yellow;
- rejecting card: target is red;
- the zone must not simultaneously suggest that the current release is valid ordinary placement.

### Intended visual language

- normal legal-target highlight: this card *can* accept the dragged card;
- known stat preview on a legal target: this is the understood direct effect if that interaction is committed;
- yellow hovered target: releasing *here now* will commit the interaction;
- subtle zone highlight: releasing *here now* will place the card in this zone;
- red hovered card: releasing *here now* is not accepted by the card below.

Exact colors, opacity, border treatment, glow, and animation strength are presentation details and may be tuned during playtesting. The semantic distinction above is the design rule.
