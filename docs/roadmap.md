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
- Put visible `Hydration 50` and `Satiation 50` Values on **Body**.
- Values are clamped to 0–100 unless a specific Value explicitly defines another range.
- Reaching `Hydration 0` or `Satiation 0` is a game-over condition, although Milestone 1 does not need to implement the ongoing Processes that reduce those Values over time.
- Physical injury/health state is represented through injury and condition cards rather than a separate Body `Health` Value.
- Temporary Nadir condition cards such as `Exhausted` and `Flesh Wound` are part of the design and also live in Inventory, but their lifecycle mechanics are not required in Milestone 1.
- Seed the prototype with **Rat Meat** and **Canned Food** as the two ingestible food cards. They must have different Satiation effects. The exact gains remain a design input and must not be silently invented as permanent product values.
- Seed at least one non-ingestible movable item as a negative interaction example.
- Give every card Nadir can eat/ingest a visible ingestion **Marker**. The final product-facing name of this Marker is not yet fixed; use one consistent prototype identifier without treating that identifier as locked design terminology.
- Non-anchored cards can be dragged between Room and Inventory when the destination is legal.
- The only current rules that can prevent a Room/Inventory transfer are `Anchored` and the Inventory capacity limit.
- Gameplay interactions are card-on-card: dragging one card onto another card initiates the interaction.
- Interaction legality must be driven by card attributes rather than by a hard-coded list of specific food card IDs. For the prototype, **Body** accepts cards carrying the ingestion Marker for the eating interaction.
- While dragging a card, all legal card interaction targets highlight.
- Dragging an ingestible food card over **Body** previews the exact resulting Satiation value in the form `67 → 98` before the drop.
- Dropping an ingestible food card on **Body** applies the effect and consumes the food card.
- The non-ingestible item must not be accepted by **Body** merely because it is a movable card.
- Invalid drops leave state unchanged. An anchored card released outside its home zone without a legal accepting interaction returns home.
- The prototype's initial card definitions and initial Room/Inventory setup are loaded from the project's authored text data rather than being declared as TypeScript/React constants.
- The UI should be plain and readable. Do not spend time on final art, animation polish, sound, narrative content, persistence beyond the visible Inventory behavior, combat, crafting, or world simulation yet.

### Architecture constraints

- Follow `docs/data-language.md` for authored game data.
- **All card master data is authored in text files.** Runtime code may parse, validate, and transform it, but card masters must not be duplicated as hard-coded TypeScript/React objects.
- **Level design is also authored in text files.** The prototype's starting Room/Inventory contents must come from level data, not room-specific setup code.
- Preserve the terse data-language direction: low boilerplate, phone-friendly, no required braces/tabs/list lengths, and no unnecessary repeated field labels. Do not substitute JSON, YAML, TOON, or a verbose generic object format as the primary authoring source.
- Keep card definitions and effects as data rather than hard-coding each individual card in UI components.
- Implement source/target interaction matching so a target can accept a source based on visible source attributes. Milestone 1 only needs the ingestion-Marker → Body example, but do not couple the rule to specific food master definitions.
- Do not introduce generic `Consumable` or `Reusable` classifications for the prototype. Whether a card is consumed or remains is part of the interaction result.
- Implement `Anchored` as an attribute-driven home-zone rule, not as a special Nadir card type. It prevents the card from coming to rest outside its home zone while preserving cross-zone dragging and legal card-on-card interaction.
- Do not add extra contextual Room/Inventory transfer blockers beyond `Anchored` and Inventory capacity.
- Keep state transition/game-rule functions separate from React rendering where practical.
- Keep the text-data parser/loader separate from rendering and validate malformed authored data with useful errors rather than silently accepting ambiguity.
- Avoid a heavy state-management library for this prototype unless there is a demonstrated need.
- Add lightweight automated tests for the pure game-rule logic, especially ingestion-Marker matching, rejection of a non-ingestible card by Body, food consumption, Value clamping, invalid interactions, Inventory-capacity rejection, and anchored-card return-to-home behavior after a foreign-zone release.
- Add lightweight tests that prove the prototype card masters and starting level state are actually loaded from text data.

### Done means

A developer can clone the repo, install dependencies, start the app, and immediately test the full interaction loop above in a browser. `README.md` and `AGENTS.md` contain the exact commands needed. The seed cards and starting level shown by the prototype originate from the authored text data, so changing those data files changes the loaded prototype content without rewriting React components.

## Not yet

Do not implement these during Milestone 1:

- **Action** windows that advance game time to completion,
- the `Skinning` Action, `Cutting Tool`, tool Durability behavior, or other Action-specific completion transformations,
- unattended **Process** progression while Nadir performs Actions or other time-consuming activities,
- Process completion transformations,
- `Spoilage`, `Dead Rat` → `Rotten Meat`, rotten-food penalties, or other timed food decay,
- ongoing Hydration/Satiation loss Processes or Burn Wound effects on Hydration,
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
