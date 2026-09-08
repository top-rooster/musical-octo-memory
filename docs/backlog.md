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

1. **NADIR-01 [P1]** - How should Nadir's state be divided across multiple cards?
2. **PREVIEW-02 [P1]** - Should indirect deterministic consequences such as noise appear in previews?

---

# Core card model

## CARD-D01 - All interactable entities are cards
**Status:** DECIDED BY SIMON

Every interactable entity is represented as a card. Confirmed examples: materials, machines, food, Nadir, and passages to other rooms.

## CARD-D02 - Universal card presentation
**Status:** DECIDED BY SIMON

Every card has a name/title, a picture, and zero or more optional attributes.

## CARD-D03 - Attributes define card function
**Status:** DECIDED BY SIMON

Cards have no separate categories, tags, capability lists, or card classes in the design model. A card is functionally defined by its attributes. Add another classification mechanism only if a concrete need later proves attributes insufficient.

ChatGPT previously suggested composable capabilities/tags; Simon rejected that extra layer for now.

## ATTR-D01 - Attribute representation and names
**Status:** DECIDED BY SIMON

All attributes are visible on the card and represented by icons. There are no hidden/internal card attributes in the current model.

- **Marker** - icon only; presence carries the meaning (`Player`, `Anchored`, `Powered`).
- **Value** - icon plus integer (`Health 100`, `Progress 42`).

## ATTR-D02 - Anchored attribute
**Status:** DECIDED BY SIMON

`Anchored` is a Marker. It prevents dragging the card between Room and Inventory, but does not prevent repositioning within the current zone or dragging the card onto another card.

Nadir is anchored because he has this attribute, not because he belongs to a special card type.

## CARD-D04 - Master definition and card instances
**Status:** DECIDED BY SIMON

Each reusable card type has one **master definition** containing name/title, picture, and starting attributes.

Cards created from the master are separate **card instances**. Each instance receives the starting attributes and maintains its own current attributes independently thereafter.

Two identical objects are therefore still two separate cards. A `Stack` only compresses their presentation; it does not merge the instances.

## CARD-D05 - First-release card face
**Status:** DECIDED BY SIMON

For the first release, a normal card shows only title/name, picture, and visible attributes.

Do not add description text or other permanent card-face information for the first release. Simon expects a description may become useful later, but it is deferred.

## CARD-06 - Card size
**Status:** DEFERRED
**Priority:** P2

Fixed size, content-driven size, or a small standard set. Test visually first.

## CARD-07 - Cards containing/attaching cards
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can equipment, injuries, fuel, container contents, etc. be attached to or contained by another card outside the normal Stack/Process/Connection model?

## CARD-09 - Durability and object-specific state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Should values such as durability use ordinary attributes or another representation?

## CARD-10 - Non-interactable state and temporary conditions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

All interactable entities are cards. It remains undecided whether non-interactable state or temporary conditions may also be cards.

## CARD-11 - Instance changing identity
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

If an instance becomes materially different, does it switch master definition, get replaced by another card instance, or use another rule? Also decide whether an instance can ever override its master's name/picture.

## CARD-12 - Card descriptions
**Status:** DEFERRED
**Priority:** P2

A description is not part of the first release. Revisit later if cards need explanatory or narrative text beyond title, picture, and visible attributes.

---

# Positioning, movement, and card stacking

## MOVE-D01 - Room/Inventory transfer
**Status:** DECIDED BY SIMON

Cards can normally be dragged between Room and Inventory when legal. `Anchored` prevents that transfer while preserving other dragging.

## MOVE-D02 - Free positioning within a zone
**Status:** DECIDED BY SIMON

Every card can be positioned within its current zone to the player's liking, including anchored cards.

## MOVE-D03 - No accidental overlap
**Status:** DECIDED BY SIMON

Cards may not overlap in ordinary placement. Deliberately combined cards snap into a neat aligned presentation.

## STACK-D01 - Three stacking forms: Stack, Process, Connection
**Status:** DECIDED BY SIMON

The three official names are **Stack**, **Process**, and **Connection**. Do not use the older compact/passive/active/linked/permanent-stack terminology as the primary design language.

### Stack

A `Stack` is only a visual convenience for identical cards.

- represented cards remain separate card instances,
- individual cards do not all need to remain exposed,
- the Stack shows a count,
- it has no mechanical effect merely because it exists.

### Process

A `Process` is a finite mechanically meaningful combination of cards.

- creating it starts it immediately,
- every participating card remains individually identifiable and every card name stays visible,
- the top card gets a `Progress` Value from 0 to 100,
- at `Progress 100`, the Process is complete,
- it may change attributes on participating cards.

### Connection

A `Connection` is a persistent mechanically meaningful relationship between cards.

- creating it starts its effect immediately,
- every participating card remains individually identifiable and every card name stays visible,
- it lasts until the player breaks it by separating cards,
- effects that depend on it disappear when broken.

Example: connecting a machine to a power outlet gives the machine `Powered`. Disconnecting removes `Powered`. One outlet can power only one card at a time.

## STACK-D02 - Process progress is process-specific
**Status:** DECIDED BY SIMON

There is no universal progress rate. Each Process defines its own calculation from relevant game state and elapsed game time.

Examples:

- rat meat on a lit camp fire progresses with time while the fire is lit,
- a bowl on a condenser progresses from room moisture, room temperature, and time.

Progress can speed up, slow down, or stop as conditions change.

## STACK-D03 - Dragging from a Stack peels off one card
**Status:** DECIDED BY SIMON

Dragging a Stack separates its top card as an individual card.

- Stack 3 -> one dragged card + Stack 2.
- Stack 2 -> one dragged card + one ordinary card.
- Count 1 is never presented as a Stack.

The Stack count is presentation, not currently a normal card `Value`.

## STACK-D04 - Stack members must have identical current attributes
**Status:** DECIDED BY SIMON

Cards can share a `Stack` only when they come from the same master definition and have identical current attributes.

Their Marker sets, Value attributes, and Value values must all match. If one instance differs, it cannot share that Stack.

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

`Anchored` handles fixed-zone cards. Decide later whether capacity or contextual rules can also prevent transfer.

---

# Card-on-card interaction

## CORE-D04 - Eating
**Status:** DECIDED BY SIMON

Food is eaten by dragging the food card onto Nadir.

## INTERACT-D01 - All interactions are card-on-card
**Status:** DECIDED BY SIMON

Every gameplay interaction is initiated by putting one card on top of another card.

An interaction therefore always has:

- a source card being dragged,
- a target card receiving it.

This is the universal interaction language, not just the rule for eating. It applies to interactions such as using medicine, operating or supplying machines, creating Processes, creating Connections, and other card effects.

Moving/repositioning a card within a zone or transferring it between Room and Inventory is movement rather than an interaction. A bare zone/location may receive a card for movement, but is not itself an interaction target.

An interaction does not necessarily create a Stack, Process, or Connection; it may resolve immediately, as eating does.

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

# Target highlighting and previews

## TARGET-D01 - Legal interaction targets highlight
**Status:** DECIDED BY SIMON

While dragging a card, every card that can legally receive it as an interaction target highlights. Legal zone destinations for movement may also use a placement affordance, but they are not card interaction targets.

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

## PREVIEW-D01 - Direct stat preview
**Status:** DECIDED BY SIMON

Direct visible stat consequences preview before the drop, e.g. `Hunger 67 -> 98` on Nadir.

## PREVIEW-01 - Multiple affected attributes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much should be shown when several attributes change?

## PREVIEW-02 - Indirect deterministic consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Should known indirect effects such as noise be part of the same preview system?

## PREVIEW-03 - Uncertain outcomes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Range, probability, qualitative warning, or no numerical preview?

## PREVIEW-04 - Long-term deterministic consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Preview only immediate effects or also known longer-term effects?

---

# Nadir and survival

## NADIR-D01 - Nadir is anchored in Inventory
**Status:** DECIDED BY SIMON

Nadir's representation includes an Inventory card with `Anchored`. That card cannot transfer to Room, but can be repositioned or dragged onto another card.

Nadir may also be represented by additional cards. Whether every card representing Nadir is anchored is not yet decided.

## NADIR-D02 - Character state uses card attributes
**Status:** DECIDED BY SIMON

Relevant character state lives as attributes on the card or cards representing Nadir rather than in a separate character-stat UI. Hunger is confirmed. Health is currently a prototype/example attribute, not yet confirmed as permanent.

## NADIR-D03 - Nadir may be represented by multiple cards
**Status:** DECIDED BY SIMON

Nadir is not required to fit on a single card. His representation may span several cards simultaneously while remaining inside the same card-based interaction system.

This allows character state to be distributed across multiple visible cards rather than requiring alternate character views merely because one card becomes too dense.

## NADIR-01 - Division of Nadir across cards
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

How should Nadir's state be divided across his cards?

Decide which distinct Nadir cards should exist, which attributes belong on each, and whether all of those cards are anchored in Inventory.

## NADIR-02 - Injury representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Attributes, attached cards, or another representation?

## NADIR-03 - Equipment representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Attributes, attached cards, ordinary Inventory cards, or something else?

## NADIR-04 - Mental/narrative state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Numerical, qualitative, indirect through writing/behavior, or not shown?

## SURV-D01 - Keep survival complexity legible
**Status:** DECIDED BY SIMON

Aim for high decision complexity with as few exposed systems/attributes as practical.

## SURV-01 - Permanent survival pressures
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Candidates raised: Hunger, Health, thirst, fatigue, temperature, illness, stress, injury, morale. Listing is not approval.

## SURV-02 - Attribute versus other representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Which pressures deserve permanent Value attributes and which should use another representation?

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

How much detectability/search risk is visible?

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
- **IMPL-04:** preview and commit should use the same deterministic effect calculation.

---

# Maintenance rule

When Simon answers an open decision:

1. mark it **DECIDED BY SIMON**,
2. record the decision plainly,
3. remove it from the current queue,
4. promote the next relevant question by priority,
5. keep ChatGPT suggestions separate,
6. never rewrite a ChatGPT recommendation as if Simon proposed it.
