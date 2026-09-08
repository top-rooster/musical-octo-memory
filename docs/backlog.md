# Safe Room - design decision backlog

This file exists to keep design questions under control.

It is **not** an implementation plan. Codex must not implement something merely because it appears here.

Most importantly, a suggestion is not a decision.

## Status language

Every design point must be marked as one of these:

- **DECIDED BY SIMON** - Simon explicitly chose this direction. Treat it as a design constraint until Simon changes it.
- **OPEN - SIMON TO DECIDE** - no decision has been made yet.
- **SUGGESTED BY CHATGPT** - an option or recommendation from ChatGPT. It is not part of the game design unless Simon accepts it.
- **DEFERRED** - intentionally left undecided because deciding it now would not help the current work.

When ChatGPT adds new ideas to this file, they must be clearly marked as suggestions or open decisions. ChatGPT must never silently promote its own suggestion into a decided rule.

## Priority language

- **P0 - Now:** foundational or directly relevant to the next prototype. Discuss these first.
- **P1 - Soon:** important to the core interaction model, but not needed for the next immediate decision.
- **P2 - Later:** needed before the associated system is implemented.
- **P3 - Parked:** preserve the question, but do not spend design attention on it yet.

## Conversation rule

To avoid drowning Simon in questions, normally discuss **one highest-priority open decision at a time**. Do not dump the entire open-decision list into the conversation unless Simon asks for it.

---

# Current decision queue

These are the questions to answer next, in priority order.

1. **CARD-01 [P0]** - What kinds of things should be represented as cards?
2. **CARD-02 [P0]** - What information must every card have or display?
3. **CARD-03 [P0]** - Do cards use categories, composable capabilities/tags, or both?
4. **CARD-04 [P1]** - How should a specific card instance differ from its reusable card definition?
5. **CARD-05 [P1]** - How much information belongs permanently on a card face versus contextual reveal?

Everything else remains recorded below, but should not compete for attention yet.

---

# Decisions already made

These are choices Simon has already made in Safe Room discussions.

## Core interaction

### CORE-D01 - Movable cards can move between Room and Inventory

**Status:** DECIDED BY SIMON

Movable cards can be dragged back and forth between the Room area and Inventory when the move is legal.

### CORE-D02 - Nadir is an anchored card in Inventory

**Status:** DECIDED BY SIMON

Nadir is represented by a persistent card in Inventory. He is anchored rather than dragged around like an ordinary item.

### CORE-D03 - Character stats live on Nadir's card

**Status:** DECIDED BY SIMON

Relevant character stats should be card attributes on Nadir rather than requiring a separate character-stat UI system.

### CORE-D04 - Food is used by dragging it onto Nadir

**Status:** DECIDED BY SIMON

Eating is a card-on-card interaction: drag food onto Nadir.

### CORE-D05 - Valid targets highlight during dragging

**Status:** DECIDED BY SIMON

Whenever a card is dragged, cards or destinations that can accept it should highlight.

### CORE-D06 - Direct stat consequences are previewed before dropping

**Status:** DECIDED BY SIMON

When a dragged card would change a visible stat, the affected value should show the prospective result before the action is committed, for example:

`Hunger 67 -> 98`

The preview belongs on or immediately around the affected stat so the player can read the consequence directly.

### CORE-D07 - Complexity should come from a small number of legible systems

**Status:** DECIDED BY SIMON

Cards and numerical attributes should carry substantial mechanical complexity without flooding the play area with many separate cards, bars, and overlapping systems. The player should be able to read the state well enough to make decisions.

## Threat and pacing

### THREAT-D01 - No mandatory constant real-time pressure

**Status:** DECIDED BY SIMON

Risk should often come from player-chosen actions and exposure rather than from a constant artificial timer.

### THREAT-D02 - Noise can make productive actions dangerous

**Status:** DECIDED BY SIMON

Machinery and other activity can create noise and therefore danger. The player should be informed before choosing a meaningfully noisy action.

### THREAT-D03 - Attacks/search pressure require a credible threat reason

**Status:** DECIDED BY SIMON

The game should not generate attacks merely to tax the player for progressing. A genuinely quiet or "silent" period must be possible when the situation warrants it.

### THREAT-D04 - Nadir does not perform direct violence

**Status:** DECIDED BY SIMON

If violent defense exists, Nadir does not directly carry it out; traps, turrets, or other automated/indirect systems may do so.

## Narrative

### NARR-D01 - Nadir is fundamentally a decent man

**Status:** DECIDED BY SIMON

He did not want to become ruthless or cruel. The military system and culture damaged him rather than revealing that he was secretly that kind of person all along.

### NARR-D02 - Nadir lies to himself as a survival mechanism

**Status:** DECIDED BY SIMON

His self-deception grows from things he has done, enabled, caused, or survived that he cannot comfortably live with. It should not make him appear stupid.

### NARR-D03 - Nadir and Elina are a genuine love story

**Status:** DECIDED BY SIMON

The relationship is complicated by concealment, fear, and Nadir's past. The story should not resolve into a twist that he was simply using Elina.

### NARR-D04 - Nadir's notes may reflect moral discomfort with player actions

**Status:** DECIDED BY SIMON

The notes can reflect things Nadir feels bad about, but from his perspective rather than as a simple authorial morality score.

---

# Card

This section defines questions about the basic card abstraction. It is currently the highest-priority design area.

## CARD-01 - What kinds of things should be cards?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P0

Known constraints from Simon's decisions:

- ordinary movable objects can be cards,
- Nadir is a card even though he is not a movable inventory item,
- cards are therefore broader than "things the player can carry."

**Suggested by ChatGPT:** A card could be the general visible representation of a persistent game entity that the player may inspect, act with, or act upon. Under that model, food, tools, Nadir, and a generator could all be cards, while global values or incidental room properties would not automatically become cards.

Questions contained in this decision:

- Do machines deserve cards?
- Can temporary conditions be cards, or should they use a lighter visual language?
- Should rooms themselves ever be cards, or remain spatial containers for cards?
- Which state should stay as a property of a room, another card, or global game state rather than becoming its own card?

## CARD-02 - What must every card contain or display?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P0

**Suggested by ChatGPT:** Every card probably needs a stable identity and a player-facing name, but very little else should be universal. Attributes, descriptions, images, location, movability, and interaction data should only exist where needed.

The exact data structure is not decided.

Candidate concepts previously suggested by ChatGPT:

- unique instance identity,
- player-facing name,
- reusable definition/type reference,
- current zone or anchored location,
- capabilities or tags,
- visible attributes,
- interaction rules,
- entity-specific state.

Simon needs to decide which of these are genuinely universal and which are optional.

## CARD-03 - Categories, capabilities/tags, or both?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P0

**Suggested by ChatGPT:** Prefer composable capabilities over a rigid class hierarchy. A card could independently be movable, edible, targetable, anchored, usable as a tool, able to accept fuel, and so on. A broad descriptive category could still be useful for presentation/content organization without defining all behavior.

This suggestion is intended to avoid increasingly rigid categories such as `FoodCard`, `ToolCard`, `CharacterCard`, and `MachineCard` when a card may combine several behaviors.

Simon needs to decide whether the design language should use:

- explicit mutually exclusive card categories,
- composable tags/capabilities,
- both categories and capabilities,
- or another approach.

## CARD-04 - Card instance versus reusable card definition

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P1

**Suggested by ChatGPT:** Two tins of beans should be able to be separate card instances even when they share the same reusable content definition. Shared information such as name/art/base effects can come from the definition; location, condition, quantity, or other changing state can live on the instance when necessary.

Questions:

- Do identical objects always get distinct instances?
- What state belongs to the reusable definition versus the individual instance?
- Can a card transform by changing definition, or should transformation create/replace an instance?

## CARD-05 - Information hierarchy on the card face

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P1

Simon has already decided that immediate stat consequences should be visible during interactions. The broader information hierarchy is still open.

**Suggested by ChatGPT:** Prioritize information in roughly this order:

1. what the thing is,
2. immediately important current state,
3. interaction-relevant information,
4. secondary detail only when inspected or contextually relevant.

Questions:

- What is permanently visible?
- What appears on hover or selection?
- What appears only during a drag/action preview?
- How much visual distinction should different card kinds have before the common card language breaks down?

## CARD-06 - Card size

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: should cards have one fixed size, content-driven size, or a small number of standard sizes?

**Suggested by ChatGPT:** Defer the permanent answer until the interaction prototype can be tested visually.

## CARD-07 - Cards containing or attaching other cards

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: can equipment, injuries, fuel, container contents, or similar things appear as cards attached to or contained by another card?

This decision affects equipment, injuries, containers, and machinery later.

## CARD-08 - Stacks and quantities

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: how should multiple identical objects be represented without flooding the play area with duplicate cards?

Related question: should quantity be an attribute, a special card state, a stack representation, or something else?

## CARD-09 - Durability and other object-specific state

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: should durability and similar values use the same visible attribute system as Hunger/Health, specialized state, conditions, or another representation?

---

# Moving cards between Room and Inventory

## MOVE-01 - Basic movement

**Status:** DECIDED BY SIMON

**Priority:** already decided

Movable cards can be dragged from Room to Inventory and back when legal. Anchored cards do not move through this interaction.

**Suggested by ChatGPT implementation consequence:** invalid drops should leave state unchanged and legal destinations should be determined by game rules rather than by accidental UI behavior.

## MOVE-02 - Inventory capacity model

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: does Inventory eventually have a capacity limit? If yes, is it based on slots, weight, bulk, containers, or something else?

## MOVE-03 - Cost/consequence of taking or dropping an object

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: is moving a card between Room and Inventory always mechanically free, or can taking/dropping something consume time or create other consequences?

## MOVE-04 - Exact placement inside a room

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: does exact card placement in a Room ever matter mechanically, or is Room primarily a zone containing cards?

## MOVE-05 - Objects that cannot be carried

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: can an object be a card and still be too large, fixed, or otherwise impossible to move into Inventory?

**Suggested by ChatGPT:** yes; being a card should not imply being carryable.

---

# Card-on-card interactions

## INTERACT-01 - Card-on-card interaction as the common action language

**Status:** PARTLY DECIDED BY SIMON

**Priority:** P1

Simon has explicitly decided that Food -> Nadir performs eating.

The broader generalization to medicine, tools, machines, giving items, equipping, repairing, and other verbs is **SUGGESTED BY CHATGPT**, not yet decided.

**Suggested by ChatGPT:** use card-on-card drops as a common interaction language wherever the action is clear enough, instead of creating a separate menu/button system for every verb.

## INTERACT-02 - Multiple plausible actions between the same two cards

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: if the same source and target could support more than one action, how does the player choose?

## INTERACT-03 - Confirmation before committing an action

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: should some card-on-card actions require confirmation, or should a valid drop normally commit immediately?

## INTERACT-04 - Actions with time/noise consequences

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: can a simple drop initiate an action that takes time or creates noise rather than resolving instantly?

This must eventually fit Simon's existing decision that meaningful noise should be communicated before commitment.

## INTERACT-05 - Consumables versus reusable tools

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: how does the design distinguish an item that is consumed by an interaction from one that remains available afterward?

## INTERACT-06 - Where interaction rules live

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: does the dragged card define an interaction, does the target define what it accepts, does a separate rule describe the pair, or is it derived from capabilities/tags?

**Suggested by ChatGPT:** keep the actual legality/effect rules outside UI rendering and make content data-driven where doing so stays readable.

---

# Valid-target highlighting

## TARGET-D01 - Legal targets highlight during dragging

**Status:** DECIDED BY SIMON

All cards/locations that can currently accept the dragged card should highlight.

## TARGET-01 - Different highlights for different action types

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: should move, consume, repair, equip, give, etc. use distinct target highlights, or should all valid targets share one visual language?

## TARGET-02 - Dangerous but legal actions

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: should a legal but dangerous action use the same validity highlight as a harmless one, with danger communicated through the preview/warning system?

**Suggested by ChatGPT:** validity and desirability are different concepts; the target highlight should primarily communicate legality.

## TARGET-03 - Hidden or currently inaccessible interactions

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: should interactions that are currently unavailable remain entirely hidden, or can they appear disabled as a teaching mechanism?

## TARGET-04 - Highlight visual intensity

**Status:** DEFERRED

**Priority:** P3

This should be tested in the prototype rather than decided abstractly. The player needs to notice valid targets without the screen becoming visually noisy.

**Suggested by ChatGPT implementation consequence:** the same underlying legality rules should drive both highlighting and the actual committed drop so the UI cannot promise an interaction that the game later rejects.

---

# Action previews

## PREVIEW-D01 - Preview direct visible stat changes before commitment

**Status:** DECIDED BY SIMON

Example: `Hunger 67 -> 98` appears on Nadir while food is positioned over him.

## PREVIEW-01 - Multiple affected attributes

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: if an interaction affects several visible attributes, how much should be previewed without making the target card unreadable?

## PREVIEW-02 - Indirect consequences such as noise

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P1

Question: should deterministic indirect consequences also appear in the same preview system, for example an action's noise cost?

This is relevant because Simon has already decided that the player should know before deliberately causing meaningful noise.

## PREVIEW-03 - Uncertain outcomes

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: if an outcome is uncertain, should the preview show a range, probability, qualitative warning, or no numerical outcome?

## PREVIEW-04 - Long-term deterministic consequences

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: should a preview show only immediate consequences, or also deterministic longer-term effects?

**Suggested by ChatGPT:** show the resulting value rather than only an abstract modifier when the resulting state is what matters to the decision. A preview should not mutate game state and should use the same rules as the committed action.

---

# Nadir and survival

## NADIR-D01 - Nadir is an anchored Inventory card

**Status:** DECIDED BY SIMON

## NADIR-D02 - Character stats are attributes on Nadir's card

**Status:** DECIDED BY SIMON

Hunger is a confirmed example. Health was introduced for the prototype by ChatGPT and should not be treated as a permanent final attribute merely because it exists there.

## NADIR-01 - How many attributes can Nadir expose legibly?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P1

This is partly a design decision and partly something to observe in prototypes.

## NADIR-02 - Injury representation

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: are injuries numerical attributes, conditions, attached cards, or some combination?

## NADIR-03 - Equipment representation

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: does equipment appear as slots/attributes on Nadir, cards attached to him, ordinary cards remaining in Inventory, or something else?

## NADIR-04 - Mental and narrative state representation

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: are mental/narrative states shown numerically, qualitatively, indirectly through writing/behavior, or not shown at all?

---

# Survival attributes and information density

## SURV-D01 - Avoid complexity that only makes the game harder to read

**Status:** DECIDED BY SIMON

The goal is a lot of decision complexity with as few exposed systems and attributes as practical. Hidden or overlapping stats can make otherwise clever survival systems difficult to read.

## SURV-01 - Which permanent survival pressures exist?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Candidates raised so far include Hunger, Health, thirst, fatigue, temperature, illness, stress, injury, morale, and similar pressures.

No candidate becomes a permanent stat merely by appearing in this list.

**Suggested by ChatGPT decision test:** before adding a permanent attribute, ask:

- What distinct decision does it create?
- Why cannot an existing attribute, card state, or condition express it?
- What does the player see?
- How can the player intentionally influence it?
- What trade-off makes it interesting rather than another bar to maintain?

## SURV-02 - Permanent attribute versus condition/card

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: which pressures should be permanent numbers and which should appear only as conditions, cards, or other temporary state?

## SURV-03 - Hidden survival state

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: when, if ever, is a hidden state desirable because Nadir would not know the exact value or because uncertainty is itself interesting?

**Suggested by ChatGPT:** do not add a hidden stomach/fullness system to the first food prototype. This was a recommendation, not a final decision by Simon.

## SURV-04 - Attribute scales

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: should attributes generally use a common scale such as 0-100, or should the scale follow the semantics of each attribute?

## SURV-05 - Attribute change over time/actions

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: how do survival pressures degrade or change over time without violating the decision against arbitrary constant real-time pressure?

---

# Noise

## NOISE-D01 - Noise links useful activity with exposure

**Status:** DECIDED BY SIMON

Machinery and other activity can create noise, and noise can create danger. The player should know before deliberately choosing a meaningfully noisy action.

## NOISE-D02 - Quiet play can genuinely remain quiet

**Status:** DECIDED BY SIMON

Noise/threat should not secretly function as a mandatory attack meter. A silent night is possible.

## NOISE-01 - What is noise mechanically?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: is noise a numerical value, discrete event, spatial signal, or combination?

## NOISE-02 - Accumulation, decay, and propagation

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: does noise accumulate, decay, propagate through rooms/space, or simply create detectable events?

## NOISE-03 - What risk information does the player see?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: how much of current detectability or search risk is visible to the player?

## NOISE-04 - Environmental masking

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Simon has previously considered external windows such as weather making noisy actions safer. The exact masking model remains undecided.

## NOISE-05 - Persistent enemy learning from repeated noise

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: can repeated noise teach searchers where to investigate even if no single event triggers a sweep?

## NOISE-06 - Avoiding a disguised danger meter

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

The exact mechanics need to preserve Simon's decision that attacks happen only when there is credible threat, rather than because a hidden or visible meter inevitably fills.

---

# Search teams and sweeps

## SEARCH-D01 - Human search teams are a core external threat

**Status:** DECIDED BY SIMON

Search teams can sweep the complex looking for Nadir or other refugees.

## SEARCH-D02 - Nadir does not answer searches with direct violence

**Status:** DECIDED BY SIMON

Preparation, concealment, avoidance, traps, automated defenses, and other indirect systems can matter instead.

## SEARCH-01 - Persistent individual guards versus higher-level sweep model

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: are guards individually simulated with persistent schedules, are sweeps generated at a higher level, or is there a hybrid?

Simon has previously favored inhabitants having daily schedules, but the exact search-team simulation is not yet fixed.

## SEARCH-02 - How much can the player learn about schedules?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: how predictable/learnable are guard and search routines?

## SEARCH-03 - What does the enemy know about Nadir?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: are they looking for Nadir specifically, a code-named suspect, one unknown person, or potentially multiple people?

The story idea that searchers assign a code name exists, but exact knowledge remains undecided.

## SEARCH-04 - Persistent suspicion

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: how does suspicion/information persist between incidents?

## SEARCH-05 - Partial discovery

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: what happens when a team finds evidence of occupancy/activity but does not find Nadir?

## SEARCH-06 - Failure states

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P2

Question: what meaningful failure states exist besides immediate capture/death?

**Suggested by ChatGPT:** sweeps should have a world-state or authored narrative reason; preparation should materially change outcomes; repeated sweeps should not become a detached grind loop. These are recommendations consistent with Simon's existing pacing decisions, but are not additional decisions unless Simon accepts them.

---

# Nadir's notes and self-deception

## NOTES-D01 - Notes can reflect Nadir's moral discomfort

**Status:** DECIDED BY SIMON

## NOTES-D02 - Self-deception should not make Nadir look stupid

**Status:** DECIDED BY SIMON

His lies to himself are a survival mechanism rooted in his military past.

## NOTES-D03 - The Elina relationship remains genuine

**Status:** DECIDED BY SIMON

Any unreliable narration must remain compatible with Nadir and Elina genuinely loving each other.

## NOTES-01 - When are notes created?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: automatically after significant events, manually during rest, on authored triggers, or some combination?

## NOTES-02 - Can choices change what Nadir eventually admits about his past?

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: do choices only alter his reflections on current events, or can they change how directly he confronts fixed events from his past?

## NOTES-03 - Frequency of moral reflection

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: how often can moral reflection appear before it feels like the game comments on every action?

## NOTES-04 - Objective account versus Nadir's account

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: should the player ever receive a clearly objective account that confirms where Nadir's narration is distorted?

## NOTES-05 - Fixed backstory versus interpretation/discovery order

**Status:** OPEN - SIMON TO DECIDE

**Priority:** P3

Question: how much of Nadir's past is objectively fixed and how much remains open to interpretation or changes with discovery order?

**Suggested by ChatGPT:** self-deception can be conveyed through omissions, euphemisms, contradictions, rationalizations, and later reinterpretations rather than by explicitly announcing guilt or unreliability. This is a writing recommendation, not a decided narrative rule.

---

# Suggested implementation principles not yet approved as game-design decisions

These came from ChatGPT while translating the design into something Codex could build. They are preserved here so they do not masquerade as Simon's choices.

## IMPL-01 - Rules outside presentation code

**Status:** SUGGESTED BY CHATGPT

Keep interaction legality and state transitions in game-rule code rather than embedding one-off behavior directly in React components.

## IMPL-02 - Data-driven card/content definitions

**Status:** SUGGESTED BY CHATGPT

Keep ordinary card definitions/effects as concise data where this reduces boilerplate and makes content easy to author.

## IMPL-03 - Highlight and commit use the same legality rules

**Status:** SUGGESTED BY CHATGPT

The rules that decide whether a target highlights should be the same rules that decide whether the eventual drop is legal.

## IMPL-04 - Preview and commit use the same effect calculation

**Status:** SUGGESTED BY CHATGPT

Preview calculations should not mutate state, and committing the action should produce the same deterministic result that was previewed.

## IMPL-05 - Card identity separate from reusable definition

**Status:** SUGGESTED BY CHATGPT

Keep a specific card instance distinguishable from reusable content data. This overlaps CARD-04 and should not be treated as approved until Simon decides it.

---

# Maintenance rule

When Simon answers an open decision:

1. change its status to **DECIDED BY SIMON**,
2. record the decision in plain language,
3. remove it from the current decision queue,
4. promote the next relevant question by priority,
5. preserve rejected ChatGPT suggestions only when the rejection itself is useful context,
6. never rewrite a ChatGPT recommendation as if Simon had originally proposed it.
