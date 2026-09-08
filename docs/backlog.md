# Safe Room - design decision backlog

This file is a compact decision register, not an implementation plan.

Most importantly: **a suggestion is not a decision.**

## Status

- **DECIDED BY SIMON** - Simon explicitly chose this.
- **OPEN - SIMON TO DECIDE** - a real design question still needs an answer.
- **SUGGESTED BY CHATGPT** - recommendation only.
- **DEFERRED** - intentionally not worth deciding yet.

## Priority

- **P0 - Now** - foundational/current prototype.
- **P1 - Soon** - important to the core model.
- **P2 - Later** - answer before implementing that system.
- **P3 - Parked** - preserve without spending attention now.

## Conversation rule

Normally discuss only the single highest-priority open decision.

---

# Current decision queue

1. **ZONE-01 [P2]** - What may persist in the Nadir zone, and can Nadir cards leave it?
2. **STACK-02 [P2]** - What happens when a Process completes?
3. **INTERACT-02 [P2]** - What if one source/target pair supports several actions?
4. **NADIR-06 [P2]** - How do temporary condition cards change and disappear?

---

# Core card model

## CARD-D01 - All interactable entities are cards
**Status:** DECIDED BY SIMON

Every interactable entity is a card. Confirmed examples: materials, machines, food, Nadir, and passages to other rooms.

## CARD-D02 - Universal card presentation
**Status:** DECIDED BY SIMON

Every card has a title/name, a picture, and zero or more optional attributes.

## CARD-D03 - Attributes define card function
**Status:** DECIDED BY SIMON

Cards have no separate categories, tags, capability lists, or card classes. A card is functionally defined only by its attributes unless a concrete future need proves that insufficient.

## ATTR-D01 - Attribute representation and names
**Status:** DECIDED BY SIMON

All card attributes are visible and represented by icons. There are no hidden/internal card attributes in the current model.

- **Marker** - icon only; presence carries the meaning (`Player`, `Anchored`, `Powered`).
- **Value** - icon plus integer (`Health 100`, `Progress 42`).

## ATTR-D02 - Anchored
**Status:** DECIDED BY SIMON

`Anchored` is a Marker. It blocks transfer between Room and Inventory, but does not block repositioning within the current zone or dragging the card onto another card.

The Nadir zone does not yet redefine `Anchored`; transfer restrictions involving that zone remain open if needed.

## CARD-D04 - Master definition and card instances
**Status:** DECIDED BY SIMON

Each reusable card type has one **master definition** containing name/title, picture, and starting attributes.

Each spawned card is a separate **card instance**. It receives the starting attributes and thereafter maintains its own current attributes independently.

## CARD-D05 - First-release card face
**Status:** DECIDED BY SIMON

For the first release, a normal card shows only title/name, picture, and visible attributes. Description text is deferred.

## CARD-06 - Card size
**Status:** DEFERRED
**Priority:** P2

Fixed size, content-driven size, or a small standard set. Test visually first.

## CARD-07 - Contained/attached cards outside Stack/Process/Connection
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can equipment, fuel, contents, etc. be attached to or contained by another card outside the normal Stack/Process/Connection model?

## CARD-09 - Durability and object-specific state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Should values such as durability use ordinary attributes or another representation?

## CARD-10 - Other non-interactable state and temporary conditions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Temporary conditions applying to Nadir are confirmed as cards in the Nadir zone. It remains undecided whether other non-interactable state or temporary conditions elsewhere also use cards.

## CARD-11 - Instance changing identity
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

If an instance becomes materially different, does it switch master definition, get replaced by another card instance, or use another rule? Can an instance ever override its master's name/picture?

## CARD-12 - Card descriptions
**Status:** DEFERRED
**Priority:** P2

Descriptions are not part of the first release. Revisit later if cards need explanatory or narrative text beyond title, picture, and visible attributes.

---

# Zones, positioning, movement, and card stacking

## ZONE-D01 - Three top-level zones
**Status:** DECIDED BY SIMON

The play space has three zones:

- **Room** - the currently viewed physical space.
- **Inventory** - persistent carried possessions.
- **Nadir** - Nadir's persistent representation cards plus temporary condition cards that currently apply to him.

The Nadir zone supersedes the earlier assumption that Nadir's cards live in Inventory.

## ZONE-01 - Nadir zone transfer rules
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Besides Nadir's persistent cards and temporary condition cards, can other cards persist in the Nadir zone? Can persistent Nadir cards ever leave it?

## MOVE-D01 - Room/Inventory transfer
**Status:** DECIDED BY SIMON

Cards can normally be dragged between Room and Inventory when legal. `Anchored` prevents that transfer while preserving other dragging.

## MOVE-D02 - Free positioning within a zone
**Status:** DECIDED BY SIMON

Every card can be positioned within its current zone to the player's liking, including anchored cards.

## MOVE-D03 - No accidental overlap
**Status:** DECIDED BY SIMON

Cards may not overlap in ordinary placement. Deliberately combined cards snap into a neat aligned presentation.

## STACK-D01 - Stack, Process, Connection
**Status:** DECIDED BY SIMON

The three official stacking forms are **Stack**, **Process**, and **Connection**.

### Stack

A `Stack` is visual compression for identical cards. Represented cards remain separate instances, individual cards need not all remain exposed, the Stack shows a count, and it has no mechanical effect merely because it exists.

### Process

A `Process` is a finite mechanically meaningful combination of cards. Creating it starts immediately. Every participating card remains identifiable and every name stays visible. The top card gets `Progress` from 0 to 100. At 100 the Process is complete.

### Connection

A `Connection` is a persistent mechanically meaningful relationship. It begins immediately, lasts until the player separates the cards, and relationship-dependent effects disappear when it is broken.

Example: a machine connected to a power outlet gains `Powered`; disconnecting removes it. One outlet can power only one card at a time.

## STACK-D02 - Process progress is process-specific
**Status:** DECIDED BY SIMON

There is no universal progress rate. Each Process defines its own calculation from relevant game state and elapsed game time.

Examples:

- rat meat on a lit camp fire progresses with time while the fire is lit,
- a bowl on a condenser progresses from room moisture, room temperature, and time.

## STACK-D03 - Dragging from a Stack peels off one card
**Status:** DECIDED BY SIMON

Dragging a Stack separates its top card as an individual card.

- Stack 3 -> dragged card + Stack 2.
- Stack 2 -> dragged card + ordinary card.
- Count 1 is never presented as a Stack.

The Stack count is presentation, not currently a normal card `Value`.

## STACK-D04 - Stack members must be identical now
**Status:** DECIDED BY SIMON

Cards can share a `Stack` only when they come from the same master definition and have identical current attributes: same Marker set, same Values, same Value numbers.

## STACK-02 - Process completion result
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

When a Process reaches `Progress 100`, how is its result specified: attribute changes, consumed cards, transformed cards, separation, created cards, or some combination? This may be process-specific.

## MOVE-02 - Inventory capacity
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Does Inventory have a capacity limit? If yes: slots, weight, bulk, containers, or something else?

## MOVE-03 - Cost of taking/dropping
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can moving a card between zones consume time or create consequences?

## MOVE-05 - Other reasons a card cannot change zones
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

`Anchored` handles fixed-zone cards between Room and Inventory. Decide later whether capacity, the Nadir zone, or contextual rules can also prevent transfer.

---

# Card-on-card interaction

## CORE-D04 - Eating
**Status:** DECIDED BY SIMON

Food is eaten by dragging the food card onto the relevant Nadir card.

## INTERACT-D01 - All interactions are card-on-card
**Status:** DECIDED BY SIMON

Every gameplay interaction is initiated by putting one card on top of another card. An interaction always has a dragged source card and a target card.

Moving a card within or between zones is movement rather than interaction. Bare zone space can receive a card for legal movement but is not an interaction target.

An interaction may resolve immediately or create/change a Stack, Process, Connection, cards, or attributes.

## INTERACT-02 - Multiple plausible actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

If one source/target pair supports several actions, how does the player choose?

## INTERACT-03 - Confirmation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should some drops require confirmation?

## INTERACT-04 - Time/noise consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can a drop initiate an action that takes time or creates noise rather than resolving instantly?

## INTERACT-05 - Consumable versus reusable
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How do attributes distinguish things consumed by use from reusable things?

## INTERACT-06 - Deriving interaction rules from attributes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How do source and target attributes determine whether an interaction is legal and what it does?

---

# Discovery, risk, target highlighting, and previews

## DISC-D01 - Discovery is part relational understanding and part exploratory play
**Status:** DECIDED BY SIMON

The game should support discovery rather than expose every causal relationship immediately.

Understanding can come from:

- **relational understanding** - visible cards, attributes, room state, and their relationships let the player infer danger/opportunity;
- **exploratory play / knowledge unlocks** - interaction, observation, reading, or other discovery can improve what Nadir and the player understand later.

The intended progression can move from unknown to suspected to understood.

## RISK-D01 - Severe danger must be reasonably foreseeable
**Status:** DECIDED BY SIMON

Exploratory play should not inflict severe punishment that the player had no reasonable way to anticipate.

Danger can be telegraphed by visible relationships or by Nadir articulating what he understands. Telegraphing danger does not require revealing an exact probability or exact outcome.

Design example: a flooded room with exposed electrical outlets is obviously dangerous from visible elements and their relationship; Nadir may explicitly articulate that danger. The example is not a universal electrical-simulation specification.

## PREVIEW-D01 - Direct known stat preview
**Status:** DECIDED BY SIMON

Direct visible stat consequences can preview before the drop, e.g. `Hunger 67 -> 98` on Body.

## PREVIEW-D02 - Previews are knowledge-dependent, not omniscient
**Status:** DECIDED BY SIMON

Previews reflect what Nadir/the player currently understands.

- Known consequences may be shown accurately, including indirect consequences when they are understood.
- Undiscovered relationships should not automatically be spoiled by hovering cards together.
- Known meaningful danger may be communicated qualitatively even when the exact result remains uncertain.
- The UI should not reveal a complete causal future and turn play into exhaustive deterministic planning.

Design example: repairing an exposed electrical outlet can carry a known risk of shock. A shock can produce a burn-wound condition; if the risk outcome does not produce a shock, the repair can instead result in a functional outlet. The player can understand that the attempt is dangerous without necessarily knowing the exact roll result in advance.

## PREVIEW-D03 - Uncertain likelihoods are calibrated but non-numeric
**Status:** DECIDED BY SIMON

When Nadir understands an uncertain risk, the UI should communicate the likelihood clearly enough for the player to distinguish materially different odds such as roughly even chances from a clearly favored outcome.

Do not normally expose the underlying percentage or numerical odds. The communication should use sufficiently precise plain-language likelihoods rather than only coarse labels such as `Low`, `Moderate`, and `High`.

The exact user-facing vocabulary is not yet fixed and can be tested in UI, but the player should be able to make a meaningfully informed risk judgment without seeing numbers.

## TARGET-D01 - Legal interaction targets highlight
**Status:** DECIDED BY SIMON

While dragging, every card that can legally receive the dragged card as an interaction target highlights. Legal movement destinations may use a placement affordance but are not interaction targets.

## PREVIEW-01 - Multiple affected attributes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much should be shown when several known attributes change?

## PREVIEW-04 - Long-term deterministic consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Preview only immediate understood effects or also known longer-term effects?

## TARGET-01 - Different highlights by action type
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

One validity language or different visuals for move/consume/repair/etc.?

## TARGET-02 - Dangerous but legal actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should dangerous legal actions use the normal legal-target highlight, with danger communicated separately?

## TARGET-03 - Inaccessible interactions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Remain hidden or sometimes appear disabled?

## TARGET-04 - Highlight intensity
**Status:** DEFERRED
**Priority:** P3

Test visually.

---

# Nadir and survival

## NADIR-D01 - Nadir cards live in the Nadir zone
**Status:** DECIDED BY SIMON

Nadir's persistent representation cards live in the dedicated **Nadir** zone rather than Inventory.

Whether those cards use `Anchored`, another transfer restriction, or no explicit restriction remains open.

## NADIR-D02 - Character state uses card attributes
**Status:** DECIDED BY SIMON

Relevant character state lives as attributes on Nadir's cards rather than in a separate character-stat UI.

## NADIR-D03 - Nadir may be represented by multiple cards
**Status:** DECIDED BY SIMON

Nadir is not required to fit on a single card. His representation may span several simultaneously visible cards in the Nadir zone.

## NADIR-D04 - Three persistent Nadir cards: Body, Mind, Spirit
**Status:** DECIDED BY SIMON

For now, Nadir has three persistent representation cards:

1. **Body** - physical state;
2. **Mind** - cognitive / will state;
3. **Spirit** - emotional / spiritual state.

More persistent Nadir cards may be added later if a concrete need appears.

## NADIR-D05 - Temporary conditions are cards in the Nadir zone
**Status:** DECIDED BY SIMON

Conditions currently applying to Nadir are represented as temporary cards in the Nadir zone rather than being forced into Body, Mind, or Spirit.

Examples explicitly given by Simon include `Exhausted` and `Flesh Wound`. A burn wound from an electrical shock is another concrete condition example; its exact final card title is not yet separately fixed.

These cards exist while the condition applies. How they are created, progress, heal, expire, or otherwise disappear is not yet decided.

## NADIR-02 - Injury representation beyond simple condition cards
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Injury-like conditions can be temporary Nadir-zone cards. Decide later whether all injuries use that model or whether some persistent/complex injuries need another representation.

## NADIR-03 - Equipment representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Attributes, Nadir-zone cards, ordinary Inventory cards, Connections, or something else?

## NADIR-04 - Mental/narrative state detail
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Beyond Mind and Spirit, how much mental/narrative state should be numerical, qualitative, or expressed through writing/behavior?

## NADIR-06 - Temporary condition lifecycle
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How are condition cards such as `Exhausted`, `Flesh Wound`, and burn-wound conditions created, changed, and removed?

## SURV-D01 - Keep survival complexity legible
**Status:** DECIDED BY SIMON

Aim for high decision complexity with as few exposed systems/attributes/cards as practical.

## SURV-01 - Permanent survival pressures
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Candidates raised: Hunger, Health, thirst, fatigue, temperature, illness, stress, injury, morale. Listing is not approval.

## SURV-02 - Attribute versus condition card
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Which pressures deserve persistent Value/Marker attributes on Body, Mind, or Spirit, and which should appear as temporary condition cards?

## SURV-03 - Hidden survival state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Current card attributes are never hidden. Decide whether simulation may nevertheless contain hidden state outside the card-attribute model.

**Suggested by ChatGPT:** no hidden stomach/fullness system in the first food prototype.

## SURV-04 - Attribute scales
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Common scale such as 0-100 or semantics-specific ranges?

## SURV-05 - Change over time/actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How do survival pressures change without creating arbitrary constant real-time pressure?

---

# Threat and noise

## THREAT-D01 - No mandatory constant real-time pressure
**Status:** DECIDED BY SIMON

Risk should often come from player-chosen actions/exposure rather than an artificial timer.

## THREAT-D02 - Noise can make productive actions dangerous
**Status:** DECIDED BY SIMON

The player should know before deliberately choosing a meaningfully noisy action.

## THREAT-D03 - Search pressure requires a credible reason
**Status:** DECIDED BY SIMON

Attacks/searches do not happen merely to tax progress. Genuinely silent periods are possible.

## THREAT-D04 - Nadir does not perform direct violence
**Status:** DECIDED BY SIMON

Violent defense, if present, is indirect/automated.

## NOISE-01 - Mechanical representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Numerical value, discrete event, spatial signal, or combination?

## NOISE-02 - Accumulation/decay/propagation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How does noise persist and travel?

## NOISE-03 - Risk information visible to player
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much detectability/search risk is visible, subject to the knowledge-dependent preview rules above?

## NOISE-04 - Environmental masking
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How can weather/external conditions create safer windows for noisy actions?

## NOISE-05 - Persistent enemy learning
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Can repeated noise teach searchers where to investigate?

## NOISE-06 - Avoid disguised danger meter
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Mechanics must preserve the credible-threat rule rather than making attacks inevitable through meter filling.

---

# Search teams and sweeps

## SEARCH-D01 - Human search teams are a core threat
**Status:** DECIDED BY SIMON

## SEARCH-D02 - Direct violence is not Nadir's answer
**Status:** DECIDED BY SIMON

## SEARCH-01 - Persistent guards versus higher-level sweeps
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Individual schedules, higher-level sweep model, or hybrid?

## SEARCH-02 - Learnability of schedules
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How predictable/learnable are search routines?

## SEARCH-03 - Enemy knowledge about Nadir
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Nadir specifically, a code-named suspect, one unknown person, or potentially several?

## SEARCH-04 - Persistent suspicion
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How does suspicion/information persist between incidents?

## SEARCH-05 - Partial discovery
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

What happens if searchers find evidence but not Nadir?

## SEARCH-06 - Failure states
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

What meaningful failures exist besides immediate capture/death?

---

# Narrative

## NARR-D01 - Nadir is fundamentally decent
**Status:** DECIDED BY SIMON

Military culture damaged him; it did not reveal that he was secretly ruthless.

## NARR-D02 - Self-deception is a survival mechanism
**Status:** DECIDED BY SIMON

It grows from things Nadir has done, enabled, caused, or survived and should not make him appear stupid.

## NARR-D03 - Nadir and Elina genuinely love each other
**Status:** DECIDED BY SIMON

The relationship is complicated by concealment, fear, and his past, not a reveal that he merely used her.

## NOTES-D01 - Notes can reflect moral discomfort
**Status:** DECIDED BY SIMON

From Nadir's perspective, not as an authorial morality meter.

## NOTES-01 - When notes are created
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Automatic after events, manually at rest, authored triggers, or combination?

## NOTES-02 - Choices and what Nadir admits
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Can choices affect how directly he confronts fixed events from his past?

## NOTES-03 - Frequency of reflection
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

How often before it feels like commentary on every action?

## NOTES-04 - Objective account versus Nadir's account
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Does the player ever get an objective account confirming distortions?

## NOTES-05 - Fixed backstory versus interpretation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

How much is objectively fixed versus left to interpretation/discovery order?

---

# Suggested implementation principles

These are ChatGPT suggestions, not Simon decisions.

- **IMPL-01:** keep interaction legality/state transitions outside one-off presentation code.
- **IMPL-02:** use concise data-driven card definitions where it reduces boilerplate.
- **IMPL-03:** highlighting and committing should use the same legality rules.
- **IMPL-04:** preview and commit should use the same deterministic effect calculation for information the preview actually reveals.
- **IMPL-05:** knowledge state should gate what the preview layer reveals without changing the underlying interaction result.

---

# Maintenance rule

When Simon answers an open decision:

1. mark it **DECIDED BY SIMON**,
2. record the decision plainly,
3. remove it from the current queue,
4. promote the next relevant question by priority,
5. keep ChatGPT suggestions separate,
6. never rewrite a ChatGPT recommendation as if Simon proposed it.
