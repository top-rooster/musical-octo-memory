# Safe Room — implementation roadmap

## Milestone 1: interaction prototype

Build a small browser prototype whose only purpose is to validate the core card interaction language.

### Required behavior

- Use React + TypeScript + Vite.
- Show three zones on one screen: **Room**, **Inventory**, and **Nadir**.
- The **Nadir** zone contains three persistent Nadir cards:
  - **Body**,
  - **Mind**,
  - **Spirit**.
- All three persistent Nadir cards have `Anchored` and remain persistently in the Nadir zone. `Anchored` does not prevent dragging a card onto another card for an interaction.
- Put visible `Hunger` and `Health` attributes on **Body** for the prototype. `Health` remains prototype scope rather than a confirmed permanent survival attribute.
- Temporary Nadir condition cards such as `Exhausted` and `Flesh Wound` are part of the design, but their lifecycle mechanics are not required in Milestone 1.
- Seed the prototype with a few movable cards, including at least two food cards with different hunger effects and one non-food item.
- Cards can be dragged between Room and Inventory when the destination is legal.
- Gameplay interactions are card-on-card: dragging one card onto another card initiates the interaction.
- While dragging a card, all legal card interaction targets highlight.
- Dragging food over **Body** previews the exact resulting hunger value in the form `67 → 98` before the drop.
- Dropping food on **Body** applies the effect and consumes the food card.
- Hunger is clamped to 0–100.
- Invalid drops leave state unchanged.
- The UI should be plain and readable. Do not spend time on final art, animation polish, sound, narrative content, persistence, combat, crafting, or world simulation yet.

### Architecture constraints

- Keep card definitions and effects as data rather than hard-coding each individual card in UI components.
- Implement `Anchored` as an attribute-driven rule, not as a special Nadir card type. It prevents persistent zone transfer while preserving legal card-on-card dragging.
- Keep state transition/game-rule functions separate from React rendering where practical.
- Avoid a heavy state-management library for this prototype unless there is a demonstrated need.
- Add lightweight automated tests for the pure game-rule logic, especially food consumption, hunger clamping, invalid interactions, and the fact that anchored cards cannot be persistently transferred out of their home zone.

### Done means

A developer can clone the repo, install dependencies, start the app, and immediately test the full interaction loop above in a browser. `README.md` and `AGENTS.md` contain the exact commands needed.

## Not yet

Do not implement these during Milestone 1:

- cross-zone Process presentation for anchored Nadir cards,
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
