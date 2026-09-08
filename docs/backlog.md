# Safe Room — design backlog

This file is a design backlog, not an implementation plan.

Items here are candidates for future work. They capture enough intent and context that we can discuss, refine, reject, split, or later promote them into `roadmap.md` without relying on memory.

**Codex must not implement a backlog item merely because it appears here.** An item should only be implemented when it is explicitly requested or promoted into the roadmap.

The backlog is allowed to contain unresolved questions. Where a rule has not been decided, preserve the uncertainty rather than silently choosing an answer.

## Index

### Core card interaction
- Drag cards between Room and Inventory
- Card-on-card interactions
- Valid-target highlighting
- Action previews

### Nadir and survival
- Anchored Nadir card and character attributes
- Survival attributes and information density

### Environment and threat
- Noise as a consequence of activity
- Search teams and sweeps

### Narrative
- Nadir's notes and self-deception

---

# Core card interaction

## Drag cards between Room and Inventory

### Purpose

Cards should behave like physical objects in the player's workspace. Moving an object between the environment and Nadir's possessions should usually be expressed by moving the card itself rather than opening an inventory management screen.

The interaction is intended to make inventory management spatial, immediate, and easy to read while keeping the number of separate UI systems low.

### Player experience

The player sees a Room area and a persistent Inventory area. A movable card can be picked up and dragged between them when the move is legal.

The player should be able to understand where a card can go before releasing it. Failed interactions should feel like a clearly invalid action, not like an unexplained UI failure.

### Current direction

- Movable cards may exist in the Room or Inventory.
- Some cards are anchored and cannot be moved normally.
- Room and Inventory are meaningful zones, not merely visual columns.
- A legal drop into a zone moves the card there.
- An invalid drop leaves the game state unchanged.
- Dropping a card onto another card can represent an action rather than a move.

### Examples

- Drag a screwdriver from Room to Inventory to take it.
- Drag the screwdriver from Inventory back to Room to leave it behind.
- Drag food onto Nadir to eat it rather than moving it into Nadir's position.

### Open questions

- Does Inventory eventually have a capacity limit, and if so what creates that limit: slots, weight, bulk, containers, or something else?
- Is moving a card between Room and Inventory always free, or can circumstances make taking or dropping something an action with consequences?
- Does exact placement inside the Room area ever matter mechanically, or is Room initially just a zone?
- Can some objects be too large or otherwise impossible to put in Inventory?

### Dependencies

- Card representation
- Room zone
- Inventory zone
- Drop validation
- Card-on-card interaction rules

### Acceptance criteria for a future implementation

- A movable card can be dragged from Room to Inventory when legal.
- The same card can be dragged back to Room when legal.
- Invalid moves do not alter state.
- Anchored cards cannot accidentally be moved by the same interaction.
- The player can tell legal and illegal destinations apart before committing the drop.

---

## Card-on-card interactions

### Purpose

Cards should act as both objects and possible interaction targets. This allows many verbs to emerge from one consistent UI language instead of requiring separate buttons and menus for eating, using medicine, equipping an item, repairing something, giving an item to someone, and similar actions.

### Player experience

When the player picks up a card, other cards that can meaningfully accept it become possible destinations. Dropping one card on another performs the obvious contextual interaction if that interaction is legal.

The interface should remain predictable. The player should not have to guess whether a drop means "move this here" or "use this on that."

### Current direction

- A card may declare or derive which other cards it can interact with.
- The game rules, not the React/UI component, decide whether a card-on-card interaction is legal.
- A successful interaction can transform attributes, consume cards, move cards, create cards, or change state.
- The target should communicate that it accepts the dragged card before the drop.
- Interactions should be data-driven where doing so keeps the content concise and understandable.

### Examples

- Food -> Nadir: eat the food and change Hunger.
- Medicine -> Nadir: potentially treat an injury or health state later.
- Tool -> machine: potentially repair or modify the machine later.
- Item -> another person: potentially give the item later.

Only the first example is currently committed to the interaction prototype. The others illustrate the intended extensibility of the interaction language.

### Open questions

- When several actions between the same two cards are plausible, how does the player choose?
- Should card-on-card actions ever require a confirmation step?
- Can an action take time or create noise while still being initiated by a simple drop?
- How are reusable tools distinguished from consumables in the effect model?
- Should the target own the interaction definition, the dragged card own it, or should a separate rule describe the pair?

### Dependencies

- Drop-target system
- Action preview system
- Game-state transition model
- Card/content data format

### Acceptance criteria for a future generalized implementation

- Interaction legality is determined outside presentation code.
- A target can accept one card type while rejecting another.
- Successful interactions produce deterministic state transitions.
- Rejected interactions leave state unchanged.
- The UI can represent a consumable interaction and a reusable-item interaction without inventing separate interaction systems.

---

## Valid-target highlighting

### Purpose

Dragging should expose the game's interaction possibilities rather than forcing the player to discover them by trial and error. Highlighting valid targets turns the act of picking up a card into a way of asking the game, "What can I do with this?"

This is important because Safe Room is intended to gain complexity from combinations between a limited number of visible systems. That complexity becomes frustrating if legal combinations are opaque.

### Player experience

As soon as a card is dragged, every card or location that can currently accept it becomes visually distinct. Invalid targets remain visually quiet.

The highlight should indicate legality, not necessarily desirability. A legal action may still have bad consequences.

### Current direction

- Highlight all currently legal drop targets while a card is being dragged.
- Recalculate legality from current game state rather than from static UI assumptions.
- Do not highlight targets that cannot accept the card under current conditions.
- Keep the visual language consistent across Room, Inventory, Nadir, machines, and future characters.
- Highlighting should not reveal information the player is not supposed to know merely because an interaction exists internally.

### Examples

- Dragging food highlights Nadir if Nadir can currently eat it.
- Dragging a generic item highlights Inventory if it can be carried.
- A locked or unavailable interaction does not highlight merely because it might become possible later.

### Open questions

- Should highlights distinguish different kinds of valid targets, such as move, consume, repair, equip, or give?
- Should a valid but dangerous action use the same highlight as a harmless action, leaving consequences to the preview system?
- How subtle can the highlight be before players miss it?
- Should inaccessible interactions ever be shown in a disabled form as a teaching mechanism?

### Dependencies

- Interaction legality rules
- Drag state
- Action preview system

### Acceptance criteria for a future implementation

- Starting a drag reveals all legal current targets.
- Ending or cancelling the drag clears all target highlights.
- Invalid targets do not appear valid.
- A state change that affects legality also affects highlighting.
- Highlight behavior comes from the same legality rules used when the action is actually committed.

---

## Action previews

### Purpose

The player should understand the direct mechanical consequence of an action before committing it. Numerical attributes can hold substantial system complexity without filling the interface with extra cards and bars, but only if the player can read what an item or action will actually do.

The preview system is intended to avoid the common survival-game problem where the player knows that they are hungry but cannot tell whether eating now is wasteful or useful because the effects are hidden.

### Player experience

When a dragged card is positioned over a valid target, affected visible values temporarily show their prospective result. The preview disappears if the player moves away or cancels the drag. Dropping commits exactly the change that was previewed unless another explicit mechanic intervenes.

### Current direction

- Preview direct visible state changes before the drop.
- Show old and new values near the affected attribute, for example `Hunger 67 -> 98`.
- Clamp or otherwise resolve the value exactly as the committed action will.
- A preview is temporary and must not mutate game state.
- Prefer showing the resulting value rather than only an abstract modifier such as `+31` when the resulting state is what matters to the decision.
- Do not use previews to expose deliberately hidden information.

### Examples

- Food over Nadir: `Hunger 67 -> 98`.
- A stronger food when Hunger is 90 might preview `90 -> 100`, making the wasted capacity visible.
- A future medicine might preview a visible Health or injury change if that information is meant to be known.

### Open questions

- How should previews display multiple affected attributes without making cards visually noisy?
- Should negative consequences caused indirectly by an action also be previewed, such as noise?
- When an outcome is uncertain, should the preview show a range, probability, qualitative warning, or nothing?
- Should long-term consequences be excluded even when deterministic?

### Dependencies

- Pure game-rule calculation
- Valid-target detection
- Attribute display

### Acceptance criteria for a future generalized implementation

- Hovering a dragged card over a valid target can calculate an outcome without mutating state.
- The visible preview matches the value produced by committing the action.
- Clamping and other deterministic rules are reflected in the preview.
- Cancelling the interaction restores the ordinary display with no state change.
- Multiple future action types can use the same preview mechanism.

---

# Nadir and survival

## Anchored Nadir card and character attributes

### Purpose

Nadir should exist in the interface as a persistent card rather than requiring a separate character sheet or status screen. This gives the player a physical target for actions involving Nadir and lets character state live in the same interaction language as the rest of the game.

The design deliberately tries to remove a whole UI/system layer: instead of a character panel plus an inventory plus item-use menus, Nadir himself is an anchored inventory card that items can act on.

### Player experience

Nadir is always available in the Inventory area. His card displays the character information currently important to decisions. The player can drag compatible cards onto him to perform actions such as eating.

Nadir's card is stable and cannot accidentally be dragged out of Inventory like an ordinary object.

### Current direction

- Nadir is an anchored card in Inventory.
- Character survival state is represented as attributes on that card when possible.
- Hunger and Health are the first prototype attributes.
- Cards can target Nadir through the ordinary card-on-card interaction system.
- Attribute changes are previewed directly on Nadir when possible.
- Do not add separate status systems if the same information can live legibly on the card.

### Examples

- Food -> Nadir changes Hunger.
- Future medicine -> Nadir could affect Health or an injury.
- Future wearable equipment might interact with Nadir without opening a separate equipment screen, depending on later design.

### Open questions

- How many attributes can Nadir's card display before it stops being readable?
- Are injuries attributes, attached cards, conditions, or some combination?
- Should equipment appear as attributes/slots on Nadir, as cards attached to him, or remain in Inventory?
- Are mental or narrative states ever shown numerically, qualitatively, or not at all?

### Dependencies

- Card-on-card interactions
- Attribute model
- Action previews

### Acceptance criteria for a future mature implementation

- Nadir remains a persistent, non-movable interaction target.
- Character state required for immediate decisions is readable without opening another screen.
- Compatible items can operate on Nadir through the same rules used for other card interactions.
- Adding a new character attribute does not require inventing a new UI subsystem.

---

## Survival attributes and information density

### Purpose

Safe Room needs enough state to produce difficult survival decisions, but every additional stat increases cognitive load and can make the game harder to read rather than deeper.

The goal is to get maximum decision complexity from the minimum number of player-facing attributes. Hidden variables should only exist when the uncertainty they create is intentional and interesting, not because the simulation happens to model them.

### Player experience

The player should be able to glance at Nadir and understand the survival pressures relevant to the next decision. They should not need to memorize hidden thresholds, convert bars into unknown item effects, or reason about multiple overlapping measures of essentially the same need.

### Current direction

- Start with Hunger and Health in the prototype.
- Add attributes only when they create a distinct decision that existing attributes cannot represent well.
- Prefer explicit numerical consequences during direct manipulation.
- Avoid a hidden stomach/fullness stat for the first food implementation.
- Distinguish useful uncertainty about the world from uncertainty caused by unclear rules.

### Examples

A hunger system can become deep through scarcity, food quality, timing, travel risk, noise, spoilage, or competing uses for resources without necessarily adding separate hunger, fullness, stomach capacity, metabolism, and meal-frequency stats.

### Open questions

- Which additional survival pressures are actually necessary: thirst, fatigue, temperature, illness, stress, injury, morale, or others?
- Can some pressures be conditions/cards rather than permanent numerical stats?
- When is a hidden state desirable because Nadir himself would not know the exact value?
- Should attributes always use 0-100, or should scale follow the semantics of each attribute?
- How should attribute degradation over time work given the design preference against arbitrary real-time pressure?

### Dependencies

- Nadir card
- Time/action model
- Food and resource design

### Acceptance criteria before adding a new permanent survival attribute

Before promotion to the roadmap, a proposed attribute should answer:

- What distinct decision does this create?
- Why cannot an existing attribute, card state, or condition express it?
- What information does the player see?
- How does the player intentionally influence it?
- What interaction or trade-off makes it interesting rather than merely another bar to maintain?

---

# Environment and threat

## Noise as a consequence of activity

### Purpose

Noise is intended to connect productivity with danger. The player should often be able to improve the safe room, operate useful machinery, or perform valuable actions, but doing so can increase the chance of attracting attention.

This creates pressure without relying on constant enemy waves or an arbitrary ticking clock. Risk comes from what the player chooses to do.

### Player experience

Before starting a noisy action, the player should understand that it will make noise and have enough information to judge whether the benefit is worth the exposure. Noise should feel like a consequence of concrete actions, not a random punishment.

A quiet period should be possible when the player deliberately avoids noisy activity.

### Current direction

- Machinery and other actions can generate noise.
- The player should be informed before committing a meaningfully noisy action.
- Noise increases threat only when there is a credible reason for someone to detect or investigate it.
- Avoid spawning attacks simply to punish progress or create artificial activity.
- External conditions may create better or worse windows for noisy work.
- The threat model should support the possibility of a genuinely silent night.

### Examples

- Running a generator may enable useful systems while increasing detectability.
- Performing loud construction could be safer during environmental noise than during a quiet night.
- Choosing not to operate machinery may preserve safety at the cost of lost productivity.

### Open questions

- Is noise a numerical value, a spatial signal, discrete events, or a combination?
- Does noise accumulate, decay, propagate through rooms, or merely create detectable events?
- How much of the current detection risk is visible to the player?
- Which external conditions can mask noise?
- Can repeated noise teach enemies where to search even when a single event does not trigger a sweep?
- How does the system avoid becoming a predictable "fill the danger meter" mechanic?

### Dependencies

- Action/time model
- Machinery
- Threat/search system
- Environment conditions

### Acceptance criteria before implementation

- The system creates a meaningful choice between benefit and exposure.
- The player receives warning before deliberately causing significant noise.
- Remaining quiet is a valid strategy, not merely a delay before a mandatory attack.
- Threat responses follow understandable world logic rather than a fixed grind loop.

---

## Search teams and sweeps

### Purpose

Search teams provide the principal external human threat around the hideout. They should create tension through routines, uncertainty, preparation, and the possibility of discovery rather than through direct player combat.

The player is defending a vulnerable hidden life against people who are actively looking for someone like Nadir.

### Player experience

The player learns enough about search behavior to prepare and make plans but never gains perfect omniscience. Sweeps should feel like events with causes and warning signs, not arbitrary enemy waves.

When danger arrives, the player's earlier decisions about noise, rooms, concealment, equipment, and automated defenses should matter.

### Current direction

- Search teams sweep areas looking for Nadir or other refugees.
- Search behavior should be grounded in schedules, information, suspicion, and credible triggers.
- Nadir does not solve the problem through direct violence.
- Defensive violence, if eventually present, is indirect or automated.
- The player should often have ways to reduce exposure before a sweep rather than only react after it begins.
- The game should avoid mandatory repetitive attacks used as a resource tax.

### Examples

- A noisy pattern could make the hideout more likely to be investigated.
- A scheduled or scripted sweep could force the player to prepare particular rooms.
- Equipment failures or changing routines can disrupt a previously safe plan.

### Open questions

- Are individual guards simulated persistently, or are sweeps generated from a higher-level threat model?
- How much of guard schedules can the player learn?
- Does the enemy know it is looking for Nadir specifically, a code-named suspect, or simply an unknown person?
- How does suspicion persist between incidents?
- What happens mechanically when a search team partially discovers evidence but not Nadir?
- What are the failure states besides immediate capture/death?

### Dependencies

- World map/rooms
- Noise
- NPC/routine model
- Concealment and defensive systems

### Acceptance criteria before implementation

- Every sweep has a world-state reason or authored narrative reason.
- Preparation can materially change the outcome.
- Direct player violence is not required.
- Repeated sweeps do not become a predictable grind loop disconnected from player behavior.
- The player can understand enough of the threat model to make informed decisions without having perfect information.

---

# Narrative

## Nadir's notes and self-deception

### Purpose

Nadir's written reflections can expose character, reinterpret player actions, and gradually reveal the gap between what happened and what Nadir can admit to himself.

His defining flaw is not stupidity or habitual manipulation. He has experienced and participated in things he cannot comfortably integrate into his self-image. Lying to himself is a survival mechanism created by that history.

### Player experience

Notes should initially feel like Nadir's sincere account of his circumstances. Over time, inconsistencies, omissions, euphemisms, rationalizations, and later reflections can allow the player to recognize that his narration is not always reliable.

If the player causes or permits something Nadir finds morally troubling, his notes can reflect the emotional consequence without becoming a simplistic morality meter.

### Current direction

- Nadir is fundamentally a decent man who did not want to become ruthless or cruel.
- His military system and culture were coercive, toxic, and corrupting.
- His self-deception helps him live with things he has done, enabled, or survived.
- Moral reflections should be written from Nadir's perspective rather than as authorial judgement of the player.
- His relationship with Elina is a genuine love story complicated by concealment and his past, not a twist revealing that he was simply using her.
- Notes can change in tone or interpretation as events force Nadir closer to acknowledging uncomfortable truths.

### Examples

A troubling player action might initially be described in logistical or impersonal terms. A later note might revisit the same event indirectly, revealing that Nadir has been thinking about the person affected even if he still avoids stating his own responsibility plainly.

The point is not for the game to announce "Nadir feels guilty." The writing itself should carry the conflict.

### Open questions

- Are notes automatically created after significant events, manually written at rest, or both?
- Can different player choices change only the content of notes, or also what Nadir eventually admits about his past?
- How often can moral reflection appear before it becomes commentary on every player action?
- Should the player ever see a clearly objective account that confirms where Nadir's version is distorted?
- How much of the backstory is fixed versus dependent on player interpretation and discovery order?

### Dependencies

- Narrative event/state tracking
- Nadir backstory
- Elina relationship arc
- Significant-choice/event model

### Acceptance criteria before implementation

- Notes sound like Nadir rather than a game morality system.
- Reflections can acknowledge troubling events without labeling the player good or evil.
- Self-deception is conveyed through wording, omission, contradiction, or reinterpretation rather than making Nadir appear unintelligent.
- The narrative remains compatible with Nadir and Elina having genuinely loved each other.
