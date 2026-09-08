# Safe Room — implementation roadmap

## Milestone 1: interaction prototype

Build a small browser prototype whose only purpose is to validate the core card interaction language.

### Required behavior

- Use React + TypeScript + Vite.
- Show two zones on one screen: **Room** and **Inventory**.
- **Room** represents the currently viewed physical space.
- **Inventory** is persistent and remains on screen when Nadir moves to another room.
- Inventory contains three persistent Nadir cards:
  - **Body**,
  - **Mind**,
  - **Spirit**.
- All three persistent Nadir cards have `Anchored` with Inventory as their home zone. They may be dragged across the Room/Inventory boundary, but cannot come to rest in Room as ordinary placement. If released onto bare Room space, they return to Inventory.
- `Anchored` does not prevent dragging a card onto another card for a legal interaction.
- Put visible `Hunger` and `Health` attributes on **Body** for the prototype. `Health` remains prototype scope rather than a confirmed permanent survival attribute.
- Temporary Nadir condition cards such as `Exhausted` and `Flesh Wound` are part of the design and also live in Inventory, but their lifecycle mechanics are not required in Milestone 1.
- Seed the prototype with a few movable cards, including at least two ingestible food cards with different hunger effects and one non-ingestible item.
- Give every card Nadir can eat/ingest a visible ingestion **Marker**. The final product-facing name of this Marker is not yet fixed; use one consistent prototype identifier without treating that identifier as locked design terminology.
- Non-anchored cards can be dragged between Room and Inventory when the destination is legal.
- Gameplay interactions are card-on-card: dragging one card onto another card initiates the interaction.
- Interaction legality must be driven by card attributes rather than by a hard-coded list of specific food card IDs. For the prototype, **Body** accepts cards carrying the ingestion Marker for the eating interaction.
- While dragging a card, all legal card interaction targets highlight.
- Dragging an ingestible food card over **Body** previews the exact resulting hunger value in the form `67 → 98` before the drop.
- Dropping an ingestible food card on **Body** applies the effect and consumes the food card.
- The non-ingestible item must not be accepted by **Body** merely because it is a movable card.
- Hunger is clamped to 0–100.
- Invalid drops leave state unchanged. An anchored card released outside its home zone without a legal accepting interaction returns home.
- The UI should be plain and readable. Do not spend time on final art, animation polish, sound, narrative content, persistence beyond the visible Inventory behavior, combat, crafting, or world simulation yet.

### Architecture constraints

- Keep card definitions and effects as data rather than hard-coding each individual card in UI components.
- Implement source/target interaction matching so a target can accept a source based on visible source attributes. Milestone 1 only needs the ingestion-Marker → Body example, but do not couple the rule to specific food master definitions.
- Do not introduce generic `Consumable` or `Reusable` classifications for the prototype. Whether a card is consumed or remains is part of the interaction result.
- Implement `Anchored` as an attribute-driven home-zone rule, not as a special Nadir card type. It prevents the card from coming to rest outside its home zone while preserving cross-zone dragging and legal card-on-card interaction.
- Keep state transition/game-rule functions separate from React rendering where practical.
- Avoid a heavy state-management library for this prototype unless there is a demonstrated need.
- Add lightweight automated tests for the pure game-rule logic, especially ingestion-Marker matching, rejection of a non-ingestible card by Body, food consumption, hunger clamping, invalid interactions, and anchored-card return-to-home behavior after a foreign-zone release.

### Done means

A developer can clone the repo, install dependencies, start the app, and immediately test the full interaction loop above in a browser. `README.md` and `AGENTS.md` contain the exact commands needed.

## Not yet

Do not implement these during Milestone 1:

- **Action** windows that advance game time to completion,
- the `Skinning` Action, `Cutting Tool`, tool Durability behavior, or other Action-specific completion transformations,
- unattended **Process** progression while Nadir performs Actions or other time-consuming activities,
- Process completion transformations,
- `Spoilage`, `Dead Rat` → `Rotten Meat`, rotten-food penalties, or other timed food decay,
- dehydration simulation or Burn Wound effects on dehydration,
- ongoing cross-zone Process presentation for anchored participants,
- temporary condition creation/removal/healing rules,
- complete survival simulation,
- hidden stomach/fullness mechanics,
- NPC schedules,
- stealth/search-team simulation,
- traps/turrets,
- noise propagation,
- save games,
- story/dialogue,
- final visual identity,
- a permanent engine decision.

Those follow only after the card interaction prototype gives us something concrete to evaluate.
