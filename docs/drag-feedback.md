# Drag feedback

This document records the current decided drag-feedback behavior for Safe Room.

## DECIDED BY SIMON

While a card is being dragged, the interface should communicate both potential interactions and what will happen if the player releases the card at its current position.

### Card target states

- A card that can legally receive the dragged card highlights using the normal legal-target highlight while it is merely available as a target.
- For ordinary gameplay interactions, when the dragged card is actually hovering over a legal receiving card, that target changes to **yellow**. Yellow means: releasing the dragged card at its current position will commit the interaction/combination with the card below.
- When the dragged card is hovering over a card that cannot legally receive it, the card below highlights **red**. Red means: releasing here will not produce a legal card-on-card interaction.

The hover state therefore overrides the ordinary legal-target presentation for the card currently underneath the dragged card, except for the Stack-specific rule below.

### Interaction-type highlighting

Use one common legality language regardless of whether the accepting interaction is an Action, Process, Connection, consumption, repair, or another mechanically meaningful interaction. Do not assign different target colors merely to encode interaction type.

**Stack acceptance is the exception.** Because a Stack has no gameplay consequence beyond visual compression, a legal Stack target remains **green** while the dragged card is hovering over it and when release would create/join the Stack. It does not change to yellow for "release to commit."

The semantic distinction is therefore:

- green = legal target available; for Stack, green also means release here to stack;
- yellow = release here now to commit a mechanically meaningful legal interaction;
- red = the card below rejects the dragged card.

### Known effect previews

As soon as a card starts being dragged, every legal accepting target should show any known direct attribute changes that would result from that source/target interaction. The player should not need to hover the dragged card over the target before seeing the preview.

If one interaction has several known direct attribute changes, **all of those changes should be shown simultaneously** on the affected cards/attributes. Do not collapse them to a single representative change or wait for hover to reveal additional effects.

The preview belongs on or immediately adjacent to each affected attribute on the accepting card. Examples include:

- dragging Rat Meat while Body has `Satiation 67` shows `67 → 82` on Body immediately;
- dragging Canned Food while Body has `Satiation 67` shows `67 → 92` on Body immediately;
- dragging a source with several known direct effects shows every affected Value change at once, potentially across more than one accepting/affected card.

This applies only to consequences that Nadir/the player currently understands. Knowledge-dependent uncertainty and undiscovered consequences remain governed by the broader preview rules in `docs/game-design.md`.

Hovering a legal target changes its target-state highlight according to the rules above, but does not control whether its known stat previews are visible.

### Zone state

The Room or Inventory background receives a **subtle zone highlight** when releasing the currently dragged card at its current position would be accepted as ordinary placement in that zone.

The zone highlight reflects the actual current drop, not merely whether that card type is generally permitted in the zone. It must therefore respect at least:

- `Anchored`,
- Inventory capacity,
- zone bounds,
- ordinary card-overlap rules.

If the dragged card is currently over another card, the card-under-pointer feedback is decisive:

- ordinary legal accepting card: target is yellow;
- legal Stack target: target remains green;
- rejecting card: target is red;
- the zone must not simultaneously suggest that the current release is valid ordinary placement.

### Intended visual language

- normal green legal-target highlight: this card *can* accept the dragged card;
- green hovered Stack target: releasing *here now* will create/join a purely visual Stack;
- known stat previews on legal targets: these are the understood direct effects if the interaction is committed;
- yellow hovered target: releasing *here now* will commit a mechanically meaningful interaction;
- subtle zone highlight: releasing *here now* will place the card in this zone;
- red hovered card: releasing *here now* is not accepted by the card below.

Exact colors, opacity, border treatment, glow, and animation strength are presentation details and may be tuned during playtesting. The semantic distinction above is the design rule.
