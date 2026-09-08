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

1. **CARD-04 [P1]** - What belongs to a reusable card definition versus an individual card instance?
2. **CARD-05 [P1]** - Is anything besides title, picture, and attributes shown on a card?
3. **INTERACT-01 [P1]** - Is card-on-card interaction the general action language beyond eating?
4. **NADIR-01 [P1]** - How many attributes can Nadir expose legibly?
5. **PREVIEW-02 [P1]** - Should indirect deterministic consequences such as noise appear in previews?

---

# Core card model

## CARD-D01 - All interactable entities are cards
**Status:** DECIDED BY SIMON

Every interactable entity is represented as a card. Confirmed examples: materials, machines, food, Nadir, and passages to other rooms.

## CARD-D02 - Universal card presentation
**Status:** DECIDED BY SIMON

Every card has a name/title, a picture, and zero or more optional attributes. Nothing else is universally required.

## CARD-D03 - Attributes define card function
**Status:** DECIDED BY SIMON

Cards have no separate categories, tags, capability lists, or card classes in the design model. A card is functionally defined by its attributes. Add another classification mechanism only if a concrete need later proves attributes insufficient.

ChatGPT previously suggested composable capabilities/tags; Simon rejected that extra layer for now.

## ATTR-D01 - Attribute representation and names
**Status:** DECIDED BY SIMON

All attributes are visible on the card and represented by icons. There are no hidden/internal card attributes in the current model.

There are two official forms:

- **Marker** - icon only; presence carries the meaning (`Player`, `Anchored`, `Powered`).
- **Value** - icon plus integer (`Health 100`, `Progress 42`).

## ATTR-D02 - Anchored attribute
**Status:** DECIDED BY SIMON

`Anchored` is a Marker. It prevents dragging the card between Room and Inventory, but does not prevent repositioning within the current zone or dragging the card onto another card.

Nadir is anchored because he has this attribute, not because he belongs to a special card type.

## CARD-D04 - Identical objects remain distinct card instances
**Status:** DECIDED BY SIMON

Two identical objects are still two separate cards.

A `Stack` does not merge those cards into a single game object. It is a compressed presentation of multiple distinct card instances.

## CARD-04 - Reusable definition versus instance state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

The instance question is partly resolved: identical objects remain distinct card instances even while visually represented as a Stack.

Still decide what belongs to a reusable card definition versus an individual instance, and how a card changing into something materially different should be represented.

**Suggested by ChatGPT:** shared name/picture/base data in a reusable definition; changing state on the instance.

## CARD-05 - Additional card-face information
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Title, picture, and all attributes are visible. Decide whether anything else is ever shown permanently, on hover/selection, or only during interactions.

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

The three official names are:

- **Stack**
- **Process**
- **Connection**

Do not use the older terms `compact stack`, `passive stack`, `process stack`, `active stack`, `linked stack`, or `permanent active stack` as the primary design terminology.

### Stack

A `Stack` is only a visual convenience for identical cards.

- Individual cards do not all need to remain exposed.
- The Stack shows a count.
- It has no mechanical effect merely because it exists.
- The cards represented by the Stack remain separate card instances.

### Process

A `Process` is a finite mechanically meaningful combination of cards.

- Creating the Process starts it immediately.
- Every participating card remains individually identifiable and every card name stays visible.
- The top card gets a `Progress` Value from 0 to 100.
- At `Progress 100`, the Process is complete.
- The Process may change attributes on participating cards.

### Connection

A `Connection` is a persistent mechanically meaningful relationship between cards.

- Creating the Connection starts its effect immediately.
- Every participating card remains individually identifiable and every card name stays visible.
- It does not complete by itself.
- It lasts until the player breaks the Connection by separating cards.
- Effects that depend on the Connection disappear when it is broken.

Example: connecting a machine to a power outlet gives the machine the `Powered` Marker. Disconnecting it removes `Powered`. One outlet can power only one card at a time.

## STACK-D02 - Process progress is process-specific
**Status:** DECIDED BY SIMON

There is no universal progress rate. Each Process defines its own calculation for how `Progress` changes. The calculation can combine relevant game state and elapsed game time.

Examples:

- rat meat on a lit camp fire progresses with time while the fire is lit,
- a bowl on a condenser progresses from room moisture, room temperature, and time.

Progress can therefore speed up, slow down, or stop as conditions change.

## STACK-D03 - Dragging from a Stack peels off one card
**Status:** DECIDED BY SIMON

When the player drags a Stack, the top card separates from it as an individual card.

- A Stack of 3 becomes one dragged card plus a Stack of 2.
- A Stack of 2 becomes one dragged card plus one ordinary card.
- A count of 1 is never presented as a Stack.

The Stack count is presentation for the number of represented card instances; it is not currently defined as a normal card `Value` attribute.

## STACK-02 - Process completion result
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

When a Process reaches `Progress 100`, how is its particular result specified: attribute changes, consumed cards, transformed cards, separation, created cards, or some combination?

This may be process-specific rather than one universal rule.

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

## INTERACT-01 - General card-on-card action language
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Should card-on-card dragging also be the standard interaction for medicine, tools, machines, giving, equipping, repairing, etc.?

**Suggested by ChatGPT:** use it as the common action language where the meaning is clear.

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

## TARGET-D01 - Legal targets highlight
**Status:** DECIDED BY SIMON

While dragging, every currently legal target card/destination highlights.

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

Nadir is an Inventory card with `Anchored`. He cannot transfer to Room, but can be repositioned or dragged onto another card.

## NADIR-D02 - Character state uses card attributes
**Status:** DECIDED BY SIMON

Relevant character state lives on Nadir as attributes rather than in a separate character-stat UI. Hunger is confirmed. Health is currently a prototype/example attribute, not yet confirmed as permanent.

## NADIR-01 - Attribute count/readability
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

How many visible attributes can Nadir expose while remaining readable?

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
- **IMPL-05:** distinguish card instances from reusable definitions; the distinct-instance part is now decided, while the definition/instance data split remains open under CARD-04.

---

# Maintenance rule

When Simon answers an open decision:

1. mark it **DECIDED BY SIMON**,
2. record the decision plainly,
3. remove it from the current queue,
4. promote the next relevant question by priority,
5. keep ChatGPT suggestions separate,
6. never rewrite a ChatGPT recommendation as if Simon proposed it.
