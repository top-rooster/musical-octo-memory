# Safe Room - design decision backlog

This file exists to keep design questions under control. It is not an implementation plan.

Most importantly: **a suggestion is not a decision.**

## Status

- **DECIDED BY SIMON** - Simon explicitly chose this. Treat it as design until he changes it.
- **OPEN - SIMON TO DECIDE** - a real design question still needs an answer.
- **SUGGESTED BY CHATGPT** - an option or recommendation only.
- **DEFERRED** - intentionally not worth deciding yet.

## Priority

- **P0 - Now** - answer before or during the immediate prototype work.
- **P1 - Soon** - important to the core model.
- **P2 - Later** - answer before implementing the associated system.
- **P3 - Parked** - preserve it, but do not spend attention on it now.

## Conversation rule

Normally discuss only the single highest-priority open decision. Do not dump the backlog into the conversation unless Simon asks for it.

---

# Current decision queue

1. **CARD-03 [P0]** - Do cards use categories, composable capabilities/tags, or both?
2. **CARD-04 [P1]** - How does a specific card instance differ from its reusable definition?
3. **CARD-05 [P1]** - What belongs permanently on a card face versus contextual reveal?
4. **INTERACT-01 [P1]** - Is card-on-card interaction the general action language beyond eating?
5. **NADIR-01 [P1]** - How many attributes can Nadir expose legibly?
6. **PREVIEW-02 [P1]** - Should indirect deterministic consequences such as noise appear in previews?

Everything else is preserved below and should not compete for attention yet.

---

# Decisions by Simon

## Core interaction

### CORE-D01 - Movable cards can move between Room and Inventory
**Status:** DECIDED BY SIMON

Movable cards can be dragged between Room and Inventory when legal.

### CORE-D02 - Nadir is an anchored Inventory card
**Status:** DECIDED BY SIMON

Nadir is persistent in Inventory and is not moved like an ordinary item.

### CORE-D03 - Character stats live on Nadir's card
**Status:** DECIDED BY SIMON

Relevant character state should be expressed as card attributes rather than through a separate character-stat UI.

### CORE-D04 - Food is used by dragging it onto Nadir
**Status:** DECIDED BY SIMON

Eating is initiated by Food -> Nadir.

### CORE-D05 - Valid targets highlight during dragging
**Status:** DECIDED BY SIMON

When a card is dragged, every currently legal card or destination that can accept it should highlight.

### CORE-D06 - Direct stat consequences preview before dropping
**Status:** DECIDED BY SIMON

The affected visible stat shows its prospective result before commitment, for example `Hunger 67 -> 98`.

### CORE-D07 - Complexity should come from a small number of legible systems
**Status:** DECIDED BY SIMON

Cards and numerical attributes should carry substantial complexity without flooding the player with overlapping systems and unreadable state.

### CARD-D01 - All interactable entities are cards
**Status:** DECIDED BY SIMON

Every entity the player directly interacts with is represented as a card.

Confirmed examples include:

- materials,
- machines,
- food,
- Nadir,
- passages to other rooms.

This means card representation is broader than inventory items. It also means navigation can be represented through cards for passages.

This decision does **not yet** decide whether non-interactable state or temporary conditions may also use card visuals.

### CARD-D02 - Every card has a title and picture; attributes are optional
**Status:** DECIDED BY SIMON

Every card must display:

- a name/title,
- a picture.

A card may additionally display any number of attributes, including none.

No other universal card information has been decided. In particular, descriptions, categories, locations, capabilities, interaction rules, identifiers, and other state are not automatically required merely because a thing is a card.

## Threat and pacing

### THREAT-D01 - No mandatory constant real-time pressure
**Status:** DECIDED BY SIMON

Risk should often come from player-chosen actions and exposure rather than a constant artificial timer.

### THREAT-D02 - Noise can make productive actions dangerous
**Status:** DECIDED BY SIMON

Machinery and other activity can create noise and danger. The player should be informed before deliberately choosing a meaningfully noisy action.

### THREAT-D03 - Search pressure requires a credible reason
**Status:** DECIDED BY SIMON

The game should not generate attacks merely to tax progress. A genuinely silent period can occur.

### THREAT-D04 - Nadir does not perform direct violence
**Status:** DECIDED BY SIMON

Violent defense, if present, is indirect or automated rather than carried out directly by Nadir.

## Narrative

### NARR-D01 - Nadir is fundamentally a decent man
**Status:** DECIDED BY SIMON

He did not want to become ruthless or cruel; the military culture damaged him.

### NARR-D02 - Nadir lies to himself as a survival mechanism
**Status:** DECIDED BY SIMON

His self-deception grows from things he has done, enabled, caused, or survived that he cannot comfortably live with. It should not make him appear stupid.

### NARR-D03 - Nadir and Elina are a genuine love story
**Status:** DECIDED BY SIMON

The relationship is complicated by concealment, fear, and Nadir's past, not by a reveal that he was simply using her.

### NARR-D04 - Nadir's notes may reflect moral discomfort
**Status:** DECIDED BY SIMON

His notes can reflect troubling player actions from Nadir's perspective rather than functioning as an authorial morality score.

---

# Card

## CARD-01 - What kinds of things should be cards?
**Status:** DECIDED BY SIMON

All interactable entities are cards. Confirmed examples: materials, machines, food, Nadir, and passages to other rooms.

## CARD-02 - What must every card contain or display?
**Status:** DECIDED BY SIMON

Every card must have:

- a name/title,
- a picture.

Every card may optionally have zero or more attributes.

Nothing else is currently required on every card.

## CARD-03 - Categories, capabilities/tags, or both?
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P0

Options:

- mutually exclusive categories,
- composable tags/capabilities,
- both,
- another model.

**Suggested by ChatGPT:** prefer composable capabilities for behavior, possibly with broad categories for organization/presentation. This avoids rigid hierarchies such as FoodCard, ToolCard, CharacterCard, MachineCard when behaviors overlap.

## CARD-04 - Card instance versus reusable definition
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Questions:

- Do identical objects always have distinct instances?
- What state belongs to the reusable definition versus the instance?
- Can a card transform by changing definition, or is it replaced?

**Suggested by ChatGPT:** shared data such as name/art/base effects can live in a definition; changing state such as location or condition can live on an instance.

## CARD-05 - Information hierarchy on the card face
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Simon has decided that the title and picture are always present and attributes are optional.

Still open:

- What, if anything, besides title/picture/attributes is permanently visible?
- What appears on hover or selection?
- What appears only during drag/action preview?
- How visually different may card kinds become while retaining one common grammar?

**Suggested by ChatGPT:** prioritize identity, immediately important state, interaction-relevant information, then secondary detail contextually.

## CARD-06 - Card size
**Status:** DEFERRED
**Priority:** P2

Fixed size, content-driven size, or a small set of standard sizes?

**Suggested by ChatGPT:** test this visually before deciding.

## CARD-07 - Cards containing or attaching other cards
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can equipment, injuries, fuel, container contents, or similar entities appear attached to or contained by another card?

## CARD-08 - Stacks and quantities
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How are multiple identical objects represented without flooding the play area? Is quantity an attribute, stack state, or another representation?

## CARD-09 - Durability and object-specific state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Should durability and similar values use visible attributes, specialized state, conditions, or another representation?

## CARD-10 - Non-interactable state and temporary conditions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

All interactable entities are cards. It remains undecided whether non-interactable state or temporary conditions can also be represented as cards.

---

# Moving cards between Room and Inventory

## MOVE-01 - Basic movement
**Status:** DECIDED BY SIMON

Movable cards can be dragged from Room to Inventory and back when legal. Anchored cards do not move this way.

**Suggested by ChatGPT:** invalid drops leave state unchanged; legality should come from game rules rather than accidental UI behavior.

## MOVE-02 - Inventory capacity
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Does Inventory have a capacity limit? If so: slots, weight, bulk, containers, or something else?

## MOVE-03 - Cost of taking or dropping
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Is moving a card between Room and Inventory mechanically free, or can it consume time/create consequences?

## MOVE-04 - Exact placement inside a room
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Does exact placement matter mechanically, or is a Room primarily a zone containing cards?

## MOVE-05 - Cards that cannot be carried
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can an entity be a card while fixed, too large, or otherwise impossible to move into Inventory?

**Suggested by ChatGPT:** yes; being a card should not imply being carryable.

---

# Card-on-card interactions

## INTERACT-01 - Card-on-card interaction as the common action language
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Food -> Nadir is already decided. The broader use of card-on-card drops for medicine, tools, machines, giving, equipping, repairing, and similar actions is not yet decided.

**Suggested by ChatGPT:** use card-on-card interaction as the common action language where the action is clear enough, instead of a separate menu/button system for each verb.

## INTERACT-02 - Multiple plausible actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

If a source and target support more than one action, how does the player choose?

## INTERACT-03 - Confirmation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should some card-on-card actions require confirmation, or should valid drops normally commit immediately?

## INTERACT-04 - Actions with time/noise consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Can a drop initiate an action that takes time or creates noise rather than resolving instantly?

## INTERACT-05 - Consumables versus reusable tools
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How does the interaction model distinguish things consumed by use from reusable things?

## INTERACT-06 - Where interaction rules live
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Dragged card, target card, separate pair rule, capabilities/tags, or another model?

**Suggested by ChatGPT:** keep legality/effect rules outside presentation code and data-driven where that remains readable.

---

# Valid-target highlighting

## TARGET-D01 - Legal targets highlight during dragging
**Status:** DECIDED BY SIMON

All currently legal target cards/destinations highlight.

## TARGET-01 - Different highlights by action type
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should move, consume, repair, equip, give, etc. have distinct highlights or one validity language?

## TARGET-02 - Dangerous but legal actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Should a dangerous legal action use the same validity highlight, with danger communicated separately?

**Suggested by ChatGPT:** validity and desirability are different; highlighting should primarily communicate legality.

## TARGET-03 - Currently inaccessible interactions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Remain hidden or sometimes appear disabled as teaching information?

## TARGET-04 - Highlight visual intensity
**Status:** DEFERRED
**Priority:** P3

Test in the prototype.

**Suggested by ChatGPT:** highlighting and committed drops should use the same legality rules.

---

# Action previews

## PREVIEW-D01 - Direct visible stat changes preview before commitment
**Status:** DECIDED BY SIMON

Example: `Hunger 67 -> 98` on Nadir while food is over him.

## PREVIEW-01 - Multiple affected attributes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much is shown when an interaction affects several visible attributes?

## PREVIEW-02 - Indirect deterministic consequences such as noise
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

Should deterministic indirect effects, such as noise, be part of the same preview system?

## PREVIEW-03 - Uncertain outcomes
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Range, probability, qualitative warning, or no numerical preview?

## PREVIEW-04 - Long-term deterministic consequences
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Preview only immediate consequences or also known longer-term ones?

**Suggested by ChatGPT:** show resulting values when those are what matters; preview must not mutate state and should use the same calculation as commit.

---

# Nadir and survival

## NADIR-D01 - Nadir is an anchored Inventory card
**Status:** DECIDED BY SIMON

## NADIR-D02 - Character stats are attributes on Nadir's card
**Status:** DECIDED BY SIMON

Hunger is a confirmed example. Health was introduced by ChatGPT for the prototype and is not automatically a permanent final attribute.

## NADIR-01 - Attribute count/readability
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P1

How many attributes can Nadir expose while remaining readable? Prototype observation should inform this.

## NADIR-02 - Injury representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Attributes, conditions, attached cards, or a combination?

## NADIR-03 - Equipment representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Slots/attributes, attached cards, ordinary Inventory cards, or something else?

## NADIR-04 - Mental/narrative state representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Numerical, qualitative, indirect through writing/behavior, or not shown?

---

# Survival attributes and information density

## SURV-D01 - Avoid complexity that only makes the game harder to read
**Status:** DECIDED BY SIMON

Aim for high decision complexity with as few exposed systems and attributes as practical.

## SURV-01 - Which permanent survival pressures exist?
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Candidates raised: Hunger, Health, thirst, fatigue, temperature, illness, stress, injury, morale. Appearance here is not approval.

**Suggested by ChatGPT test:** a permanent attribute should create a distinct decision, be player-influenceable, and add a meaningful trade-off not already represented elsewhere.

## SURV-02 - Permanent attribute versus condition/card
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Which pressures deserve permanent numbers and which should only appear as temporary state/conditions/cards?

## SURV-03 - Hidden survival state
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

When, if ever, is hidden state desirable?

**Suggested by ChatGPT:** do not add a hidden stomach/fullness system to the first food prototype. This is not a Simon decision.

## SURV-04 - Attribute scales
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Common scale such as 0-100, or scales that follow each attribute's semantics?

## SURV-05 - Attribute change over time/actions
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How do pressures change without creating arbitrary constant real-time pressure?

---

# Noise

## NOISE-D01 - Noise links useful activity with exposure
**Status:** DECIDED BY SIMON

## NOISE-D02 - Quiet play can genuinely remain quiet
**Status:** DECIDED BY SIMON

Noise/threat is not secretly a mandatory attack meter.

## NOISE-01 - Mechanical representation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Numerical value, discrete event, spatial signal, or combination?

## NOISE-02 - Accumulation, decay, propagation
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Does noise accumulate, decay, propagate through rooms/space, or simply create detectable events?

## NOISE-03 - Risk information visible to player
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How much detectability/search risk is visible?

## NOISE-04 - Environmental masking
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Weather/external conditions have been considered as safer windows for noisy actions; exact rules remain open.

## NOISE-05 - Persistent enemy learning
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Can repeated noise teach searchers where to investigate?

## NOISE-06 - Avoiding a disguised danger meter
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Mechanics must preserve the decision that search pressure requires credible threat rather than inevitable meter filling.

---

# Search teams and sweeps

## SEARCH-D01 - Human search teams are a core external threat
**Status:** DECIDED BY SIMON

## SEARCH-D02 - Nadir does not answer searches with direct violence
**Status:** DECIDED BY SIMON

## SEARCH-01 - Persistent guards versus higher-level sweep model
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Persistent individual schedules, higher-level sweeps, or hybrid? Simon has previously favored daily schedules for inhabitants, but the search-team model is not fixed.

## SEARCH-02 - Learnability of schedules
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

How predictable/learnable are guard/search routines?

## SEARCH-03 - Enemy knowledge about Nadir
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P2

Are they looking for Nadir specifically, a code-named suspect, one unknown person, or potentially multiple people? A code-name idea exists but exact knowledge is undecided.

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

**Suggested by ChatGPT:** sweeps should have a world-state/authored reason, preparation should matter, and repeated sweeps should not become a detached grind loop.

---

# Nadir's notes and self-deception

## NOTES-D01 - Notes can reflect Nadir's moral discomfort
**Status:** DECIDED BY SIMON

## NOTES-D02 - Self-deception should not make Nadir look stupid
**Status:** DECIDED BY SIMON

## NOTES-D03 - The Elina relationship remains genuine
**Status:** DECIDED BY SIMON

## NOTES-01 - When notes are created
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Automatically after events, manually during rest, authored triggers, or combination?

## NOTES-02 - Choices and what Nadir admits
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Can choices affect how directly he confronts fixed events from his past?

## NOTES-03 - Frequency of moral reflection
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

How often can it appear without becoming commentary on every action?

## NOTES-04 - Objective account versus Nadir's account
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

Does the player ever receive an objective account that confirms distortions?

## NOTES-05 - Fixed backstory versus interpretation/discovery order
**Status:** OPEN - SIMON TO DECIDE
**Priority:** P3

How much of Nadir's past is objectively fixed versus left to interpretation/discovery order?

**Suggested by ChatGPT:** convey self-deception through omission, euphemism, contradiction, rationalization, and later reinterpretation rather than explicitly announcing guilt/unreliability.

---

# Suggested implementation principles

These are ChatGPT suggestions, not Simon's design decisions.

## IMPL-01 - Rules outside presentation code
**Status:** SUGGESTED BY CHATGPT

Keep interaction legality/state transitions out of one-off React UI behavior.

## IMPL-02 - Data-driven card/content definitions
**Status:** SUGGESTED BY CHATGPT

Use concise data for ordinary card definitions/effects where it reduces boilerplate.

## IMPL-03 - Highlight and commit use the same legality rules
**Status:** SUGGESTED BY CHATGPT

## IMPL-04 - Preview and commit use the same effect calculation
**Status:** SUGGESTED BY CHATGPT

## IMPL-05 - Card identity separate from reusable definition
**Status:** SUGGESTED BY CHATGPT

This overlaps CARD-04 and is not approved until Simon decides it.

---

# Maintenance rule

When Simon answers an open decision:

1. mark it **DECIDED BY SIMON**,
2. record his decision in plain language,
3. remove it from the current queue,
4. promote the next relevant question by priority,
5. keep ChatGPT suggestions clearly separate,
6. never rewrite a ChatGPT recommendation as if Simon proposed it.