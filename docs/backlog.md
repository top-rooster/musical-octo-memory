# Safe Room detailed backlog and decision register

This is the single authority for detailed design, implementation tasks, acceptance criteria, open questions, and useful implementation history. Completed tasks remain here. Priority expresses urgency, not implementation scope; only `docs/next-iteration.md` defines current scope.

## DATA-D01 — Runtime authored data uses strict JSON

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Runtime authored data uses strict `data/cards.json`, `data/rooms.json`, and `data/attributes.json`. JSONC and comments are not allowed; design notes and TODOs belong in this backlog.

### Acceptance criteria

- Runtime card, room, and shared attribute data are loaded from those files.
- Malformed supported data fails with a useful validation error.
- Runtime JSON contains no design commentary.

### Implementation status

Implemented.

### History

This supersedes the prototype TXT authoring language and its parsers.

## DATA-D02 — Stable IDs are separate from display names

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Card, room, deck, Marker, Value, Reference-name/target, structured-attribute, and equipment-slot identities use stable lowercase kebab-case IDs, never player-facing names. Different masters may share the same visible name.

### Acceptance criteria

- All authored references use stable IDs.
- Display-name changes do not break references.

### Implementation status

Implemented.

## DATA-D03 — Authored-data ownership is separated by responsibility

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

`cards.json` owns card identity, starting state, approved structured attributes, Actions, Processes, References, and card-owned behavior. `rooms.json` owns world composition, Nadir/equipment/opening state, card instances, Search decks, routes through their instances, and instance overrides. `attributes.json` owns player-facing shared attribute metadata. A room entry must not define card behavior merely because an instance is placed there.

### Acceptance criteria

- Validation and loaders preserve these ownership boundaries.
- React components do not duplicate authored masters or world composition.

### Implementation status

Implemented for the current JSON model; future additions must preserve the boundary.

## DATA-D04 — Actions require explicit duration

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Every executable Action resolves an explicit duration. There is no implicit or default duration. Duration may be authored on the Action or supplied by an approved structured triggering attribute such as `path.time`.

### Acceptance criteria

- Validation rejects an executable Action whose duration cannot be resolved.
- All Action paths use the resolved explicit duration.
- No code supplies a silent default.

### Implementation status

Partially implemented. Existing Search and travel paths have durations, but the common Action model does not yet enforce the rule.

## DATA-D05 — JSON schema cannot be invented

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Codex and ChatGPT must not invent JSON fields, object shapes, wrappers, array shapes, or special-purpose authored datatypes. If an approved requirement cannot be represented by the approved schema, work stops and the missing decision is recorded as a `QUESTION FOR SIMON` task. Old or stale documentation is not permission to add schema.

### Acceptance criteria

- Every schema change has explicit Simon approval recorded in this backlog.
- Unrepresentable requirements create questions rather than speculative data structures.

### Implementation status

Implemented as repository policy; enforcement is ongoing.

## DATA-D06 — References use the approved mapping representation

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Card References are authored exactly as an object mapping a reference name to a stable target ID:

```json
"references": { "<reference name>": "<reference target id>" }
```

Non-Hand equipment compatibility uses the existing relation name `equip`, for example `"references": { "equip": "chest" }`.

### Acceptance criteria

- Card validation accepts the mapping representation and validates known target IDs.
- Non-Hand equipment reads `references.equip`.
- Legacy alternate equipment/reference fields are rejected after migration.

### Implementation status

Not implemented. Current data and code still use legacy equipment fields.

## DATA-07 — Validate and complete the approved JSON migration

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The runtime model must validate the concrete approved schema, including unique IDs, references, Action match cardinality, structured attributes, Markers, Values, instance overrides, room contents, and Search entries. Migration must remove legacy representations only after all current content has an approved equivalent.

### Acceptance criteria

- Focused tests cover valid and malformed authored data.
- Unknown references and duplicate IDs fail clearly.
- Legacy `accept`, size, storage, and equipment representations are removed when their approved replacements are implemented.
- Card masters and world composition continue to originate from authored JSON rather than TypeScript constants.
- Invalid authored data fails startup rather than falling back to a legacy format.

### Implementation status

Partially implemented. Strict JSON loading exists, but the next Action/equipment representations and validation remain outstanding.

## DATA-08 — Approve the concrete Action and structured-attribute JSON shapes

Priority: P0
Decision: QUESTION FOR SIMON
Origin: ChatGPT

### Question

What exact JSON object shapes represent `actions`, `on`/`receive` triggers, requirements, effect targets, and the payloads for `path`, `food`, and `hydration`? Their ownership and runtime semantics are approved, but the former Action/Process document explicitly labelled its JSON examples conceptual and said the exact layout could evolve. The current runtime only has the superseded `accept` structure. DATA-D05 therefore prevents Codex from choosing a target shape during implementation without explicit approval.

### Implementation status

Blocked on an exact schema decision. This does not reopen the approved semantics in ACTION-D01 through ACTION-D04.

## NADIR-D01 — Body, Mind, and Spirit are persistent Nadir cards

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

There is no generic Nadir card. Nadir is represented by persistent anchored Inventory cards: Body for physical state, Mind for perception/cognition, and Spirit for emotional/spiritual state. Body starts with Hydration 50 and Satiation 50; Mind starts with Vision 4. During Opening these three cards and the main survival simulation are hidden or unavailable, becoming available on entering Tunnels.

### Acceptance criteria

- A new game creates exactly one persistent Body, Mind, and Spirit.
- They survive room transitions with their instance state intact.
- They are not available during Opening and appear when the main simulation starts.
- Their approved initial Values come from authored data/world setup.

### Implementation status

Implemented, including Opening phase visibility.

## CARD-D01 — Card masters and instances are separate

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A master defines stable identity, starting state, and authored behavior. Every spawned card is an independent instance with its own identity, state, and position. A material identity change uses visible discard plus draw replacement rather than mutating the master ID in place. `discard` means a card ceases to exist in play; `remove` is reserved for removing an attribute from an instance that remains in play, such as removing `contains-water` after drinking.

### Acceptance criteria

- Multiple instances of one master can diverge independently.
- Room persistence retains exact instance identity and state.
- Material transformations replace instances rather than changing master identity.

### Implementation status

Implemented for current spawning and persistence; general transformation execution is not yet implemented.

## CARD-D02 — Player-facing state is readable on cards

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Visible Markers and Values carry routine gameplay state. A Marker is conceptually icon-only; a Value is icon plus integer. Visible Values use `0..100` unless a concrete Value explicitly defines otherwise.

Hidden Values may exist for concrete internal card mechanics. They use stable IDs, belong to individual instances, clone master starting state, may receive instance overrides, and may be referenced by Actions, Processes, and conditions. They do not require player-facing metadata and do not automatically appear on cards, in inspection, or in previews. They must not conceal information needed for ordinary survival decisions; SURV-02 separately prohibits unapproved hidden character-survival accumulators.

### Acceptance criteria

- Markers and Values remain visually distinguishable.
- Known routine consequences are visible or previewed before commitment where specified.
- Hidden Values remain instance state and do not leak into player-facing attribute lists.
- Hidden state is introduced only by an approved detailed task.

### Implementation status

Implemented for current visible attributes; no general Hidden Value model exists.

## CARD-D03 — Stack is Room-only presentation

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Stack is visual compression, not gameplay state, and has no Marker. Only Room cards may Stack. Eligible cards have the same master ID, the same current Marker set, and no visible Values. Underlying cards remain separate instances. Dragging a Stack peels one instance.

### Acceptance criteria

- Inventory never uses Stack presentation.
- Eligibility uses current instance state, not only master identity.
- A drag moves one instance and leaves the remainder intact.
- Stacking does not alter rules, time, or card state.

### Implementation status

Implemented in the current interface. Hidden Value eligibility remains CARD-07.

### History

This replaces earlier loose grouping behavior and confirms that no Stack Marker exists.

## CARD-D04 — Item size uses Markers

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Size is not a separate field or structured attribute. A size-based carried item has exactly one Marker: `small`, `medium`, or `large`.

### Acceptance criteria

- Authored size is represented only by the three approved Markers.
- Capacity rules read current Markers.
- Validation rejects multiple size Markers on one size-based item.

### Implementation status

Not implemented; current data uses a legacy size field.

## CARD-D05 — Storage capacity uses Values

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Storage capacity is represented by `storage-small`, `storage-medium`, and `storage-large` Values, not a separate storage object. Pants provide `storage-small = 2`. Simple Backpack provides `storage-medium = 5`. Only equipped gear contributes its storage Values, including during Opening.

### Acceptance criteria

- Capacity is derived from Values on active equipped instances.
- Pants and Simple Backpack supply the approved capacities.
- Carried or Room storage gear supplies no capacity.
- Opening applies equipped Backpack storage without changing its separate five-offer limit.

### Implementation status

Not implemented in the approved representation; equivalent legacy behavior exists.

## CARD-06 — Anchored movement and ordinary placement

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Anchored is attribute-driven. An Anchored card may move within its home zone and cross a boundary while being dragged, including for a legal interaction, but may not come to rest as ordinary placement outside its home zone. Ordinary placement must remain within zone bounds and may not overlap another card. An invalid release restores the exact drag-origin position; no nearby fallback is chosen. Free movement has no time or noise cost.

### Acceptance criteria

- Anchored cards can cross boundaries during a drag but snap to exact origin after an illegal foreign-zone release.
- Valid source/target Actions are checked before overlap rejection.
- Invalid card-on-card and out-of-bounds drops change no game state.
- Legal ordinary drops preserve consistent zone coordinates without click/release drift.

### Implementation status

Implemented for the current interaction model.

## CARD-07 — Hidden Values, bounds, and Stack eligibility

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Should Hidden Values affect Stack eligibility, and what generic bounds or clamping rules, if any, apply to visible or hidden Values beyond explicitly authored bounds? Current Stack eligibility intentionally excludes visible Values; no universal hidden-state or clamping rule is approved.

### Implementation status

Not implemented beyond the existing explicit `0..100` Value behavior where already authored.

## ACTION-D01 — Card-on-card roles and Action matching

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

For drag/drop, the dragged card is `accepted` and the card underneath is `received`. An `on` Action belongs to accepted and matches received. A `receive` Action belongs to received and matches accepted. Approved selectors may match card IDs, Markers, approved structured-attribute presence, or conjunctions of those. Zero matches means no Action; exactly one executes; two or more is invalid authored data and must be protected in validation and runtime.

### Acceptance criteria

- Highlight, preview, and commit use the same Action-matching result.
- Both `on` and `receive` directions work with the approved roles.
- Overlapping match domains fail validation where detectable and never choose silently at runtime.
- An invalid match count leaves state unchanged.

### Implementation status

Not implemented. The current interaction engine uses the legacy `accept` model.

## ACTION-D02 — Generic physical Actions belong on Body

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Current generic Body Actions are Travel, Eat, and Drink. Body dropped on a card with `path` performs Travel. Body receives a card with `food` to Eat. Body receives a card with `contains-water` and the `hydration` payload to Drink. Triggering objects own their eligibility, data, and concrete effects; Body must not contain item-name lists.

### Acceptance criteria

- Newly authored food, water containers, and routes work without adding master-name conditionals to code or Body.
- Body owns the generic Action while the object supplies its payload.
- Nonmatching movable cards do not become legal targets merely because they can be moved.

### Implementation status

Not implemented in the approved Action model. Authored eating works through legacy interaction data.

## ACTION-D03 — Approved structured Action attributes

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The currently approved structured attributes are only `path`, `food`, and `hydration`. `path` owns destination and base travel time; those facts are not duplicated in room composition, a route-specific Travel Action, or a separate `go` effect. `food` owns the concrete eating effect and consumption behavior without duplicating the same sustenance amount in another property. `hydration` owns the concrete drinking payload. `contains-water` remains the mutable Marker indicating a container currently holds water and remains part of the Drink trigger; drinking removes that Marker while the refillable card's hydration payload may remain.

### Acceptance criteria

- The three approved structures are validated and executed without card-name special cases.
- Food migration preserves the concrete effects owned by FOOD-01.
- A filled container gains `contains-water`; drinking eligibility requires it.
- No additional structured attribute is introduced without an approved backlog task.

### Implementation status

Not implemented. Current data uses legacy interaction and path representations.

## ACTION-D04 — Actions execute atomically

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Only one Action executes at a time. Effect targets in card-on-card Actions use the stable roles `accepted` and `received`. Time and Process consequences resolve through TIME-D01 and PROCESS-D01; normal Action effects resolve once on completion rather than once per tick. An unsupported or invalid Action must not partially advance time, discard a card, or mutate Values, Markers, rooms, decks, or positions. An explicitly authored `0m` Action starts and completes at the same world time and crosses no tick.

### Acceptance criteria

- A pure planning/validation step establishes one legal complete Action before mutation.
- Completion applies the Action as one state transition.
- Failure leaves the pre-Action state unchanged.
- Preview calculations share effect rules with committed results.

### Implementation status

Not implemented as a common executor; current interactions, Search, and travel use separate paths.

## FOOD-01 — Authored food effects and consumption

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Rat Meat is edible by Body, applies Satiation +15 to Body, and is discarded after completion. Canned Food is edible by Body, applies Satiation +25, and is discarded after completion. The resulting Satiation clamps at 100. These effects belong to each card's `food` payload under ACTION-D03; there is no required ingestible Marker and no card-name branch in game rules.

### Acceptance criteria

- Body recognizes both foods through the generic Eat Action.
- Preview and commit use the same bounded effect calculation, including `67 → 82`, `67 → 92`, and `90 → 100` where applicable.
- Successful eating updates Body once and visibly consumes the accepted food instance.
- A non-food card cannot be eaten and an invalid attempt changes no state.

### Implementation status

Implemented through legacy authored interactions. Migration to the approved `food` payload/common Action executor remains part of ACTION-D01 through ACTION-D04.

## ACTION-05 — Direct interactions commit without a chooser

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Gameplay interactions are source-on-target. At most one Action may match a pair. A legal drop commits immediately without a chooser or confirmation dialog. Invalid drops do not mutate state and restore the accepted card to its exact drag origin when applicable.

### Acceptance criteria

- Legal interactions commit on release.
- No chooser or confirmation is shown.
- Invalid overlap restores exact origin.

### Implementation status

Implemented in the current drag model; it must be preserved through ACTION-D01 migration.

## TIME-D01 — Only Actions advance centralized world time

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Only Actions advance elapsed world time. Card movement, equipment changes, Inventory organization, and Stack operations are free. Every time-consuming Action uses one centralized time-advance mechanism so crossed global ticks and completion order are consistent.

### Acceptance criteria

- Search, travel, and future Actions use one time transition.
- Free organization never changes elapsed time.
- Elapsed time persists across room changes.

### Implementation status

Partially implemented. Elapsed time is central state, but Search and travel currently increment it through separate legacy paths.

## PROCESS-D01 — Processes use global quarter-hour ticks

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Processes have no private timers, intervals, or durations. Each active Process runs once for every world-time boundary crossed at `:00`, `:15`, `:30`, and `:45`. If an Action completes exactly on a boundary, tick and Process consequences resolve first, then Action completion effects. Many Processes may be active while only one Action runs. JSON ordering must not become gameplay ordering. Finite or staged Processes use card state, effects, conditions, and thresholds rather than private clocks.

### Acceptance criteria

- Advancing across multiple boundaries runs every active Process once per boundary.
- Exact-boundary tests prove Process-before-completion order.
- Tick counts satisfy `floor(newElapsedMinutes / 15) - floor(oldElapsedMinutes / 15)`: 10→14 gives 0, 10→16 gives 1, 14→31 gives 2, 44→61 gives 2, and a 0-minute Action gives 0.
- Process-authored data contains no per-Process interval field.
- Inactive rooms remain in world state so future room-local Processes can continue without being architecturally erased.

### Implementation status

Not implemented.

## PROCESS-D02 — Body drains Hydration and Satiation on every tick

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

At each global quarter-hour tick, Body receives Hydration -2 and Satiation -1. Hydration reaching 0 causes game over. Satiation-at-zero behavior is owned by SURV-03 and must not be inferred.

### Acceptance criteria

- Every crossed tick applies both changes exactly once.
- Value changes obey their approved bounds.
- Hydration 0 exposes game-over state.
- Opening does not run the main survival simulation before transition to Tunnels.

### Implementation status

Not implemented.

## PROCESS-02 — Resolve unfinished Process behavior

Priority: P1
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What are the remaining concrete rules for cooking, wound healing/recovery presentation, Fever recovery, spoilage, and similar Processes? How do conflicting simultaneous effects resolve, what happens when an Action or Process is interrupted/cancelled, and what label should represent wound progress? Approved wound behavior already recorded in WOUND-01 should not be reopened accidentally, but unfinished values and transitions must not be invented.

### Implementation status

Not implemented beyond isolated existing prototypes.

## SURV-01 — Decide additional permanent survival pressures

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Are any permanent survival pressures needed beyond the approved Hydration and Satiation behavior? A new bar, Value, or hidden accumulator should exist only if it creates a distinct player decision that current cards and conditions cannot express.

## SURV-02 — Conditions remain visible, bounded state

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Survival state should be expressed through visible Values on Body or separate persistent condition cards when a condition has its own identity and lifecycle. Do not introduce a generic Health resource or hidden accumulators as a substitute for a concrete mechanic. Ordinary Values use authored bounds; current Body survival Values use `0..100` and changes clamp to those bounds.

### Acceptance criteria

- Current survival state is legible from Nadir cards and conditions.
- Effects share the same bounded calculation for preview and commit.
- New permanent state requires an approved task.

### Implementation status

Partially implemented for Body Values and previews.

## SURV-03 — Decide Satiation-at-zero behavior

Priority: P1
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What happens when Satiation reaches 0? Hydration 0 is approved as game over, but no corresponding Satiation rule is approved.

## DURABILITY-01 — Decide tool Durability

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Which tools use Durability, what are their starting Values and wear rates, and what happens at 0? Do not implement generic wear or breakage until these choices are made.

## WOUND-01 — Current wound treatment and healing model

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A Flesh Wound is a persistent condition card with healing progress and Infection state. Dressing it requires one source card carrying both `fabric` and `sterilized`. The Dress Action takes 15 minutes, consumes that source card at completion, and adds `dressed` to the wound.

On each global tick, Flesh Wound healing progress changes by its current Infection band: below 25 gives +2; 25–49 gives +1; 50–75 gives 0; above 75 gives -1. The Flesh Wound is discarded when healing progress reaches 100. The final player-facing name of that progress Value is unresolved in PROCESS-02.

Card replacement uses the common discard/draw vocabulary from CARD-D01; simple state changes remain on the instance.

### Acceptance criteria

- All timings use the common Action/time path.
- Dressing requires the conjunction of both approved Markers and never accepts unsterilized Fabric.
- Treatment legality and effects come from authored state, not card-name branches.
- Healing runs only on crossed global ticks and uses the current Infection band once per tick.
- Reaching healing progress 100 visibly discards the wound.

### Implementation status

Not implemented as an integrated system. Legacy JSON currently also contains starting Infection and water-cleaning behavior whose explicit approval could not be established; this consolidation does not approve them. Those and other remaining wound questions belong to PROCESS-02.

## EQUIP-D01 — Persistent equipment slots

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The equipment interface contains Left Hand, Right Hand, Head, Eyes, Trinket 1, Trinket 2, Chest, Back, Legs, and Feet. Slots are persistent interface positions/indentations, not cards. Neck is obsolete and must not return.

### Acceptance criteria

- All ten approved slots are visible and persistent.
- Trinket 1 and Trinket 2 are distinct slots.
- No Neck slot exists.
- Equipped instances survive room changes.

### Implementation status

Implemented, including both Trinket slots.

## EQUIP-D02 — Non-Hand compatibility uses references.equip

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Non-Hand compatibility is read from the approved Reference mapping under `references.equip`. Examples include T-Shirt to `chest`, Pants to `legs`, Glasses to `eyes`, and Simple Backpack to `back`. Ordinary movable cards may use either Hand through the universal Hand rule and do not need Left/Right compatibility references. Anchored world cards and Nadir-state cards may not be held. This Hand rule does not imply that every tool must be held before it can be used; such a requirement needs its own explicit decision.

### Acceptance criteria

- Slot legality uses `references.equip` for every non-Hand slot.
- Either Hand accepts any ordinary movable card.
- Anchored and Nadir cards are rejected from Hands.
- Legacy equipment fields are removed after data migration.

### Implementation status

Not implemented in the approved representation; equivalent slot behavior currently reads legacy fields.

## EQUIP-03 — Equipped state controls active effects

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A compatible card in an equipment slot is equipped and active. The same card in flat carried Inventory or a Room is inactive. Equipping and unequipping are free. Glasses in Eyes provide Vision +1. Flashlight in either Hand provides Vision +1 only with Battery > 0. Pants in Legs and Simple Backpack in Back provide the storage Values in CARD-D05. Cards in any equipment slot, including Hands, consume no carried capacity.

### Acceptance criteria

- Moving equipment between its slot and Inventory immediately changes its active effects without advancing time.
- Carried or Room equipment provides no effect.
- Active effects persist through room transitions.

### Implementation status

Implemented through legacy authored representations; migration must preserve behavior.

## INV-D01 — Flat carried Inventory uses size/capacity allocation

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

There is no permanent generic five-card Inventory limit and no nested pocket/backpack UI. Carried Inventory is a flat card area. A small capacity accepts only `small`; medium accepts `small` or `medium`; large accepts all three. Allocate carried items to the smallest compatible capacity first. Equipped cards, including Hands, do not consume capacity. Display current/max totals for Small, Medium, and Large.

### Acceptance criteria

- A pure allocation rule determines whether the full carried set fits.
- Removing active storage can succeed only when the resulting carried set still fits or the UI supplies an approved resolution path.
- The display derives from the same capacity/allocation calculation as placement legality.
- No carried card is visually assigned to a particular pocket or container.

### Implementation status

Partially implemented with legacy size/storage fields. Approved Marker/Value migration remains.

## EQUIP-04 — Resolve remaining equipment design

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Which cards can use Trinket slots and what effects do they have? Do any equipment changes later consume time, do any items occupy multiple slots, and how should the player resolve unequipping capacity-providing gear when carried items no longer fit? Final capacity-supplier presentation and any equipment effects beyond those in EQUIP-03 also remain undecided. Potential progression domains recorded in the earlier equipment note include storage, protection, warmth, access, visibility, concealment, comfort, and mood, but no concrete mechanic is implied by that list.

## OPENING-01 — Opening evacuation and offered-item limit

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The special authored Opening room starts with Pants equipped in Legs and T-Shirt equipped in Chest; both Hands, Back, Eyes, Head, Trinket 1, Trinket 2, and Feet are empty, so Nadir is barefoot. Body, Mind, Spirit, and survival simulation are unavailable until Tunnels. The offered instances are exactly: Pocket Knife; two Plastic Bottles, each with `contains-water`; two Canned Food; Simple Lighter with Fuel 50; Flashlight with Battery 20; Spare Batteries; Pain Killers; Simple Backpack; Glasses.

The player may take at most five offered instances. An offered item counts whether carried, held, or equipped. Already-worn Pants and T-Shirt do not count. Equipped Simple Backpack storage is active immediately but does not raise the five-offer limit. There is no real-time countdown. Choosing Escape transitions to Tunnels, begins the main simulation, and does not require a return route in the current slice.

### Acceptance criteria

- Authored opening setup and exact offer list load from room/world data.
- The sixth offered instance is rejected across carried and equipped locations.
- Worn starting clothes are excluded from the selection count.
- Backpack capacity works during Opening.
- Escape persists selected/equipped items and reveals the persistent Nadir state in Tunnels.

### Implementation status

Implemented, including Nadir hiding, both Trinket slots, and Opening storage activity.

## OPENING-02 — Resolve later Opening presentation and fiction

Priority: P3
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What is the final name/identity and narrative presentation of the Opening location, may it ever be revisited, and are the current offer quantities final beyond this prototype slice? Pain Killers, the clothing Values/effects, and final evacuation messaging need concrete mechanics before expansion.

## VISION-01 — Effective Vision controls Search and travel time

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Mind has base Vision 4. Active equipment modifiers are Glasses in Eyes +1 and Flashlight in a Hand with Battery > 0 +1. Room light modifiers are Bright 0, Dim -1, Twilight -3, and Darkness -4. Effective Vision is the sum.

For current Search and travel tasks:

- Vision 0 or lower: Search is impossible; travel takes 3× base time and leaving remains possible.
- Vision 1: Search takes 3× and travel takes 2×.
- Vision 2: Search takes 2× and travel takes normal time.
- Vision 3 or higher: Search and travel take normal time.

The broader task vocabulary is: low-light tasks require Vision 2, normal-light tasks require Vision 3, and precision tasks require Vision 4. It exists to classify concrete future work, not to invent unrelated crafting. Approved examples are low-light—ripping cloth, making wood shavings, knife sharpening, spear practice, and fire starting; normal-light—cooking and stone throwing; precision—sewing. Opening is Bright, Tunnels Dim, Abandoned Office Bright, and Deep Tunnels Twilight. At Vision 0 or lower, leaving the room is the only currently available activity. Room presentation is derived from light state; artwork itself must not encode mechanically authoritative light. Deep Tunnels is a soft efficiency challenge, not Flashlight-gated.

### Acceptance criteria

- Pure rules calculate equipment modifiers, room modifier, effective Vision, legality, and duration multiplier.
- Search and travel use the same effective Vision result.
- Deep Tunnels can be entered without Glasses or Flashlight at the approved penalty.
- Background treatment changes with authored light state without replacing room artwork.

### Implementation status

Implemented for Search, travel, active equipment, and current room presentation.

## VISION-02 — Resolve extended lighting and task behavior

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Does Vision above 4 produce any benefit? How should daylight, moving versus stationary light, smoke/obscurement, local light sources, and their presentation work? Which future Actions belong to low-light, normal-light, or precision classes must be decided with those Actions rather than inferred now.

## FLASHLIGHT-D01 — Flashlight activity and initial Battery

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The Opening Flashlight starts with Battery 20. The Deep Tunnels Search Flashlight starts with Battery 0. A Flashlight is switched on and grants Vision +1 only when equipped in either Hand and Battery > 0. In Inventory or a Room it is inactive, grants no Vision, and drains no Battery.

### Acceptance criteria

- The two authored instances receive their approved starting Battery overrides.
- Hand/equipment state and Battery jointly determine the modifier.
- Carried and Room Flashlights remain inactive.
- Battery drain is isolated behind FLASHLIGHT-01 and is not guessed.

### Implementation status

Implemented except numerical drain, which is intentionally unresolved.

## FLASHLIGHT-01 — Decide Flashlight Battery drain

Priority: P1
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

At what rate and event boundaries does an active Flashlight lose Battery, and what exactly happens when Battery reaches 0 during an Action? Until decided, the Flashlight has no numerical depletion.

## TORCH-01 — Lit Torch is a temporary Vision source

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A lit Torch grants Vision +1 while active and is discarded when its burn state expires. A lit Lighter does not provide Vision.

### Acceptance criteria

- Torch Vision uses the same equipment/light calculation as other sources.
- Burnout visibly discards the Torch through the common Process/card-animation rules.
- Lighter never contributes Vision merely because it is lit.

### Implementation status

Not implemented; recipe and duration are unresolved in TORCH-02.

## TORCH-02 — Decide Torch recipe, heat, and burn duration

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What is the Torch recipe, what ignites it, how long does it burn, and does it act as a heat source for cooking or other systems? Do not infer these details from the approved Vision effect.

## WATER-D01 — Puddle filling and finite Water

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Puddle of Water is Anchored and begins with Water 3. A valid empty container has `container` and lacks `contains-water`. A successful fill adds `contains-water` to that container, reduces Puddle Water by 1, and visibly discards/exhausts the Puddle when Water reaches 0. `contains-water` remains part of the generic Drink trigger with `hydration`. Fill is an Action and cannot execute until WATER-01 supplies its duration.

### Acceptance criteria

- Eligibility, preview, and completion use attributes rather than master-name cases.
- Each completed fill changes exactly one container and decrements Water exactly once.
- A Puddle at 0 cannot fill again and leaves play according to the discard rule.
- No free or zero-minute fallback exists while duration is unresolved.

### Implementation status

Partially implemented. Puddle Water 3, container state, and depletion rules exist, but filling is correctly blocked pending WATER-01.

### History

This supersedes an older Milestone 2 direct/free filling prototype.

## WATER-01 — Decide Puddle fill duration

Priority: P0
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

How many minutes does filling a valid empty container from a Puddle take? This blocks the Action; no implicit, zero-minute, or direct interaction duration may be introduced.

## ROOM-01 — Persistent authored rooms and world state

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The current persistent rooms are Tunnels, Abandoned Office, and Deep Tunnels; Opening is a special introductory location. Their current background assets are `images/opening-room-background.jpg`, `images/tunnels-background.jpg`, `images/abandoned-office-background.jpg`, and `images/deep-tunnels-background.jpg`. Backgrounds provide identity and atmosphere only; mechanically meaningful state remains in authored game state rather than baked into artwork. Each persistent room owns authored background, light, local card instances, local Search object/deck, and persistent card identity/state/position, including current Markers, Values, References, and exact position. Inactive rooms remain in world state. Travel switches the visible room while Nadir state, equipment, carried Inventory, elapsed time, and every room's exact state persist.

### Acceptance criteria

- World composition comes from `rooms.json` rather than React constants.
- Leaving and returning restores exact room instance/deck state and positions.
- Inactive rooms are not recreated or discarded.
- Public assets resolve through the Vite base path; current Search artwork uses the existing `.jpg` asset.

### Implementation status

Implemented for the current room slice.

## ROOM-02 — Routes travel through the common Action model

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Navigation cards are ordinary room-local Anchored cards carrying approved `path` data. Dropping Body on one invokes Body's generic Travel Action. Current routes are Tunnels to Abandoned Office 15 minutes, Abandoned Office to Tunnels 15 minutes, Tunnels to Deep Tunnels 30 minutes, and Deep Tunnels to Tunnels 30 minutes. The two outbound Tunnels routes begin inside its Search deck and become visible navigation cards only when drawn. Vision modifies duration through VISION-01; there is no special Flashlight requirement.

### Acceptance criteria

- Destination and base time come from `path`, not component conditionals.
- Travel uses ACTION-D01 through ACTION-D04 and centralized time.
- Discovered route cards remain in their room with exact identity and position.
- Arrival preserves all world and Nadir state.

### Implementation status

Partially implemented through a legacy travel path; migration to the common Action system remains.

## ROOM-03 — Resolve future rooms, routes, and room objects

Priority: P3
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What future rooms/routes and final deck compositions should exist, and should Opening gain a return path? Day/night behavior and mechanics for Pipe, Squatter, Service Cabinet, Puddle-related environment presentation, and placeholder discoveries are not decided by their presence or names and must not be invented.

## SEARCH-01 — Search decks are persistent room-local objects

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A Search deck is a clicked room-local interactive object, not a card, and does not inherit card rules such as Anchored, Stack, inspection, or discard. Every deck, including undiscovered-room decks, is shuffled exactly once when a new game starts; its hidden finite order persists and never rerolls between draws. It uses the shared full-face `images/search-back.jpg`, shows no remaining count, and disappears immediately when exhausted. Searching is a base 15-minute Action modified by VISION-01; at Vision 0 or lower it is unavailable.

Current authored compositions are:

- Tunnels Explore: Scrap Metal ×2; Pipe ×1; Squatter ×1; Dead Rat ×1; empty Plastic Bottle ×1; Puddle of Water with Water 3 ×1; Deep Tunnels route ×1; Abandoned Office route ×1; locked Service Cabinet ×1.
- Abandoned Office: ten Placeholder cards.
- Deep Tunnels: one Flashlight with Battery 0 and nine Placeholder cards.

No mechanics are implied for Squatter, Pipe, Service Cabinet, Puddle beyond WATER-D01, or Placeholder cards.

### Acceptance criteria

- A controlled RNG proves deterministic one-time shuffle and stable hidden order.
- Each completed Search advances centralized time, draws exactly one instance, and depletes exactly one entry.
- Undiscovered room decks are shuffled at new-game creation.
- Exhausted decks become unavailable and are removed from presentation.

### Implementation status

Implemented for the current slice through a dedicated Search transition; common Action/time integration remains.

### History

The current focused Explore/room decisions replace the older temporary Tunnels placeholder composition. A historical note named `images/search-back.png`; the real checked-in asset and current authored room data use `images/search-back.jpg`, so the active reference follows the existing asset without conversion or rename.

## SEARCH-02 — Search draws animate into legal Room placement

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

After Search resolves, the drawn card visibly travels outward from the deck and lands in the nearest legal free Room position beside it, within bounds and without overlap. The Search object itself uses the same face-down artwork in every room. Exhausted-deck disappearance is an explicit provisional exception and has no animation.

### Acceptance criteria

- The draw result is visibly traceable from deck to final position.
- Placement remains within Room bounds and avoids cards/objects.
- Failure to find space terminates safely rather than looping forever.
- The final position becomes persistent room state.

### Implementation status

Implemented for the current slice.

## SEARCH-03 — Resolve later Search behavior and content

Priority: P3
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Can cards ever return to a Search deck, is immediate exhausted-deck disappearance final, and what are the final non-placeholder compositions? Exact animation style, easing, and timing are presentation tuning owned with UI-05, not implied mechanics.

## UI-01 — Drag feedback communicates exact current legality

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

While dragging, every legal card receiver is green before hover. An ordinary legal receiver under the release pointer is yellow. An incompatible card under the pointer is red. A Stack remains green when hovered. Known direct stat previews appear immediately when dragging begins, not only after hover, and sit on or next to the affected attribute; if one understood interaction has several direct effects, all are shown. Ordinary zone placement gets subtle feedback only when the current release position is legal; zone feedback is suppressed while the pointer is over a card. Highlight, preview, and commit share the same legality/effect calculation. Danger/risk presentation is separate from these legality colors; a dangerous but legal interaction remains visibly legal.

### Acceptance criteria

- Only genuine Action targets receive legal highlighting.
- Hover colors follow the approved receiver and Stack distinctions.
- Invalid overlapping targets never look release-ready and restore exact origin on release.
- Previews show exact bounded before/after Values and cannot disagree with commit.
- Bare-zone feedback reflects bounds, overlap, Anchored, storage, and Opening-limit legality.

### Implementation status

Implemented for the current legacy interaction model; it must remain intact during Action migration.

## UI-02 — Mouse-following card inspection

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

When the pointer rests on a card and no drag is active, a tooltip follows the mouse, remains inside the viewport, and shows the card description followed by a paragraph for each visible attribute. Card descriptions come from `cards.json`; shared attribute descriptions come from `attributes.json`. Any missing description displays exactly `missing description`. The tooltip disappears during dragging.

### Acceptance criteria

- Tooltip content tracks current visible instance attributes.
- Missing descriptions use the exact fallback text.
- Tooltip never obstructs dragging and remains viewport-contained.

### Implementation status

Implemented.

## UI-03 — Visible card draw and discard transitions

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Ordinary card draws and discards must be visible transitions so instance changes are understandable. Search uses SEARCH-02. Eating, wound completion, depletion, transformations, and other ordinary discards should not silently remove a card. Exhausted Search-object disappearance is the current provisional exception and remains immediate.

### Acceptance criteria

- A player can visually associate the source event with the drawn or discarded card.
- State commits once even if animation is interrupted by rendering.
- Accessibility/reduced-motion treatment preserves meaning.

### Implementation status

Partially implemented. Search draw and current consumption/depletion transitions exist; a shared ordinary discard path is incomplete.

## UI-04 — Stable card, equipment, and zone geometry

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The application fills the viewport. Room occupies the upper two-thirds and Inventory the lower third, separated by a restrained horizontal divider. Card width remains stable while height accommodates square artwork without cropping. Equipment indentations, card contents, light overlays, room backgrounds, and labels remain legible without becoming final visual identity. Room zoom uses practical bounded controls around the Room center and affects only card positions/sizes; there is no panning, and background, Inventory, and general UI do not move or scale. One consistent zone-coordinate geometry prevents inventory cards shifting on click/release and supports collision, reflow, and exact-origin restoration.

### Acceptance criteria

- Clicking/releasing an unmoved card leaves its position pixel-stable.
- Square artwork is fully visible at the existing card width.
- Equipment and Inventory layouts remain usable across supported viewport sizes.
- Room-only zoom leaves background and Inventory unchanged.
- Existing real artwork loads through configured public/base paths, with a clear fallback only for missing assets.

### Implementation status

Implemented and polished in the current branch.

## UI-05 — Decide final animation timing and style

Priority: P3
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What final durations, easing, trajectories, and discard visual language should ordinary draw/discard animations use? Current prototype timing is implementation evidence, not a permanent design decision.

## DEPLOY-01 — Complete every iteration through main and GitHub Pages

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Every iteration, without exception, including documentation-only iterations, ends with its intended work integrated into `main`, present on `origin/main`, and deployed through a successful GitHub Pages workflow. The deployed Safe Room game must load and remain actively testable through basic browser verification with no obvious broken assets or runtime errors. This workflow invariant does not expand implementation scope and does not require `DEPLOY-01` to appear in `docs/next-iteration.md`. Local development must remain sensible while production assets honor the `/musical-octo-memory/` base.

### Acceptance criteria

- The intended iteration work is complete.
- Validation, automated tests, and the production build appropriate to the repository pass.
- The iteration is integrated into `main`, and `origin/main` contains the result.
- The GitHub Pages workflow installs the declared pnpm version with the lockfile, tests, builds, uploads `dist`, and deploys successfully.
- The deployed game loads at the public project URL with its real assets and without obvious runtime errors.
- Basic browser verification confirms that the current implemented behavior remains actively testable from the deployed build.

### Implementation status

Implemented as a workflow and Vite configuration for the current prototype. Every iteration must re-verify main integration and the deployed build, including documentation-only iterations.

### History

The earlier documentation-only deployment exception is superseded by Simon's decision that no iteration is complete without main integration and verified GitHub Pages deployment.
