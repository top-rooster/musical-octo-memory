# Safe Room — implementation roadmap

## Milestone 1: interaction prototype

Build a small browser prototype whose only purpose is to validate the core card interaction language.

### Required behavior

- Use React + TypeScript + Vite.
- Show two zones on one screen: **Room** and **Inventory**.
- **Room** occupies the upper two thirds of the screen and represents the currently viewed physical space.
- **Inventory** occupies the lower third of the screen. It is persistent and remains on screen when Nadir moves to another room.
- Separate Room and Inventory with a clear, suitable horizontal divider. The divider should make the zones immediately legible without becoming a dominant visual element.
- Each Room/area has its own subtle non-illustrated background used for ambience only. The Inventory uses one constant background across rooms.
- Backgrounds are not gameplay state. Any mechanically meaningful room condition or interactable/environmental state is represented by cards, not by changing or overlaying the background.
- Room zoom changes the size and positions of cards only. The Room background stays fixed to the viewport and does not pan or scale, so the player can never move or zoom past an edge of the background.
- Room zoom is centered on the center of the Room zone. There is no panning in Milestone 1.
- Inventory remains its own fixed interface area and does not participate in Room zoom.
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
- Temporary Nadir condition cards such as `Exhausted` and `Flesh Wound` are part of the design and also live in Inventory, but their lifecycle mechanics and initial spawning are not required in Milestone 1.
- Load the known card master definitions from the project's authored card text data.
- Milestone 1 does **not** require authored level-data syntax or authored starting positions. Instead, create one instance of each known **non-`Anchored`** card master in Room at startup. Body, Mind, and Spirit are the explicit starting `Anchored` Inventory cards.
- Randomize each generated Room card's starting position within the Room zone. If its candidate placement overlaps an already placed card or leaves the usable Room bounds, reroll the position until a valid non-overlapping placement is found.
- Seed the prototype with **Rat Meat** and **Canned Food** as the two food cards.
  - Eating Rat Meat applies `Satiation +15` to Body.
  - Eating Canned Food applies `Satiation +25` to Body.
- For Milestone 1, do **not** require or invent an ingestion Marker. The existing authored interaction/effect data (`eat Body`, the Satiation effect, and consumption result) is sufficient to determine whether a card can be eaten. The product-level ingestion Marker decision can be revisited after the prototype.
- Non-anchored cards can be dragged between Room and Inventory when the destination is legal.
- The only current rules that can prevent a Room/Inventory transfer are `Anchored` and the Inventory capacity limit.
- Gameplay interactions are card-on-card: dragging one card onto another card initiates the interaction.
- For Milestone 1, interaction legality should be derived from the authored interaction data rather than from a hard-coded list of Rat Meat/Canned Food IDs or from an ingestion Marker.
- While dragging a card, all legal card interaction targets highlight.
- Dragging Rat Meat or Canned Food over **Body** previews the exact resulting Satiation value before the drop.
- Dropping Rat Meat or Canned Food on **Body** applies its Satiation effect and consumes the food card.
- A card with no legal authored interaction with Body must not be accepted by Body merely because it is movable.
- Cards may not overlap in ordinary placement.
- When a card is dropped on another card with which it has a legal combination/interaction, commit that interaction according to the prototype rules.
- When a card is dropped on another card with which it **cannot** legally combine/interact, return the dragged card to the exact position it occupied when that drag began.
- An invalid drop on another card therefore never displaces either card and does not search for a nearby fallback position.
- An anchored card released outside its home zone without a legal accepting interaction returns home.
- The UI should be plain and readable. Do not spend time on final art, animation polish, sound, narrative content, persistence beyond the visible Inventory behavior, combat, crafting, or world simulation yet.

### Architecture constraints

- Follow `docs/data-language.md` for authored **card master** data.
- **All card master data is authored in text files.** Runtime code may parse, validate, and transform it, but card masters must not be duplicated as hard-coded TypeScript/React objects.
- The product direction remains that level design will eventually be authored in text files, but **Milestone 1 is explicitly exempt from implementing level-data syntax**. Its starting Room population is generated from the loaded card masters as described above.
- Preserve the terse data-language direction: low boilerplate, phone-friendly, no required braces/tabs/list lengths, and no unnecessary repeated field labels. Do not substitute JSON, YAML, TOON, or a verbose generic object format as the primary authoring source.
- Keep card definitions and effects as data rather than hard-coding each individual card in UI components.
- For the prototype eating interaction, use the existing authored interaction/effect lines to determine legality and effects. Do not add a provisional ingestion Marker solely to satisfy Milestone 1.
- Do not introduce generic `Consumable` or `Reusable` classifications for the prototype. Whether a card is consumed or remains is part of the interaction result.
- Implement `Anchored` as an attribute-driven home-zone rule, not as a special Nadir card type. It prevents the card from coming to rest outside its home zone while preserving cross-zone dragging and legal card-on-card interaction.
- Do not add extra contextual Room/Inventory transfer blockers beyond `Anchored` and Inventory capacity.
- Keep Room background rendering separate from the zoomable card layer. Do not implement browser-page zoom for gameplay zoom.
- Scale Room cards around the Room-zone center and do not implement Room panning in Milestone 1.
- Treat backgrounds as ambience/presentation only; do not encode flooding, exposed wiring, broken windows, lit campfires, condensation, machinery state, hazards, or other gameplay facts into them. Those belong to cards.
- Keep state transition/game-rule functions separate from React rendering where practical.
- Keep the text-data parser/loader separate from rendering and validate malformed authored data with useful errors rather than silently accepting ambiguity.
- Avoid a heavy state-management library for this prototype unless there is a demonstrated need.
- Implement initial randomized Room placement as a simple retry loop: choose a candidate position, reject it if the card would overlap an already placed card or exceed Room bounds, and reroll until valid. The known Milestone 1 card set is small enough that no more sophisticated packing algorithm is required.
- Record the dragged card's origin position when a drag begins so an illegal card-on-card drop can restore that exact position.
- Add lightweight automated tests for the pure game-rule logic, especially authored eating-interaction recognition, rejection of a card with no Body eating interaction, Rat Meat `+15` Satiation, Canned Food `+25` Satiation, food consumption, Value clamping, invalid card-on-card drop restoration, Inventory-capacity rejection, and anchored-card return-to-home behavior after a foreign-zone release.
- Add lightweight tests that prove card masters are loaded from text data rather than duplicated as TypeScript constants.

### Done means

A developer can clone the repo, install dependencies, start the app, and immediately test the full interaction loop above in a browser. `README.md` and `AGENTS.md` contain the exact commands needed. Card masters originate from authored text data; Milestone 1 generates its temporary starting Room population from those loaded masters rather than requiring authored level data.

## Not yet

Do not implement these during Milestone 1:

- authored level-data syntax or production room layouts,
- a permanent ingestion Marker or final ingestion interaction grammar beyond what the current prototype needs,
- **Action** windows that advance game time to completion,
- the `Skinning` Action, tool Durability behavior, or other Action-specific completion transformations,
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
- Room panning,
- save games,
- story/dialogue,
- final visual identity,
- a permanent engine decision.

Those follow only after the card interaction prototype gives us something concrete to evaluate.
