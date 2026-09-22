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

`cards.json` owns card identity, starting state, approved structured attributes, Actions, Processes, References, card-owned behavior, and card-owned deck definitions where approved by DECK-D01. `rooms.json` owns world composition, Nadir/equipment state, card instances, Room-owned decks, routes through their instances, and instance overrides. `attributes.json` owns player-facing shared attribute metadata. A room entry must not define card behavior merely because an instance is placed there.

### Acceptance criteria

- Validation and loaders preserve these ownership boundaries.
- React components do not duplicate authored masters or world composition.

### Implementation status

Implemented for the current JSON model; future additions must preserve the boundary.

## DATA-D04 — Time-consuming Actions require explicit spend-time

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Every time-consuming Action contains or resolves an explicit `spend-time` effect in its ordered `effects` array. `spend-time` uses either a numeric constant or a Value on `self` or `other` as defined by DATA-08. There is no implicit/default time cost and no separate generic Action-duration mechanism.

### Acceptance criteria

- Validation rejects a time-consuming Action whose `spend-time` effect cannot be resolved completely before execution.
- All world-time advancement occurs through an explicit, prevalidated `spend-time` effect.
- No authored duration field or code-supplied time default bypasses `spend-time`.

### Implementation status

Implemented. Every active time-consuming path resolves an explicit `spend-time` effect through the common Action executor, and the legacy Search/travel elapsed-time mutations have been removed.

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

Implemented. Card References load through the approved mapping representation, non-Hand compatibility reads the instance's `references.equip`, known targets are validated, and legacy `equip` fields are rejected.

## DATA-07 — Validate and complete the approved JSON migration

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The runtime model must validate the concrete approved schema, including unique IDs, References, Action IDs/names, `applicable.on`/`applicable.receive`, selectors, ordered effects, Action match cardinality, Markers, Values, instance overrides, room contents, and Search entries. Migration must remove legacy representations only after all current content has an approved equivalent.

### Acceptance criteria

- Focused tests cover valid and malformed authored data.
- Unknown references and duplicate IDs fail clearly.
- Legacy `accept`, Action-duration, path, size, storage, and equipment representations are removed when their approved replacements are implemented.
- Card masters and world composition continue to originate from authored JSON rather than TypeScript constants.
- Invalid authored data fails startup rather than falling back to a legacy format.

### Implementation status

Partially implemented. Strict JSON loading and the approved Action/Marker/Value/Reference cutover are implemented, including rejection of legacy `accept`. The separately approved size, storage, and equipment migrations remain outside this iteration.

## DATA-08 — Concrete Action JSON schema

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

`actions` is an array. Every Action has a stable internal `id`, a player-facing `name`, one `applicable` object, and an ordered `effects` array:

```json
"actions": [
  {
    "id": "eat",
    "name": "Eat",
    "applicable": {
      "receive": { "target": "other", "marker": "food" }
    },
    "effects": []
  }
]
```

`applicable` contains exactly one of `on` or `receive`. These keys determine the relationship between the Action owner and the other card. Within the Action, `self` is always the card that owns the Action and `other` is the card or object matched by applicability. Effect targets use only `self` and `other`; `accepted` and `received` describe drag/drop roles and determine which card owns or matches an `on`/`receive` Action, but they are not effect targets.

Action applicability uses the shared condition language owned by LOGIC-D01 through LOGIC-D05 and TIME-D02. The original approved primitives are `marker`, a Value comparison, `and`, `or`, and `not`; the shared language adds the separately approved target, location-literal, count, deck-size, and world-clock semantics. Conditions must not match specific card/master IDs. `and` and `or` take arrays, `not` takes one condition, and boolean conditions may be nested. Under LOGIC-D02 an omitted target means `self`, so applicability conditions that inspect the counterpart use explicit `target: "other"`:

```json
{
  "and": [
    { "target": "other", "marker": "container" },
    { "not": { "target": "other", "marker": "contains-water" } }
  ]
}
```

A Value condition names one Value and uses exactly one of `>`, `>=`, `<`, `<=`, `=`, or `<>`. Ranges use boolean composition rather than multiple comparison operators in one condition:

```json
{
  "and": [
    { "value": "infection", ">=": 25 },
    { "value": "infection", "<": 50 }
  ]
}
```

`effects` executes from top to bottom, but the complete Action must validate before its first effect executes. An invalid Action must not partially mutate state. Generic effects support adding a Marker, removing a Marker, changing a Value, and discarding a card:

```json
{ "target": "self", "add-marker": "dressed" }
```

```json
{ "target": "other", "remove-marker": "contains-water" }
```

Value operations use exactly one of `=`, `+=`, or `-=`. The right-hand side is either a numeric constant or a Value on `self` or `other`:

```json
{ "target": "self", "value": "satiation", "+=": 25 }
```

```json
{
  "target": "self",
  "value": "satiation",
  "+=": { "target": "other", "value": "food-value" }
}
```

Discard is a generic effect:

```json
{ "target": "other", "discard": true }
```

ACTION-D05 separately owns the generic `add-random-card` effect shared by Actions and Processes. Its approved destination, random-pick, instance-creation, and deck-insertion semantics must not be duplicated or specialized here.

`set-room` is the unique world effect. It changes the active Room through a Reference on `self` or `other`:

```json
{
  "set-room": {
    "target": "other",
    "reference": "destination"
  }
}
```

`spend-time` is the unique effect that advances world time. It uses either a numeric constant or a Value on `self` or `other`:

```json
{ "spend-time": 15 }
```

```json
{
  "spend-time": {
    "target": "other",
    "value": "travel-time"
  }
}
```

There is no separate Action-duration mechanism. The position of `spend-time` in the ordered effects array determines when time passes relative to other effects. When it crosses global Process boundaries, world time advances, every crossed Process tick resolves, and only then does execution continue to the next effect. The complete Action is still prevalidated before any effect executes.

`food`, `hydration`, and `path` are Markers, not structured attributes. Their concrete data uses ordinary Values and References with these approved stable names:

- Marker `food` with Value `food-value`;
- Marker `hydration` with Value `hydration-value`;
- Marker `path` with Value `travel-time` and Reference `destination`.

Conceptually:

```json
{
  "markers": ["food"],
  "values": { "food-value": 25 }
}
```

```json
{
  "markers": ["hydration"],
  "values": { "hydration-value": 25 }
}
```

```json
{
  "markers": ["path"],
  "values": { "travel-time": 30 },
  "references": { "destination": "deep-tunnels" }
}
```

### Acceptance criteria

- Validation enforces stable Action IDs, player-facing names, exactly one applicability direction, the approved selector primitives/operators, and ordered effect shapes.
- Selectors cannot reference specific card/master IDs and Value selectors contain exactly one comparison operator.
- All Action effect targets resolve as `self` or `other`; legacy `accepted`/`received` effect targets are rejected.
- The complete Action validates before execution, and effects then execute in authored order without partial mutation from an invalid Action.
- Generic Marker, Value, discard, `set-room`, `spend-time`, and ACTION-D05 `add-random-card` effects support exactly their approved operand forms.
- `food`, `hydration`, and `path` migrate to the approved Marker/Value/Reference representation without special card-name logic.
- `spend-time` resolves crossed Process ticks before the following ordered effect.

### Implementation status

Partially implemented. Strict authored-data validation, typed loading, the original selector subset, common prevalidation/execution, and focused malformed-data coverage exist. The shared evaluator, explicit/default condition targets, logical literals, count, deck-size conditions, world-clock conditions, Value visibility, and random deck-insertion effect remain unimplemented under LOGIC-D01 through LOGIC-D05, TIME-D02, DATA-10, and ACTION-D05.

## DATA-09 — Card gameplay data is authored as attributes

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

All gameplay-relevant information belonging to a card must be represented in authored card attributes. Approved card attribute categories include the existing Markers, Values, References, Actions, and Processes. Runtime code may define the generic meaning and behavior of attribute types, but it must not define data that belongs to an individual card or master.

Examples include Flashlight and Canned Food size coming from their size Markers, Pants storage coming from `storage-small`, Simple Backpack storage coming from `storage-medium`, equipment compatibility coming from `references.equip`, food quantity coming from `food-value`, hydration quantity coming from `hydration-value`, and route travel time/destination coming from authored Values and References.

Runtime code must not branch on card master IDs or display names to supply gameplay facts, use lookup tables mapping cards to size or equipment slots, keep hidden storage metadata outside ordinary Values, or provide fallback/default gameplay values when required authored attributes are missing. If required authored card data is missing or malformed, validation fails rather than deriving or inventing it.

### Acceptance criteria

- No size, storage, or equipment gameplay decision depends on master ID or display name.
- No legacy size, storage, or equipment metadata remains active.
- Required authored data is validated.
- Missing required data cannot silently fall back to code-defined card properties.
- Runtime interprets attributes rather than defining card-specific facts.
- Tests prove at least two different masters with equivalent attributes behave equivalently without card-name or master-ID branches.

### Implementation status

Implemented for the selected size, storage, equipment-compatibility, and carried-Inventory domains. Runtime rules interpret current instance Markers, Values, and References without master-ID/name lookup or fallback gameplay facts. EQUIP-05 now approves generic `passives` as the replacement for the pre-existing `whileEquipped` representation; that migration remains unimplemented.

## DATA-10 — Every authored Value has explicit visibility

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Every authored Value has a mandatory `visibility` field. There is no implicit visibility default. `visibility` is exactly one of:

- `true`;
- `false`;
- a logical expression in the condition language owned by LOGIC-D01 through LOGIC-D05 and TIME-D02.

`visibility` controls only whether the Value is player-facing. It does not control whether the Value exists, whether Actions or Processes can read it, or whether effects can mutate it.

For Puddle, `water.visibility = true` and `refill.visibility = false`.

### Acceptance criteria

- Validation requires `visibility` on every authored Value and rejects an omitted or unsupported form.
- Boolean visibility is honored directly, and expression visibility is evaluated by the shared logic evaluator.
- Hidden Values remain ordinary authored instance state available to Actions, Processes, conditions, and effects.
- Puddle exposes `water` but never exposes `refill` through player-facing card, inspection, or preview presentation.

### Implementation status

Implementation-ready but not implemented. This task resolves the generic hidden-Value representation previously left open by CARD-D02 and WATER-02 without changing unrelated Value semantics.

## DATA-11 — Card presentation metadata task merged into UI-07

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Resolution

The approved optional card-master `presentation` field, its exact vocabulary, validation, gameplay separation, legacy fallback, and renderer mapping are now owned together by UI-07. This ID no longer owns standalone implementation work and must not be scheduled separately.

### Implementation status

Closed and merged into UI-07 before implementation.

## NADIR-D01 — Body, Mind, and Spirit are persistent Nadir cards

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

There is no generic Nadir card. Nadir is represented by persistent anchored Inventory cards: Body for physical state, Mind for perception/cognition, and Spirit for emotional/spiritual state. Body starts with Hydration 50 and Satiation 50; Mind starts with Vision 4. Body, Mind, Spirit, and the normal survival simulation are available from the start in Apartment under OPENING-01.

### Acceptance criteria

- A new game creates exactly one persistent Body, Mind, and Spirit.
- They survive room transitions with their instance state intact.
- They are available from the start in Apartment.
- Their approved initial Values come from authored data/world setup.

### Implementation status

Current implementation hides them during the legacy Opening phase. That behavior is superseded by OPENING-01 and must be removed when Apartment is implemented.

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

Player-facing Markers and Values carry routine gameplay state. A Marker is conceptually icon-only; a player-facing Value is icon plus integer. Player-facing Values use `0..100` unless a concrete Value explicitly defines otherwise.

Every authored Value has the explicit mandatory `visibility` owned by DATA-10. A Value that is not currently player-facing still uses a stable ID, belongs to its individual instance, clones master starting state, may receive instance overrides, and may be referenced by Actions, Processes, conditions, and effects. Visibility does not change existence or gameplay accessibility. Non-player-facing Values must not conceal information needed for ordinary survival decisions; SURV-02 separately prohibits unapproved hidden character-survival accumulators.

### Acceptance criteria

- Markers and Values remain visually distinguishable.
- Known routine consequences are visible or previewed before commitment where specified.
- Values whose DATA-10 visibility resolves false remain instance state and do not leak into player-facing attribute lists.
- Hidden state is introduced only by an approved detailed task.

### Implementation status

Implemented for current visible attributes. The mandatory DATA-10 visibility model is approved but not implemented.

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

Implemented. Every currently size-based master uses exactly one `small`, `medium`, or `large` Marker; allocation reads current instance Markers, and validation rejects multiple Markers and the legacy `size` field.

## CARD-D05 — Storage capacity uses Values

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Storage capacity is represented by `storage-small`, `storage-medium`, and `storage-large` Values, not a separate storage object. Pants provide `storage-small = 2`. Simple Backpack provides `storage-medium = 5`. Only equipped gear contributes its storage Values. Apartment uses the same ordinary equipment and capacity rules as every other Room.

### Acceptance criteria

- Capacity is derived from Values on active equipped instances.
- Pants and Simple Backpack supply the approved capacities.
- Carried or Room storage gear supplies no capacity.
- Apartment has no separate offered-item limit or capacity exception.

### Implementation status

Implemented for the current equipment calculation. Equipped Pants and Simple Backpack contribute their visible `storage-small` and `storage-medium` Values through the common capacity calculation; carried or Room storage gear contributes nothing. The legacy Opening limit is superseded by OPENING-01.

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

Should Values whose DATA-10 visibility currently resolves false affect Stack eligibility, and what generic bounds or clamping rules, if any, apply to Values beyond explicitly authored bounds? Current Stack eligibility intentionally excludes player-facing Values; no universal Stack rule for non-player-facing state or generic clamping rule is approved.

### Implementation status

Not implemented beyond the existing explicit `0..100` Value behavior where already authored.

## CARD-08 — Starting clothing exposes authored gameplay attributes

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Apartment starting clothing derives its gameplay behavior entirely from authored attributes. Pants are equipped in Legs, carry `references.equip = "legs"`, and carry Value `storage-small = 2`. T-Shirt is equipped in Chest and carries `references.equip = "chest"`. Apartment starts with Pants and T-Shirt equipped.

The Pants `storage-small = 2` Value is visible through the normal player-facing Value presentation and inspection rather than existing only as hidden runtime metadata. Equipment compatibility comes from the authored Reference. No additional clothing effects are implied.

### Acceptance criteria

- Pants authored data contains `storage-small = 2`.
- Pants authored data contains `references.equip = "legs"`.
- T-Shirt authored data contains `references.equip = "chest"`.
- Apartment starts with Pants in Legs and T-Shirt in Chest.
- Removing or equipping Pants immediately changes capacity through the same generic attribute rules used by all storage equipment.
- Pants visibly expose the `storage-small` Value through normal card attribute presentation.
- No Pants/T-Shirt master-ID-specific storage or slot logic is required.

### Implementation status

Implemented for the authored clothing attributes. Pants author visible `storage-small = 2` and `references.equip = "legs"`; T-Shirt authors `references.equip = "chest"`. The current legacy Opening equips both; Apartment must preserve that normal starting equipment state.

## CARD-09 — Card-class proposal is superseded and closed

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Safe Room does not introduce a card-class system. The proposed classes `item`, `person`, `path`, `aspect`, `feature`, `edible`, and `drinkable` are rejected as authored classification, validation contracts, or gameplay authority.

Cards are too dynamic for a class system to remain useful without creating redundant or derived state. Gameplay authority remains in authored Markers, Values, References, Actions, and Processes. `anchored` remains explicit authored gameplay data.

### Acceptance criteria

- No card class field or class registry is added to authored data.
- Validation and runtime rules do not derive behavior from a class.
- Anchored and movement legality remain governed by explicit authored data and their existing rules.
- Card-role presentation work remains separate in UI-07 and does not recreate a class system.

### Implementation status

Closed and superseded before implementation.

### History

The earlier approved proposal defined `item`, `person`, `path`, `aspect`, and `feature` as presentation-only classes, with Body, Mind, and Spirit mapped to `aspect` and Puddle mapped to `feature`. Simon later rejected the class system after concluding that dynamic cards would make it redundant or derived. UI-07 preserves the separate goal of stronger visual differentiation without classes.

## LOGIC-D01 — Shared logic evaluator

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Exactly one reusable logic-evaluation component owns the approved condition language. Action applicability/selectors, Process `if`, Value `visibility`, EQUIP-05 passive-effect conditions, and future authored conditions using the same language must all use it. Feature-specific code must not independently reimplement condition evaluation.

The evaluator is a separate component with a small reusable API. Feature code supplies an evaluation context and receives a boolean result. The component ultimately owns consistent behavior for `and`, `or`, `not`, Marker conditions, Value comparisons, logical literals, targets, nested expressions, count matching, LOGIC-D05 deck-size comparisons, TIME-D02 world-clock conditions, and invalid-expression handling.

### Engine iteration boundary

LOGIC-D01, DECK-D01, LOGIC-D05, TIME-D02, ACTION-D05, PROCESS-D01, and EQUIP-05 form the current engine replacement iteration. Closing those seven IDs is necessary but not sufficient: the milestone is complete only when all existing gameplay runs through the generic authored Action, Process, attribute, condition, deck, and passive-effect engine.

The iteration migrates existing gameplay and removes gameplay-specific custom logic and compatibility paths. Runtime must not retain hardcoded card IDs or Room IDs that implement gameplay behavior, special Travel, Water, or Equipment handlers, or another bespoke gameplay path that can be expressed through the approved generic authored model. Tests must prove the migrated existing gameplay through generic data and engine behavior rather than preserving a second compatibility implementation.

This engine iteration introduces no new gameplay content. Apartment/Puddle content, Service Corridor content, crafting content, and UI-09 card-size/drag work remain in later iterations.

DECK-D01 is a required engine dependency rather than a request to introduce Dumpster content. The current runtime stores decks only on Rooms, while LOGIC-D05 and ACTION-D05 operate on the deck owned by a target card through `self.deck`. The iteration must therefore generalize the existing Room-owned model into the shared ownership model, migrate existing Room Search decks without changing their behavior, and make the generic card-owned capability available. Dumpster, its starting contents, and its refill Process remain in DUMPSTER-01's later content iteration.

### Acceptance criteria

- One evaluator is used by every approved consumer of the condition language.
- The evaluation context supplies `self`, optional `other`, world/card access required by approved conditions, and the authoritative world clock without feature-specific card-name knowledge.
- Invalid expressions fail consistently and never become truthy through a feature-specific fallback.
- Central tests cover the language; individual features test integration without duplicating the evaluator's language matrix.
- Existing gameplay uses the generic authored engine end to end, with obsolete custom handlers and compatibility paths removed.
- Runtime contains no gameplay behavior selected by hardcoded card or Room IDs where approved attributes, Actions, Processes, or shared conditions provide the authority.
- Travel, Water, and Equipment behavior do not retain parallel special handlers after migration.
- Existing Room Search decks use DECK-D01's shared ownership model without behavior or persistence regressions, while the engine supports card-owned decks generically without introducing a content-specific consumer.
- No new Room, Puddle, crafting, or UI content is introduced merely to exercise the engine.

### Implementation status

Implemented. One shared evaluator now owns Marker, Value, placement-literal, boolean, count, deck-size, and world-clock conditions for Action matching, Process conditions, and passive conditions. Existing Action applicability was migrated to explicit `other` targets where it inspects the matched counterpart, and obsolete feature-local selector evaluation was removed.

## LOGIC-D02 — Atomic conditions support self and other targets

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Every card-relative atomic condition may specify `target`. If `target` is omitted, `target = self` is implicit. This applies to Marker conditions, Value conditions, logical literal conditions, and LOGIC-D05's computed `deck_size` condition.

These Marker conditions are equivalent:

```json
{ "marker": "food" }
```

```json
{ "target": "self", "marker": "food" }
```

Likewise, `{ "value": "battery", ">": 0 }` defaults to `self`. Explicit `other` is supported where the supplied evaluation context has an `other`. The meanings of `self` and `other` remain consistent with DATA-08's effect language; a condition requiring missing `other` is invalid rather than silently redirected.

### Acceptance criteria

- Marker, Value, logical literal, and `deck_size` conditions accept omitted, `self`, and context-valid `other` targets.
- Omitted and explicit `self` behave identically.
- `other` never resolves through card ID/name knowledge and cannot be used when the evaluation context has no `other`.
- Existing Action applicability is migrated coherently: conditions inspecting the matched counterpart use explicit `other` rather than relying on the old implicit matched-card interpretation.

### Implementation status

Implementation-ready but not implemented.

## LOGIC-D03 — Placement is expressed through logical literals

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The shared condition language includes logical literals `in-inventory`, `in-room`, and `equipped`. They can be combined through `and`, `or`, and `not`, and follow LOGIC-D02: omitted target means `self`, while explicit `other` is valid when the evaluation context supplies it.

For an ordinary movable card:

- `in-inventory` means the card is in flat carried Inventory and not in an equipment slot;
- `in-room` means the card is currently lying in the active Room;
- `equipped` means the card is in any equipment slot, including Left Hand or Right Hand.

These three placement states are mutually exclusive for ordinary movable cards. Runtime must not introduce card-specific placement checks.

### Acceptance criteria

- All three literals are evaluated by LOGIC-D01 against authoritative placement state.
- Hands count as equipped and never as flat carried Inventory.
- Boolean nesting and `self`/`other` targeting behave consistently with all other conditions.
- Equivalent placement behavior does not depend on master ID or display name.

### Implementation status

Implementation-ready but not implemented.

## LOGIC-D04 — Count cards matching a condition expression

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The logic system supports counting cards that match an ordinary condition expression and comparing the resulting count with a number. `count` evaluates its contained ordinary condition expression against the relevant card population and returns the number of matching cards. The result uses the same approved comparator vocabulary as Value comparisons: `>`, `>=`, `<`, `<=`, `=`, and `<>`.

The approved count form for the first concrete use case, starvation, is:

```json
{
  "count": {
    "and": [
      { "marker": "starving" },
      "in-inventory"
    ]
  },
  ">=": 3
}
```

This approval does not introduce a broader query language.

### Acceptance criteria

- Count applies the shared condition semantics to cards and returns exactly the number of matches.
- The Starvation use case can combine Marker `starving` with `in-inventory` and compare the result with 3.
- Count results support exactly `>`, `>=`, `<`, `<=`, `=`, and `<>`.
- Counting uses the same nested conditions, targets, literals, and invalid-expression behavior as LOGIC-D01.
- No card-name-specific counting path exists.

### Implementation status

Implementation-ready but not implemented, subject to LOGIC-D01 through LOGIC-D03.

## LOGIC-D05 — Deck-size computed condition

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The shared condition language supports the generic computed variable `deck_size`:

```json
{
  "deck_size": {
    "<=": 3
  }
}
```

`deck_size` returns the current number of card instances in the deck owned by the target card. An omitted target defaults to `self` under LOGIC-D02. It supports exactly the normal numeric comparators `>`, `>=`, `<`, `<=`, `=`, and `<>`.

`deck_size` is computed from authoritative deck contents whenever evaluated. It is not an authored Value and must not be persisted or cached as mutable gameplay state that can become stale. A card without an owned deck has `deck_size = 0`.

This condition participates in LOGIC-D01 and must remain generic; runtime contains no Dumpster-specific deck counter.

### Acceptance criteria

- Every supported comparator evaluates the target card's current owned-deck size.
- Omitted, explicit `self`, and context-valid `other` targets follow LOGIC-D02.
- Adding, drawing, or removing deck cards is reflected without synchronizing a second stored counter.
- Cards without an owned deck evaluate with size 0.
- The condition composes through the shared `and`, `or`, and `not` operators.
- Equivalent card-owned decks behave identically without card-ID or card-name checks.

### Implementation status

Implemented through LOGIC-D01 against the authoritative shared deck state. All comparators, implicit/explicit targets, missing-deck zero behavior, and boolean composition are covered without a stored deck counter or named-card branch.

## TIME-D02 — Conditions can evaluate the authoritative world clock

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

LOGIC-D01 evaluates authored conditions against TIME-D01's existing authoritative world clock. Atomic comparisons use a `time` object containing exactly one normal comparator and a 24-hour `HH:MM` operand:

```json
{
  "time": {
    ">=": "22:00"
  }
}
```

Supported comparators are exactly `>`, `>=`, `<`, `<=`, `=`, and `<>`. Time atoms participate in the shared condition language and compose through `and`, `or`, and `not`.

Back Alley's night condition is:

```json
{
  "or": [
    { "time": { ">=": "22:00" } },
    { "time": { "<": "06:00" } }
  ]
}
```

Dumpster's exact-noon condition is:

```json
{
  "time": {
    "=": "12:00"
  }
}
```

Runtime must not add hardcoded time concepts such as `night` for one Room. Earlier pseudo-JSON such as `{ "time": ">=", "22:00" }` expressed semantics only and is superseded by the valid shape above.

### Acceptance criteria

- Conditions can express inclusive/exclusive clock ranges that cross midnight.
- Conditions can express an exact clock time such as 12:00.
- Authored clock operands use `HH:MM` times and compare against the current authoritative world-clock time.
- Each atomic time object contains exactly one supported comparator.
- Time atoms nest through the shared `and`, `or`, and `not` operators.
- All consumers read the same authoritative world clock through LOGIC-D01.
- Runtime contains no Back Alley-, Dumpster-, or named-`night` special case.

### Implementation status

Implemented through LOGIC-D01. Authored `HH:MM` comparisons validate and evaluate against centralized elapsed world time modulo the current day, including exact time and cross-midnight boolean ranges.

## ACTION-D01 — Card-on-card roles and Action matching

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

For drag/drop, the dragged card is `accepted` and the card underneath is `received`. An `on` Action belongs to accepted, so accepted is `self` and received is `other`. A `receive` Action belongs to received, so received is `self` and accepted is `other`. Applicability uses the shared condition language in LOGIC-D01 through LOGIC-D05 and TIME-D02; conditions never match a specific card/master ID. Under LOGIC-D02 an omitted target is the Action owner (`self`), so conditions about the matched card use explicit `other`. Zero matches means no Action; exactly one executes; two or more is invalid authored data and must be protected in validation and runtime.

### Acceptance criteria

- Highlight, preview, and commit use the same Action-matching result.
- Both `on` and `receive` directions map accepted/received to `self`/`other` correctly.
- Overlapping match domains fail validation where detectable and never choose silently at runtime.
- An invalid match count leaves state unchanged.

### Implementation status

Partially implemented. Drag highlighting, preview, and commit share the same Action matcher/executor, both applicability directions map `self`/`other`, and ambiguous matches fail unchanged. The current applicability representation still requires migration to LOGIC-D01 and LOGIC-D02's target semantics.

## ACTION-D02 — Generic physical Actions belong on Body

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Current generic Body Actions are Travel, Eat, and Drink. Body dropped on a card with the `path` Marker performs Travel. Body receives a card with the `food` Marker to Eat. Body receives a card carrying both `contains-water` and `hydration` Markers to Drink. Triggering objects own their eligibility and concrete data through their approved Markers, Values, and References; Body must not contain item-name lists.

### Acceptance criteria

- Newly authored food, water containers, and routes work without adding master-name conditionals to code or Body.
- Body owns the generic Action while the object supplies its approved Markers, Values, and References.
- Nonmatching movable cards do not become legal targets merely because they can be moved.

### Implementation status

Implemented. Body owns authored generic Travel, Eat, and Drink Actions, while matched cards supply the approved Markers, Values, and References.

## ACTION-D03 — Approved Action data uses Markers, Values, and References

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

`path`, `food`, and `hydration` are ordinary Markers, not structured attributes. A path card carries the `path` Marker, `travel-time` Value, and `destination` Reference. Food carries the `food` Marker and `food-value` Value. A refillable hydration source carries the `hydration` Marker and `hydration-value` Value. `contains-water` remains the mutable Marker indicating that a container currently holds water and remains part of the Drink applicability selector; drinking removes `contains-water`, while `hydration` and `hydration-value` may remain on the refillable card.

Travel, Eat, and Drink Actions read those Values and References through DATA-08 effects. Destination, base travel time, sustenance, and hydration amounts are not duplicated in room composition, item-name logic, or special-purpose payloads.

### Acceptance criteria

- The approved Marker/Value/Reference combinations are validated and executed without card-name special cases.
- Food migration preserves the concrete effects owned by FOOD-01 through `food-value`.
- A filled container gains `contains-water`; drinking eligibility requires it.
- No special-purpose `path`, `food`, or `hydration` payload is retained after migration.

### Implementation status

Implemented for food, hydration, and paths. Their legacy special-purpose representations are absent from active authored data and runtime logic.

## ACTION-D04 — Actions prevalidate completely and execute ordered effects

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Only one Action executes at a time. Its complete applicability, operands, References, and ordered effects validate before the first effect executes. Effect targets use `self` and `other` as defined by DATA-08. Effects then execute from top to bottom. An unsupported or invalid Action must not partially advance time, discard a card, or mutate Values, Markers, rooms, decks, or positions.

When execution reaches `spend-time`, TIME-D01 advances world time and PROCESS-D01 resolves every crossed tick before execution continues to the next effect. Normal effects execute once when their position in the ordered array is reached, not once per tick. An explicitly authored `spend-time: 0` crosses no tick.

### Acceptance criteria

- A pure planning/validation step establishes one legal complete Action and resolves all operands before mutation.
- Effects execute exactly once in authored order, including Process resolution at `spend-time` boundaries.
- Failure leaves the pre-Action state unchanged.
- Preview calculations share effect rules with committed results.

### Implementation status

Implemented through one pure planning/execution path. Complete Actions resolve before mutation, effects execute in order, Process ticks resolve at `spend-time`, and failures return the original state.

## ACTION-D05 — Add random cards to a deck

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Actions and Processes may use the generic `add-random-card` effect:

```json
{
  "add-random-card": {
    "count": 2,
    "from": [
      "plastic-bottle",
      "stale-bread"
    ],
    "to": "self.deck"
  }
}
```

`count` is a positive integer specifying the number of random picks. `from` is a static authored list of card master IDs. Every pick is independent and selection is with replacement, so the same master may be selected more than once. Duplicate IDs in `from` naturally provide simple weighting.

Each pick creates a fresh card instance from the selected master. New instances are appended to the destination deck in pick order. `to: "self.deck"` means the deck owned by the card whose Action or Process is executing.

The effect performs only generic creation and insertion. It contains no time check, deck-size check, Dumpster-specific rule, or other applicability behavior; those belong in the owning Action or Process condition.

### Acceptance criteria

- Validation requires a positive integer `count`, a non-empty static list of valid card master IDs, and the approved `self.deck` destination.
- Exactly `count` independent with-replacement picks occur.
- Repeated source IDs act as repeated weighted entries without a separate weighting schema.
- Every selected master produces a new independent card instance.
- Created instances append in pick order without replacing or clearing existing deck contents.
- Actions and Processes share the same effect implementation.
- No runtime branch recognizes Dumpster, Plastic Bottle, Stale Bread, or another named master as part of the generic effect.

### Implementation status

Implemented in the shared Action/Process effect path. Picks are independent with replacement, duplicate source IDs provide weighting, fresh instances append in pick order to the owning card's shared deck, and validation rejects unsupported destinations, invalid counts, empty pools, unknown masters, and owners without exactly one deck.

## FOOD-01 — Authored food effects and consumption

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Rat Meat carries the `food` Marker and `food-value` 15. Canned Food carries the `food` Marker and `food-value` 25. Body's generic Eat Action reads `food-value` from `other`, applies that amount to Body Satiation, and discards `other`. The resulting Satiation clamps at 100. There is no card-name branch in game rules.

### Acceptance criteria

- Body recognizes both foods through the generic Eat Action's `food` Marker selector.
- Preview and commit use the same bounded effect calculation, including `67 → 82`, `67 → 92`, and `90 → 100` where applicable.
- Successful eating updates Body once and visibly consumes the accepted food instance.
- A non-food card cannot be eaten and an invalid attempt changes no state.

### Implementation status

Implemented through legacy authored interactions. Migration to the approved `food` Marker, `food-value`, and common Action executor remains part of ACTION-D01 through ACTION-D04.

## FOOD-02 — Define Stale Bread gameplay data

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A card named `Stale Bread` exists and is food. It carries Marker `food` and provides 10 sustenance through the existing `food-value = 10` model. Body's generic Eat behavior adds that amount to Satiation and consumes/discards the Stale Bread instance. Eating Stale Bread takes exactly 15 minutes through an explicit `spend-time` effect.

Stale Bread uses the normal generic food Marker, Value, Eat Action, Satiation effect, time path, and discard behavior. Runtime must not contain Stale-Bread-specific logic. No additional effects are approved.

### Acceptance criteria

- Authored data can reference one or more Stale Bread instances through the normal card/deck model.
- Stale Bread has Marker `food` and `food-value = 10`.
- Eating one instance increases Body Satiation by 10 through the same bounded generic effect as other food.
- Eating one instance advances centralized world time by exactly 15 minutes through `spend-time`.
- Successful eating visibly discards exactly that instance through the generic Eat behavior.
- DUMPSTER-01 does not require duplicate bread authority or a placeholder master.
- No additional effect or card-name/card-ID runtime path is introduced.

### QUESTION FOR SIMON — Generic per-food Eat duration authoring

The duration and behavior are decided, but what exact generic authored representation lets Body's one Eat Action resolve Stale Bread's 15-minute `spend-time` without also assigning that duration to every food? The current Eat Action owns a literal `spend-time: 0`, and no approved per-food duration Value ID exists. Do not add a Value name, a second card-specific Eat Action, or a master-ID branch without an explicit schema decision.

### Implementation status

Stale Bread's identity, sustenance, duration, consumption, and generic behavior are approved. Implementation remains blocked only by the exact generic authoring representation for its already-approved per-food Eat duration. FOOD-02 belongs with DUMPSTER-01 in the Back Alley + Service Corridor + Dumpster + images content iteration once that blocker is resolved.

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

Only an Action's `spend-time` effect advances elapsed world time. Card movement, equipment changes, Inventory organization, and Stack operations are free. Every `spend-time` effect uses one centralized time-advance mechanism so crossed global ticks and ordered-effect execution are consistent. There is no separate Action-duration mechanism.

### Acceptance criteria

- Search, travel, and future time-consuming Actions use the same `spend-time` transition.
- Each `spend-time` effect resolves every crossed Process tick before the following Action effect executes.
- Free organization never changes elapsed time.
- Elapsed time persists across room changes.

### Implementation status

Implemented. `advanceWorldTime` is the only active elapsed-time mutation path, reached only through `spend-time`; Search and Travel no longer mutate elapsed time directly.

## PROCESS-D01 — Processes use global quarter-hour ticks

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Processes have no private timers, intervals, or durations. Each active Process runs once for every world-time boundary crossed at `:00`, `:15`, `:30`, and `:45`. When `spend-time` reaches or crosses a boundary, world time advances and the tick's Process consequences resolve before the Action continues to its next ordered effect. Many Processes may be active while only one Action runs.

The current authored Process model is one optional `if` condition plus ordered `effects`. Nested `if`/`then`/`else` control flow is not required or approved. Complex behavior should use multiple Processes when that is sufficient. Processes on the same card execute in authored order, and each later Process observes state changes made by earlier Processes in the same tick; WATER-02 is the first concrete dependency on that rule. In a card-owned Process, an effect with no explicit target applies to the owning card as `self`, as shown by WATER-02's approved serialization.

Ordering must be intentional rather than an accidental consequence of unrelated JSON layout. PROCESS-D03 separately defines deterministic placement of cards and Processes created during a cycle. Finite or staged Processes use card state, effects, conditions, thresholds, and ordered Processes rather than private clocks. Nested conditional control flow may be reconsidered only if a future concrete requirement needs it.

### Acceptance criteria

- Advancing across multiple boundaries runs every active Process once per boundary.
- Exact-boundary tests prove Process-before-next-effect order.
- Tick counts satisfy `floor(newElapsedMinutes / 15) - floor(oldElapsedMinutes / 15)`: 10→14 gives 0, 10→16 gives 1, 14→31 gives 2, 44→61 gives 2, and a 0-minute Action gives 0.
- Process-authored data contains no per-Process interval field.
- Process validation supports the approved optional `if` plus ordered `effects` shape, but no nested `if`/`then`/`else` language.
- Multiple Processes on one card execute in authored order and later Processes observe earlier state changes from the same tick.
- An omitted effect target in a card-owned Process resolves to the owning card as `self`.
- Inactive rooms remain in world state so future room-local Processes can continue without being architecturally erased.
- A globally active Process whose owning task requires off-screen evaluation, such as DUMPSTER-01, continues to evaluate while its Room is inactive.

### Implementation status

Implemented for the approved current Process model. Global quarter-hour ticks evaluate optional shared conditions, run cards and each card's Processes in deterministic authored order, let later same-card Processes observe earlier changes, default omitted effect targets to the owner, and include off-screen cards. The superseded simultaneous-conflict batch path was removed; PROCESS-D03's later-cycle insertion rule remains outside this iteration.

## PROCESS-D02 — Body drains Hydration and Satiation on every tick

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

At each global quarter-hour tick, Body receives Hydration -2 and Satiation -1. Hydration reaching 0 triggers the generic GAMEOVER-01 state with cause `Dehydration`. Satiation reaching 0 is not immediate Game Over; its approved starvation progression is owned by SURV-03.

### Acceptance criteria

- Every crossed tick applies both changes exactly once.
- Value changes obey their approved bounds.
- Hydration 0 triggers GAMEOVER-01 with cause `Dehydration`.
- Satiation 0 does not itself trigger immediate Game Over.
- Apartment runs the normal survival simulation from the start.

### Implementation status

Partially implemented. Body loses Hydration 2 and Satiation 1 per crossed global tick in the current main phase. Hydration 0 exposes the current non-terminal game-over message, but GAMEOVER-01's terminal state and screen are not implemented. The legacy Opening exclusion is superseded by OPENING-01; SURV-03 now owns the approved starvation timing, counter, and recovery rules.

## PROCESS-02 — Resolve unfinished Process behavior

Priority: P1
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What are the remaining concrete rules for cooking, wound healing/recovery presentation, Fever recovery, spoilage, and similar Processes? How do conflicting simultaneous effects resolve, what happens when an Action or Process is interrupted/cancelled, and what label should represent wound progress? Approved wound behavior already recorded in WOUND-01 should not be reopened accidentally, but unfinished values and transitions must not be invented.

### Implementation status

Not implemented beyond isolated existing prototypes.

## PROCESS-D03 — Newly created cards join the active Process cycle

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

When a Process creates a new card during the current Process cycle, the card is appended to the end of the relevant active card/Process order. Resolution must not use a fixed snapshot that excludes newly created cards. The new card's own Process may therefore execute later in the same cycle.

Ordering is deterministic. This rule does not approve concurrency, cancellation, or any additional interruption behavior.

### Acceptance criteria

- A card created during Process resolution is appended after the cards/Processes already ordered for that cycle.
- Its Process can run once later in the same cycle and is not deferred automatically to the next global tick.
- Existing entries retain their relative order.
- Tests prove that a newly created third Starving card can evaluate its own Process and trigger GAMEOVER-01 in the same tick.

### Implementation status

Implementation-ready but not implemented.

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

Survival state should be expressed through visible Values on Body or separate persistent condition cards when a condition has its own identity and lifecycle. Do not introduce a generic Health resource or hidden accumulators as a substitute for a concrete mechanic. SURV-03's hidden Body Value `starvation` is an explicitly approved counter for one concrete mechanic, not authority for additional hidden survival state. Ordinary Values use authored bounds; current Body survival Values use `0..100` and changes clamp to those bounds.

### Acceptance criteria

- Current survival state is legible from Nadir cards and conditions.
- Effects share the same bounded calculation for preview and commit.
- New permanent state requires an approved task.

### Implementation status

Partially implemented for Body Values and previews.

## SURV-03 — Starving cards and Starvation loss

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

`Starving` is a card with Marker `starving`. Multiple Starving cards may exist simultaneously and are carried in flat Inventory. Starving cards are created through authored Processes, not special runtime starvation code.

Body has the normal authored Value `starvation`, starting at `0` with `visibility = false`. It is internal gameplay state that remains available to generic logic and effects under DATA-10.

When Satiation transitions from above 0 to `0`, immediately create one Starving card and reset `starvation = 0`. Satiation 0 itself is still not directly Game Over.

While Satiation remains 0, each applicable global 15-minute tick applies `starvation += 1`. After a full additional 96 ticks, exactly 24 hours, create one additional Starving card and reset `starvation = 0`. The tick that first changes Satiation to 0 creates the immediate card and resets the counter; it does not also count as the first tick of the following 24-hour interval. The next Starving card therefore cannot arrive after only 23 hours 45 minutes.

When Satiation changes from 0 to above 0, discard one existing Starving card if one exists and reset `starvation = 0`. If Satiation later returns to 0, immediately create a new Starving card and restart the 24-hour counter from 0. There is no separate starvation-recovery subsystem.

Each Starving card owns a Process that uses LOGIC-D04 to count cards matching both Marker `starving` and logical literal `in-inventory`. If that count is `>= 3`, the Process enters the generic GAMEOVER-01 state with cause `Starvation`.

PROCESS-D03 applies when a starvation Process creates a card: the new instance is appended to the active card/Process order, so a newly created third Starving card can run its own Process and trigger Game Over in the same Process cycle.

### SUGGESTED BY CHATGPT — Future Mood interaction

Eating while carrying one or more Starving cards could provide a significant positive Mood effect. Simon explicitly postponed this idea until MOOD-01 defines a Mood system. No Mood amount, scaling rule, trigger detail, or other mechanic is approved, and this suggestion must not be implemented or inferred from the approved starvation rules.

### Acceptance criteria

- Body starts with hidden authored Value `starvation = 0`.
- A transition from positive Satiation to 0 immediately creates one Starving card and resets the counter.
- While Satiation stays 0, exactly 96 subsequent global ticks create each additional Starving card and reset the counter; no interval is shortened to 23 hours 45 minutes.
- A transition from Satiation 0 to above 0 discards at most one existing Starving card and resets the counter.
- Returning to Satiation 0 creates a new immediate Starving card and restarts the counter.
- Starving cards carry Marker `starving` and are in flat Inventory.
- More than one Starving card can exist at the same time.
- Each Starving card owns the generic count-based Process; a count of at least three matching Inventory cards triggers GAMEOVER-01 with cause `Starvation`.
- Satiation 0 alone does not trigger immediate Game Over.
- Creation and loss behavior use generic Process, logic, and Game Over mechanisms without a starvation-specific runtime subsystem.
- The MOOD-01-dependent eating suggestion remains unimplemented and supplies no inferred Mood value, scaling, or trigger behavior.

### Implementation status

Implementation-ready but not implemented, subject to the generic dependencies in DATA-10, LOGIC-D01 through LOGIC-D04, PROCESS-D03, and GAMEOVER-01. Starvation timing, counter, and recovery are no longer open design questions.

## MOOD-01 — Mood system

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Safe Room is expected to gain a player-facing or otherwise gameplay-relevant Mood system. This approval establishes the need for the system only; it approves no representation, values, effects, thresholds, or lifecycle mechanics.

SURV-03 remains authoritative for starvation and records one postponed `SUGGESTED BY CHATGPT` interaction that depends on this task. That suggestion does not define any Mood behavior.

### QUESTION FOR SIMON — Mood mechanics

- How is Mood represented?
- What scale or range does it use?
- What is its starting value?
- How is it made visible to the player?
- How does Mood change?
- Is Mood a Value or another mechanism?
- What does low Mood do?
- What does high Mood do?
- Are there Mood thresholds, and if so what are they?
- Which Actions or Processes affect Mood?
- How does Mood recover?
- How does Mood interact with long-term conditions?
- Should eating while carrying one or more Starving cards affect Mood, and if so what are the exact effect, value, scaling, and trigger rules?

### Implementation status

Open design task. The need for a Mood system is approved, but none of its mechanics are implementation-ready. Do not add MOOD-01 to an implementation iteration until the required rules are explicitly approved.

## GAMEOVER-01 — Game Over is a generic terminal state

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Game Over is a real terminal gameplay state with a cause. Hydration reaching 0 enters Game Over with cause `Dehydration`. A dedicated Game Over screen tells the player why the game was lost.

Once Game Over is active, normal gameplay stops. The player cannot continue through Actions, Search, Travel, Eat or Drink, card drag/drop, equip or unequip, other gameplay interactions, normal time progression, or Process progression caused by continued player gameplay.

The mechanism is generic rather than Dehydration-specific. Future approved loss conditions use the same state with their own cause; SURV-03 already approves `Starvation` as the cause when three Starving cards coexist. At present, `Dehydration` is the only already-active loss cause.

### Acceptance criteria

- Hydration reaching 0 enters Game Over exactly once with cause `Dehydration`.
- A dedicated terminal screen visibly explains the loss cause.
- All normal gameplay interaction and player-driven time or Process progression are blocked after Game Over.
- The terminal-state architecture accepts a cause and contains no Dehydration-specific control flow.
- Existing and future loss conditions can enter the same Game Over state with distinct causes.

### Implementation status

Implementation-ready but not implemented. The current build displays `Game Over = Dehydration` when Hydration reaches 0, yet gameplay continues; that observed behavior does not satisfy the terminal-state rule.

## DURABILITY-01 — Decide tool Durability

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

CRAFT-D01 establishes that recipe-required tools lose Durability where appropriate and that IPA uses Durability to represent remaining usable quantity. Which other tools use Durability, their starting Values, wear per concrete use, and the generic consequence at 0 remain `QUESTION FOR SIMON`. Do not invent exact costs, breakage, or depletion behavior.

## CRAFT-D01 — Technical crafting, repair, and salvage design

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Crafting recipes consist of multiple ordered steps. Each step may be an Action or a Process. A recipe may require tools, those tools lose Durability where appropriate, and each recipe authors its own light requirements. Exact recipe times and Durability costs remain unresolved.

Crafting should feel technical and reflect Nadir's background. Prefer repair, diagnosis, dismantling, salvage, modification, wiring, and technical construction over a generic primitive-survival tree. The world should primarily contain recognizable objects and damaged equipment rather than loose abstract crafting currencies.

A damaged object such as a `Water-Damaged Emergency Light` can be carried elsewhere, repaired, or dismantled for useful components. Repair is generally a shortcut compared with building an equivalent object from scratch. Salvaging destroys the opportunity to repair or use that intact object.

Generic technical repair normally follows this order:

```text
open if necessary
→ clean
→ dry if wet
→ test / diagnose
→ repair identified fault
→ test again
```

Testing and diagnosis occur before fixing the identified fault.

### Built Features and incomplete construction

Half-finished crafts are primarily, and possibly exclusively, relevant to built Features. Do not create artificial intermediate cards such as `Workbench Frame`, `Half-Built Workbench`, or `Almost-Finished Workbench`. Create or use the actual Feature card and preserve that same instance while construction is incomplete. The incomplete Feature is semi-transparent, its completed functionality is inactive, and recipe/build progress determines when it becomes complete and fully visible.

This presentation is not generalized to every small-item craft without a future concrete need.

### Environment-sensitive Processes

Recipe Processes may depend on the Room or environment. Drying wet electronics is faster in a dry Room and slower in a damp or wet Room, making it useful to move an object to a more suitable place. Use the simplest generic Process and Room-attribute representation that expresses a concrete recipe; this approval does not introduce a large humidity simulation or approve exact humidity values.

### Tool capabilities

Recipes normally require a generic tool capability rather than a named tool master. The first approved capability is `screw-tool`, whose Value is a work-time multiplier:

```text
Screwdriver
screw-tool: 1

Coin
screw-tool: 2
```

A Coin can therefore perform screw work but takes twice as long as a Screwdriver. This pattern is generic and attribute-driven. Do not add specialist tool capabilities until concrete recipes justify them.

### Cleaning and material vocabulary

Use `Fabric`; do not create separate Rag, Fabric, or Strap resource types. Fabric may carry clean/dirty and wet/dry state when a concrete recipe needs it, and may later be washed and dried back into clean Fabric. Fabric can also supply strap material when a recipe needs it.

Cleaning electronics uses clean Fabric and Isopropyl Alcohol/IPA. The Action changes `Fabric [clean]` to `Fabric [dirty]`. IPA is a reusable finite-use tool whose Durability represents remaining usable quantity. Do not introduce a separate Soft Brush.

Avoid vague meta-resources such as `Structural Parts` and `Fasteners` unless a concrete future recipe proves that abstraction useful. Keep the component vocabulary small; the current short naming direction includes `Wire`, `Module`, and `Fabric`. Do not split `Module` into relays, fuses, terminal blocks, PCB assemblies, or similar detail unless concrete gameplay needs it. The name and granularity of a light-producing component, such as Lamp or LED, remain unresolved.

### Battery

Battery is a rechargeable resource carrier analogous to Bottle carrying Water: Battery carries Charge. Use reduces Charge and the Battery can be recharged. A Battery is not an ordinary consumed crafting component and should not be destroyed merely because it powers a crafted object when it can remain a reusable inserted or connected source. No multiple Battery chemistry or type vocabulary is approved.

### Hi-Vis Jacket

`Hi-Vis Jacket` is a future clothing concept. It protects against cold and water/weather, but its high visibility is harmful while Nadir is trying to remain hidden. It is a trade-off rather than a linear equipment upgrade. Exact protection, visibility, equipment, and recipe values remain unresolved.

### QUESTION FOR SIMON — Concrete crafting design

- What is the first complete crafting/repair tree and which concrete recipes prove the generic model?
- Which exact components make the first Work Light or other light-producing object, and what is the light component called?
- Which concrete finite salvage belongs in Service Corridor after the recipes justify it?
- Which Room attributes express the first drying/environment dependency, and what exact values apply?
- What are the exact recipe work times and Durability costs?
- Which built Features need incomplete-state progress, and is that presentation exclusive to Features?
- What are the exact Hi-Vis Jacket gameplay Values, visibility consequence, slot compatibility, source, and any recipe?

### Implementation status

Open design task. The principles above are approved, but the concrete crafting tree, recipes, contents, environmental values, times, costs, and unresolved component naming are not implementation-ready. Do not add crafting implementation or arbitrary Service Corridor loot to the engine replacement iteration.

## WOUND-01 — Current wound treatment and healing model

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A Flesh Wound is a persistent condition card with healing progress and Infection state. Dressing it requires one source card carrying both `fabric` and `sterilized`. The Dress Action has an explicit `spend-time: 15` effect, consumes that source card, and adds `dressed` to the wound in its authored effect order.

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

Implemented. Non-Hand slot legality reads current instance `references.equip`; either Hand accepts ordinary movable cards, Anchored/Nadir cards are rejected, and the legacy `equip` field and loader path are removed.

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

Implemented through the legacy `whileEquipped` representation. EQUIP-05 now approves the generic `passives` migration, which must preserve these behavior outcomes.

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

Implemented through one pure allocation calculation reading current size Markers and equipped storage Values. Placement, display, and storage-equipment removal legality share that calculation; equipped cards consume no capacity. The legacy Opening escape check is superseded by OPENING-01.

## EQUIP-04 — Resolve remaining equipment design

Priority: P2
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

Which cards can use Trinket slots and what effects do they have? Do any equipment changes later consume time, do any items occupy multiple slots, and how should the player resolve unequipping capacity-providing gear when carried items no longer fit? Final capacity-supplier presentation and any equipment effects beyond those in EQUIP-03 also remain undecided. Potential progression domains recorded in the earlier equipment note include storage, protection, warmth, access, visibility, concealment, comfort, and mood, but no concrete mechanic is implied by that list.

## EQUIP-05 — Passive equipped-effect attribute representation

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Cards may author continuous passive modifiers through `passives`. Glasses use:

```json
"passives": [
  {
    "if": "equipped",
    "effects": [
      {
        "target": "nadir",
        "value": "vision",
        "+=": 1
      }
    ]
  }
]
```

Flashlight uses the same mechanism with its Battery condition:

```json
"passives": [
  {
    "if": {
      "and": [
        "equipped",
        { "value": "battery", ">": 0 }
      ]
    },
    "effects": [
      {
        "target": "nadir",
        "value": "vision",
        "+=": 1
      }
    ]
  }
]
```

Passive effects are continuous modifiers derived from current state. They do not permanently mutate base Values when activated and do not reverse-mutate base Values when deactivated. A passive contributes only while its `if` condition evaluates true; when the condition becomes false, its effective modifier disappears automatically.

The implementation conceptually derives effective state from base state plus all currently active passive modifiers. `if` uses LOGIC-D01, and `equipped` uses LOGIC-D03's approved literal. Glasses and Flashlight use the same generic mechanism without card-ID or card-name runtime knowledge. The legacy `whileEquipped` representation is superseded and must migrate without changing the already-approved Vision outcomes.

No additional passive-effect target, operation, stacking rule, lifecycle, or feature is approved beyond what the current Glasses and Flashlight use cases require.

### Acceptance criteria

- Validation accepts the approved `passives` array, `if` condition, and current Value-modifier effect shape.
- Passive `if` conditions are evaluated by LOGIC-D01 and use LOGIC-D03's `equipped` literal.
- Effective Vision equals base Vision plus currently active generic passive modifiers and other approved modifiers.
- Equipping or unequipping a source changes effective state without mutating and later restoring the base Value.
- Glasses contribute Vision +1 only while equipped.
- Flashlight contributes Vision +1 only while equipped and Battery is greater than 0.
- Equivalent authored passives behave equivalently without named-card runtime logic.
- Legacy `whileEquipped` data is removed after migration.

### Implementation status

Implemented. Glasses and Flashlight now author `passives`; passive `if` expressions use LOGIC-D01, effective Vision derives continuous modifiers without mutating base Values, and the legacy `whileEquipped` data, parser, and runtime compatibility path are removed.

## OPENING-01 — Apartment is a normal one-way Room

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The player-facing Room formerly named `Opening Room` is `Apartment`. Apartment is an ordinary Room using the same normal Inventory, equipment, Action, Process, Path, and Travel systems as other Rooms. Body, Mind, and Spirit are available from the start, and normal survival simulation is active.

The special Opening flow is superseded: there is no Escape button, `takeLimit`, special `offered` mechanism, or separate Opening gameplay mode/phase. The player leaves through an authored Apartment-to-Tunnels Path using normal Travel. There is no Tunnels-to-Apartment Path, so Apartment is one-way under PATH-APT-01.

Starting equipment remains ordinary equipment state: Pants are equipped in Legs and T-Shirt is equipped in Chest. Apartment contains exactly two Plastic Bottles, one starting with `contains-water` and one starting empty. The two Canned Food instances and Simple Backpack are removed from the legacy Opening contents. Retain the other approved items: Pocket Knife, Simple Lighter, Flashlight, Spare Batteries, Pain Killers, and Glasses.

Apartment's background must be replaced with a homely residential apartment. The visual goal is to make the player feel that Nadir is leaving a safe, private home and entering the dangerous outside world. This approval introduces no additional Apartment mechanic.

### Acceptance criteria

- Authored Apartment setup and exact contents load from room/world data as a normal persistent Room.
- No Opening-only mode, limit, offered state, Escape control, or transition code remains active.
- Body, Mind, Spirit, survival, Inventory, equipment, Actions, and Processes behave normally from game start.
- Apartment has one authored Path to Tunnels; Tunnels has no return Path to Apartment.
- Pants begin in Legs and T-Shirt in Chest through ordinary equipment state.
- The two Bottles start in their approved different states, and Canned Food and Simple Backpack are absent.
- The background communicates a homely residential apartment rather than an evacuation-offer screen.

### Implementation status

Implementation-ready but not implemented. PATH-APT-01 approves Apartment-to-Tunnels `travel-time = 15`; the current special Opening flow, five-offer limit, Escape button, hidden Nadir cards, contents, and background are superseded by this task. OPENING-01, PATH-APT-01, WATER-D01, WATER-01, WATER-02, and required Apartment/Puddle images belong to the Apartment + Puddle + images content iteration after the engine replacement iteration.

### History

The implemented Opening evacuation and five-offered-item design is intentionally retired. Its equipment-slot work remains valid, but its mode, limit, contents, transition, and presentation are not authority for Apartment.

## OPENING-02 — Opening presentation question is superseded

Priority: P3
Decision: APPROVED BY SIMON
Origin: Simon

### Resolution

OPENING-01 resolves the former name, revisit, contents, and presentation questions: the location is Apartment, it has no return Path from Tunnels, its approved contents are explicit, and the special evacuation presentation is removed. Pain Killers and any future item-specific mechanics remain governed by their own tasks and are not invented here.

### Implementation status

Closed and superseded by OPENING-01.

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

The broader task vocabulary is: low-light tasks require Vision 2, normal-light tasks require Vision 3, and precision tasks require Vision 4. It exists to classify concrete future work, not to invent unrelated crafting. Approved examples are low-light—ripping cloth, making wood shavings, knife sharpening, spear practice, and fire starting; normal-light—cooking and stone throwing; precision—sewing. Apartment is Bright, Tunnels Dim, Abandoned Office Bright, and Deep Tunnels Twilight. At Vision 0 or lower, leaving the room is the only currently available activity. Room presentation is derived from light state; artwork itself must not encode mechanically authoritative light. Deep Tunnels is a soft efficiency challenge, not Flashlight-gated.

### Acceptance criteria

- Pure rules calculate equipment modifiers, room modifier, effective Vision, legality, and duration multiplier.
- Search and travel use the same effective Vision result.
- Deep Tunnels can be entered without Glasses or Flashlight at the approved penalty.
- Background treatment changes with authored light state without replacing room artwork.

### Implementation status

Implemented for Search, travel, active equipment, and the current Room presentation. Apartment's authored rename and normal-Room conversion remain unimplemented under OPENING-01.

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

The Apartment Flashlight starts with Battery 20. The Deep Tunnels Search Flashlight starts with Battery 0. A Flashlight is switched on and grants Vision +1 only when equipped in either Hand and Battery > 0. In Inventory or a Room it is inactive, grants no Vision, and drains no Battery.

### Acceptance criteria

- The two authored instances receive their approved starting Battery overrides.
- Hand/equipment state and Battery jointly determine the modifier.
- Carried and Room Flashlights remain inactive.
- Battery drain is isolated behind FLASHLIGHT-01 and is not guessed.

### Implementation status

Partially implemented. The current legacy Opening Flashlight starts at Battery 20 and the Deep Tunnels instance starts at 0; Apartment placement remains unimplemented under OPENING-01. Numerical drain remains intentionally unresolved.

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

Puddle of Water is Anchored and begins with Value `water = 3`. A valid empty container has `container` and lacks `contains-water`. A successful fill adds `contains-water` to that container and reduces Puddle `water` by 1. A Puddle with `water = 0` remains in the world, cannot fill a container until water regenerates, and must not be discarded permanently. Regeneration is owned by WATER-02. `contains-water` remains part of the generic Drink applicability selector with the `hydration` Marker; the concrete amount comes from `hydration-value`. Fill is an Action whose explicit `spend-time` is owned by WATER-01.

### Acceptance criteria

- Eligibility, preview, and completion use attributes rather than master-name cases.
- Each completed fill changes exactly one container and decrements `water` exactly once.
- A Puddle at `water = 0` remains present and unavailable for filling until WATER-02 regenerates water.
- The Fill Action spends exactly the duration approved in WATER-01.

### Implementation status

Implementation-ready and partially implemented. Puddle `water = 3` and container state exist, but the current depletion behavior discards the empty Puddle. The approved persistent-empty behavior, WATER-01 Fill duration, and WATER-02 regeneration are fully specified for the Apartment + Puddle + images content iteration after the engine replacement iteration.

### History

This supersedes both the older Milestone 2 direct/free filling prototype and the later provisional rule that discarded an empty Puddle.

## WATER-01 — Puddle filling takes one minute

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Filling one bottle from the Puddle is an Action with an explicit `spend-time` effect of exactly 1 minute.

### Acceptance criteria

- Each completed Fill Action advances centralized world time by exactly 1 minute.
- The duration is authored through the common Action model and has no direct or implicit time mutation.
- Eligibility and Puddle/container state changes remain owned by WATER-D01.

### Implementation status

Implementation-ready but not implemented. This resolves the former open duration question and uses WATER-D01's already approved Fill interaction.

## WATER-02 — Puddle regeneration

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Puddle has Value `water`, starting at 3 with maximum 3 and `visibility = true`, and Value `refill`, starting at 0 with `visibility = false`. Values must support authored game-start values. DATA-10 makes visibility mandatory for every authored Value; `refill` remains ordinary internal gameplay state available to logic and effects while never being player-facing.

Puddle remains in the world when `water = 0`. Regeneration uses two Processes in authored order. It does not require nested `if`/`then`/`else` control flow.

The Tunnels Puddle is a slow renewable fallback in a hub-like Room. It provides some renewable water but is deliberately insufficient to make Nadir indefinitely self-sufficient in Tunnels. This content balance belongs to the Apartment + Puddle + images iteration; PROCESS-D01 supplies the generic engine capability without introducing the Puddle content during the engine iteration.

The first Process is:

```json
{
  "if": {
    "and": [
      { "value": "water", "<": 3 },
      { "value": "refill", "<": 96 }
    ]
  },
  "effects": [
    { "value": "refill", "+=": 1 }
  ]
}
```

The second Process is:

```json
{
  "if": {
    "and": [
      { "value": "water", "<": 3 },
      { "value": "refill", ">=": 96 }
    ]
  },
  "effects": [
    { "value": "water", "+=": 1 },
    { "value": "refill", "=": 0 }
  ]
}
```

The first Process executes before the second, and the second observes state produced by the first in the same tick. Starting from `refill = 0`, ticks 1 through 95 leave `refill` at 1 through 95. On tick 96 the first Process raises it to 96; the second then applies `water += 1` and resets `refill = 0`. Exactly 96 ticks therefore regenerate one Water: `96 × 15 minutes = 24 hours`. If `water = 3`, neither Process applies and `refill` does not increase.

### Acceptance criteria

- Authored game-start state creates Puddle with `water = 3` and `refill = 0`.
- Authored Puddle data sets `water.visibility = true` and `refill.visibility = false`.
- `water` never exceeds 3.
- A full Puddle does not accumulate `refill`.
- An unfilled Puddle regenerates exactly one Water on the 96th tick from `refill = 0`, then resets `refill` to 0.
- The first Process executes before the second, which observes the first Process's same-tick state change.
- Regeneration uses only the approved Process `if` plus ordered `effects` model and introduces no nested conditional control flow.
- `refill` never appears on the card, in inspection, or in ordinary player-facing previews.
- Empty Puddles persist and can become usable again through the same generic Process system.

### Implementation status

Implementation-ready but not implemented, subject to the approved generic dependencies in DATA-10, LOGIC-D01, LOGIC-D02, and PROCESS-D01. The prior nested-conditional requirement and serialization blocker are superseded. This authored Puddle behavior belongs to the Apartment + Puddle + images content iteration after the generic engine iteration.

## ROOM-01 — Persistent authored rooms and world state

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Persistent Rooms include Apartment, Tunnels, Abandoned Office, Deep Tunnels, Back Alley, and Service Corridor. Apartment supersedes the special introductory Opening location and is a normal persistent Room under OPENING-01. Back Alley and Service Corridor are approved in ROOM-04 and ROOM-05. Backgrounds provide identity and atmosphere only; mechanically meaningful state remains in authored game state rather than baked into artwork. Each persistent Room owns authored background, light, local card instances, Room-owned decks where present, and persistent card identity/state/position, including current Markers, Values, References, and exact position. DECK-D01 also permits a card to own the same deck model. Inactive Rooms remain in world state. Travel switches the visible Room while Nadir state, equipment, carried Inventory, elapsed time, and every Room's exact state persist.

### Acceptance criteria

- World composition comes from `rooms.json` rather than React constants.
- Leaving and returning restores exact room instance/deck state and positions.
- Inactive rooms are not recreated or discarded.
- Public assets resolve through the Vite base path; current Search artwork uses the existing `.jpg` asset.

### Implementation status

Implemented for the legacy Opening, Tunnels, Abandoned Office, and Deep Tunnels slice. Apartment, Back Alley, and Service Corridor remain unimplemented.

## ROOM-02 — Routes travel through the common Action model

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Navigation cards are ordinary room-local Anchored cards carrying the `path` Marker, a `travel-time` Value, and a `destination` Reference. Dropping Body on one invokes Body's generic Travel Action. Its `set-room` effect resolves `destination` from `other`, and its `spend-time` effect resolves `travel-time` from `other` in the approved ordered effects. Current routes are Tunnels to Abandoned Office 15 minutes, Abandoned Office to Tunnels 15 minutes, Tunnels to Deep Tunnels 30 minutes, and Deep Tunnels to Tunnels 30 minutes. The two outbound Tunnels routes begin inside its Search deck and become visible navigation cards only when drawn. Vision modifies travel time through VISION-01; there is no special Flashlight requirement.

### Acceptance criteria

- Destination comes from the path card's `destination` Reference and base time from its `travel-time` Value, not component conditionals.
- Travel uses ACTION-D01 through ACTION-D04 and centralized time.
- Discovered route cards remain in their room with exact identity and position.
- Arrival preserves all world and Nadir state.
- Every approved connection is represented by the authored Path cards owned by ROOM-02 or the relevant Room-introduction Path task; runtime invents no implicit edge.

### Implementation status

Implemented through Body's common Travel Action. Route cards author `path`, `travel-time`, and `destination`; Vision adjusts resolved `spend-time`, Processes tick before `set-room`, and the legacy travel adapter is removed.

## ROOM-03 — Resolve remaining Room content and objects

Priority: P3
Decision: QUESTION FOR SIMON
Origin: Simon

### Question

What final content and deck compositions should fill the approved Rooms beyond the explicit decisions in ROOM-04, ROOM-05, DUMPSTER-01, and SEARCH-01? Mechanics for Pipe, Squatter, Service Cabinet, Puddle-related environment presentation, placeholder discoveries, and unspecified Back Alley content are not decided by their presence or names and must not be invented. ROOM-05 now approves an intentionally empty initial Service Corridor; its later purpose and content are isolated in ROOM-07. Approved new-room topology is owned by PATH-APT-01, PATH-BA-01, and PATH-SC-01 and is no longer open here.

Abandoned Office is later content. Its approved light remains Bright under VISION-01. Its intended direction is that it offers good working light during daytime while continued activity can make it increasingly exposed or dangerous. The exact exposure system, thresholds, causes, and consequences remain `QUESTION FOR SIMON` and must not be invented in this planning task.

## ROOM-04 — Back Alley

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Back Alley is a persistent Room. The approved topology is Tunnels to Back Alley and Back Alley to Tunnels, represented in both directions by authored Path cards under PATH-BA-01.

Travel from Tunnels to Back Alley is available only at night: from 22:00 inclusive until 06:00 exclusive. The Path's availability is authored through TIME-D02 and evaluated by LOGIC-D01 against the existing world clock. Runtime must not contain a Back Alley-specific time check or a hardcoded `night` concept.

Back Alley contains the Dumpster card owned by DUMPSTER-01. No other content is approved here.

Back Alley is intended as an interesting loot location with a limited useful window. Continued surrounding activity or exposure may make it increasingly dangerous, but the exact exposure mechanic, thresholds, timing, and consequences remain `QUESTION FOR SIMON` and are not approved by this task.

### Acceptance criteria

- Back Alley persists under ROOM-01 like every other Room.
- Authored Path cards provide both approved directions and no implicit runtime edge.
- Only the Tunnels-to-Back-Alley direction is conditionally available at 22:00–06:00.
- The midnight-spanning condition has the exact approved inclusive/exclusive boundaries.
- Dumpster is present without hardcoded Room- or card-specific behavior.

### Implementation status

Future content iteration after Apartment + Puddle + images. Implementation-ready behavior remains subject to the approved generic dependencies in TIME-D02, DUMPSTER-01, LOGIC-D01, LOGIC-D05, ACTION-D05, DECK-D01, and PATH-BA-01; the unresolved exposure progression is later design and must not be invented as part of the initial Room.

## ROOM-05 — Service Corridor

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Service Corridor is a deliberately minimal persistent Room. Its initial implementation contains exactly the authored Tunnels-to-Service-Corridor Path and Service-Corridor-to-Tunnels Path required by PATH-SC-01, each with `travel-time = 15`.

Service Corridor otherwise starts empty: it has no Search deck, Features, loose items, additional Paths, or special behavior. Runtime and authored data must not invent content merely to make the Room feel complete. The current purpose is only to establish the Room and its two-way connectivity. ROOM-07 owns the separate future design work for purpose and content.

### Acceptance criteria

- Service Corridor persists under ROOM-01 like every other Room.
- Authored Path cards provide both approved directions at exactly 15 minutes each, with no implicit runtime edge.
- The initial Room contains no Search deck, Features, loose items, additional Paths, or special behavior.
- Runtime and authored data do not invent additional content.
- Future gameplay purpose and content remain isolated in ROOM-07 and do not block the intentionally empty first version; only the schema-required background and light authoring remain blockers.

### Implementation status

The deliberately empty initial contents and both required 15-minute Paths are fully approved. The Room is not yet implementation-ready because ROOM-01's schema requires an authored background and light level, and ROOM-07 deliberately leaves those presentation/world-state choices unresolved. Service Corridor belongs to the Back Alley + Service Corridor + Dumpster + images iteration, not the engine iteration.

## ROOM-06 — Future room candidates

Priority: P3
Decision: SUGGESTED BY CHATGPT
Origin: ChatGPT

### Design candidates

The following locations were discussed as possible future additions but are not approved Rooms:

- **Maintenance Room:** possible technical area near the tunnels, with tools or spares and a relatively safer utility-space character.
- **Storm Drain:** possible wet, dark infrastructure area and potential water-related location.
- **Abandoned Station:** possible larger underground location and future navigation hub.
- **Basement:** possible transition toward occupied or civilian buildings above ground.
- **Storage Room:** possible concentrated supply location.
- **Utility Plant / Boiler Room:** possible machinery- and noise-oriented location.
- **Courtyard:** possible semi-exposed, surface-adjacent location.

This task preserves candidates only. It does not add them to the world map, create Path cards, assign travel times, approve backgrounds, define contents or decks, or make any candidate implementation-ready. Back Alley and Service Corridor are excluded because ROOM-04 and ROOM-05 already own them.

If Simon later approves a candidate, it should receive its own Room task and a Room-specific authored Path task rather than gaining authority from this suggestion record.

### QUESTION FOR SIMON — Candidate selection and design

- Which, if any, candidate locations should become approved Rooms?
- For each approved candidate, what topology, Paths, travel times, background, light, contents, decks, interactions, and other authored behavior are required?

### Implementation status

Open design record only. None of these candidate Rooms or their tentative purposes are approved or implementation-ready.

## ROOM-07 — Define Service Corridor purpose and content

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Safe Room must revisit Service Corridor's longer-term purpose and content after ROOM-05's deliberately empty initial implementation. Service Corridor is a technical/utility area that can contain useful resources or salvage. Those resources are finite and exhaustible rather than a renewable loot farm. Detailed contents must wait until the crafting tree is mature enough to justify concrete recognizable objects and materials; arbitrary generic crafting resources must not be added merely to populate the Room.

This direction belongs to the Back Alley + Service Corridor + Dumpster + images content iteration after Apartment + Puddle + images. It does not approve particular loot, Features, decks, risks, opportunities, background, light level, or additional connections.

### QUESTION FOR SIMON — Service Corridor purpose and content

- What is Service Corridor's gameplay purpose?
- Within its approved technical/utility character, what precise gameplay purpose should it serve: transit, finite salvage, shelter, access, or another role?
- Which Features, if any, belong there?
- Should it have one or more decks?
- Which concrete finite/exhaustible objects or salvage should be present once the crafting tree justifies them?
- Should it gain additional Room connections?
- What visual identity and background should it use?
- What authored light level should it use?
- What risks should it contain?
- What opportunities should it offer?
- Why should the player visit or return?

### Implementation status

Open design task. Its technical/utility character and finite/exhaustible resource direction are approved, but none of the concrete contents, connections, risks, opportunities, background, light, or presentation decisions are implementation-ready. Do not add ROOM-07 to an implementation iteration until they are explicitly approved.

## PATH-D01 — Combined expanded-topology Path task is superseded

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Resolution

The former combined task mixed Paths from several Room-introduction iterations. Its active authority is split into PATH-APT-01, PATH-BA-01, and PATH-SC-01 so each Path ships with the content iteration that introduces its Room. ROOM-02 continues to own the already implemented Abandoned Office and Deep Tunnels routes and the shared generic Travel behavior.

### Implementation status

Closed and superseded by the three Room-specific Path tasks below.

## PATH-APT-01 — Apartment to Tunnels Path

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Apartment contains one authored Path to Tunnels with `travel-time = 15`. There is no Tunnels-to-Apartment Path. The route uses the generic Path Marker, `travel-time` Value, `destination` Reference, Body Travel Action, shared logic, and ordered effects; runtime invents no implicit edge or Apartment-specific Travel handler.

### Acceptance criteria

- Apartment has exactly one authored outgoing Path to Tunnels at a base travel time of 15 minutes.
- Tunnels has no return Path to Apartment.
- Travel uses the generic authored engine and contains no Apartment or Tunnels ID special case.

### Implementation status

Implementation-ready but not implemented. This task belongs with OPENING-01 and the Apartment + Puddle + images content iteration after the engine replacement iteration.

## PATH-BA-01 — Tunnels and Back Alley Paths

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Tunnels contains an authored Path to Back Alley and Back Alley contains an authored Path to Tunnels. Each has `travel-time = 15`. Only the Tunnels-to-Back-Alley direction uses TIME-D02's approved night condition: current time is at least 22:00 or earlier than 06:00. Runtime contains no implicit edge, Room-ID branch, or hardcoded `night` literal.

### Acceptance criteria

- Both directed Paths exist and each has a base travel time of exactly 15 minutes.
- Only entry from Tunnels is restricted to the approved 22:00–06:00 window.
- Both routes use the generic authored Travel and condition systems without named-Room handling.

### Implementation status

Implementation-ready but not implemented, subject to the engine iteration's LOGIC-D01 and TIME-D02 work. This task belongs with ROOM-04, DUMPSTER-01, and the Back Alley + Service Corridor + Dumpster + images content iteration.

## PATH-SC-01 — Tunnels and Service Corridor Paths

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Tunnels contains an authored Path to Service Corridor and Service Corridor contains an authored Path to Tunnels. Each has `travel-time = 15`. Runtime contains no implicit edge or named-Room Travel handler.

### Acceptance criteria

- Both directed Paths exist and each has a base travel time of exactly 15 minutes.
- Neither direction gains a condition unless a future approved task explicitly adds one.
- Both routes use the generic authored Travel system without named-Room handling.

### Implementation status

Implementation-ready but not implemented. This task belongs with ROOM-05, ROOM-07, and the Back Alley + Service Corridor + Dumpster + images content iteration, after the Room's unresolved content and presentation decisions are ready.

## DECK-D01 — Deck ownership is shared by Rooms and cards

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The existing deck definition currently authored under Rooms is generalized and reused; no second deck schema is introduced. A deck may be owned by a Room or by a card. A card-owned deck uses the same underlying deck model and preserves existing shuffle, persistence, draw, removal, and retained-order behavior unless another approved task explicitly changes it.

This enables interactive world cards such as Dumpster to own searchable contents without a Dumpster-specific deck subsystem.

### Acceptance criteria

- Room-owned and card-owned decks load through one generalized model.
- Existing Room-deck behavior and persistence remain unchanged after migration.
- A card-owned deck remains associated with its owning card instance and retains cards not found or removed.
- Runtime contains no Dumpster-specific deck implementation.

### Implementation status

Implemented as one shared runtime deck collection with explicit Room/card ownership. Room Search decks were migrated without changing shuffle, draw, exhaustion, retained-order, or persistence behavior; card masters load the same deck definition shape, and card-owned deck identity follows its owning instance. No Dumpster content or parallel Room-only runtime deck model was added.

## DUMPSTER-01 — Dumpster owns a persistent refillable deck

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Dumpster is a card located in Back Alley. It owns a searchable deck through DECK-D01. The deck has authored starting cards, retains cards that have not been found or removed, and may receive two new cards every day at exactly 12:00.

At game start the Dumpster deck contains exactly one empty Plastic Bottle and one Stale Bread. The Plastic Bottle must not have `contains-water`.

Dumpster's authored Process runs globally through the normal Process system and continues to run and evaluate while Nadir is outside Back Alley. At exactly 12:00 it uses TIME-D02's authoritative world-clock condition. If the owned deck currently contains more than three card instances, no refill occurs. If `deck_size <= 3`, the Process adds exactly two new card instances.

Each new card is selected independently, with replacement, from this static authored source list:

```json
[
  "plastic-bottle",
  "stale-bread"
]
```

Valid outcomes therefore include two Plastic Bottles, one Plastic Bottle and one Stale Bread in either pick order, or two Stale Bread cards. Repeated master IDs in a future authored source list may provide simple weighting under ACTION-D05. Each pick creates a fresh instance, and the two instances append to the end of the existing Dumpster deck in pick order. Existing cards are never replaced or cleared.

The approved Process is:

```json
{
  "if": {
    "and": [
      {
        "time": {
          "=": "12:00"
        }
      },
      {
        "deck_size": {
          "<=": 3
        }
      }
    ]
  },
  "effects": [
    {
      "add-random-card": {
        "count": 2,
        "from": [
          "plastic-bottle",
          "stale-bread"
        ],
        "to": "self.deck"
      }
    }
  ]
}
```

The time and deck-size restrictions belong entirely to Process applicability. ACTION-D05's generic effect performs only creation and insertion. Runtime must not hardcode Dumpster behavior.

### Acceptance criteria

- Dumpster and its deck persist as ordinary authored card/world state.
- Searching uses the generalized deck behavior rather than a second deck type.
- Starting contents are exactly one empty Plastic Bottle without `contains-water` and one Stale Bread.
- The Process evaluates globally even when Back Alley is not the active Room.
- At 12:00, a deck with more than three cards receives no refill; a deck with three or fewer receives exactly two new cards.
- Each new card is independently selected with replacement from the exact authored Plastic Bottle/Stale Bread pool.
- Each pick creates a fresh instance and appends it in pick order.
- Cards not drawn or removed remain in the deck across searches and daily additions.
- Existing deck contents are never replaced or cleared by refill.
- The refill uses only the simple static-list randomness and duplicate-entry weighting approved by ACTION-D05; no rarity table or advanced loot model is introduced.
- No Dumpster ID/name branch exists in runtime.

### Implementation status

Implementation-ready but not implemented, subject to the approved generic dependencies in DECK-D01, LOGIC-D01, LOGIC-D05, TIME-D02, PROCESS-D01, and ACTION-D05. Starting contents, global evaluation, applicability, random source pool, creation, and insertion behavior are fully specified. DUMPSTER-01 belongs to the Back Alley + Service Corridor + Dumpster + images content iteration after the Apartment/Puddle iteration.

## SEARCH-01 — Search decks are persistent owned objects

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

A Room-owned Search deck is presented as a clicked Room-local interactive object, not a card, and does not inherit card rules such as Anchored, Stack, inspection, or discard. Under DECK-D01 the same deck model may instead be owned by a card; the deck itself remains distinct from its owning card, while interaction occurs through that card as approved by its task. Every deck, including undiscovered-Room decks, is shuffled exactly once when a new game starts unless an owning task explicitly adds cards later; its hidden finite order persists and never rerolls between draws. Room-owned Search presentation uses the shared full-face `images/search-back.jpg`, shows no remaining count, and disappears immediately when exhausted. Search is an Action with an explicit base `spend-time` amount of 15 minutes, modified by VISION-01; at Vision 0 or lower it is unavailable.

Current authored compositions are:

- Tunnels Explore: Scrap Metal ×2; Pipe ×1; Squatter ×1; Dead Rat ×1; empty Plastic Bottle ×1; Puddle of Water with Water 3 ×1; Deep Tunnels route ×1; Abandoned Office route ×1; locked Service Cabinet ×1.
- Abandoned Office: ten Placeholder cards.
- Deep Tunnels: one Flashlight with Battery 0 and nine Placeholder cards.

No mechanics are implied for Squatter, Pipe, Service Cabinet, Puddle beyond WATER-D01 and WATER-02, or Placeholder cards.

### Acceptance criteria

- A controlled RNG proves deterministic one-time shuffle and stable hidden order.
- Room-owned and card-owned searchable decks share the DECK-D01 model without conflating the deck with its owner.
- Each completed Search advances centralized time through `spend-time`, then draws exactly one instance and depletes exactly one entry.
- Undiscovered room decks are shuffled at new-game creation.
- Exhausted decks become unavailable and are removed from presentation.

### Implementation status

Implemented through the common Action/time path. Search resolves Vision-adjusted `spend-time`, Processes tick before the draw, and deck depletion/placement then persist without a separate elapsed-time mutation.

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
- Bare-zone feedback reflects bounds, overlap, Anchored, storage, and ordinary placement legality.

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

## UI-06 — Card artwork must remain visually stable

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Card artwork must remain visually stable during interaction.

The first click or first drag of a card must not cause its artwork to flicker, disappear, visibly remount, or appear to reload.

Selection, drag state, and click/release without movement must preserve the currently displayed artwork.

The existing fallback behavior for genuinely missing artwork remains valid.

### Acceptance criteria

- No artwork flicker on first click.
- No artwork flicker on first drag.
- Click/release without movement preserves the artwork.
- Selection or drag state does not visibly reload or remount the image.
- Missing artwork still uses the established fallback.
- Verified in Apartment after OPENING-01 replaces the legacy Opening.
- Verified in at least one normal Room.
- When implemented, verified on the deployed GitHub Pages build.

### Implementation status

Implementation-ready but not implemented. The renderer fix and current-room verification can proceed now; the Apartment-specific acceptance check must be repeated after OPENING-01 replaces the legacy Opening.

## UI-07 — Visually distinguish card roles without classes

Priority: P1
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Safe Room uses a layered card renderer in which card-specific artwork remains separate from reusable frame/material artwork. The first version has four presentation roles: Food, Item, Path, and Feature. These roles are presentation only. They are not gameplay classes, gameplay authority, or replacements for Markers, Values, References, Actions, or Processes. This work must not recreate the rejected class system in CARD-09.

The approved visual direction is:

- **Food:** organic, warm, worn, aged or stained paper/cardboard character that suggests something physical and perishable.
- **Item:** neutral utility appearance with worn paper/cardboard as the common treatment for ordinary carried non-food objects.
- **Path:** blueprint, map, or navigation character with a technically drawn/map-like texture, clearly differentiated from physical objects. Destination and direction information remain dynamic UI, not baked artwork.
- **Feature:** industrial or environmental character with a heavier or mounted appearance, potentially resembling metal, a plaque, or industrial labeling. It is intended for room objects such as Puddle, Dumpster, Cabinet, and similar fixed/interactable environmental objects.

All four roles remain parts of the same Safe Room visual language. A special condition-card treatment, including for Starving, is outside UI-07 v1; condition cards may retain their current presentation. UI-08 owns the future design work for condition-card presentation. No fifth material or presentation value is approved.

### Authored presentation metadata

A card master may contain the optional presentation-only field:

```json
{
  "presentation": "food"
}
```

The first-version vocabulary is exactly `food`, `item`, `path`, and `feature`. Validation rejects any other authored value. Loading preserves the optional value for the renderer. The field does not alter gameplay, replace Markers, Values, References, Actions, or Processes, become a card class, or participate in gameplay queries. Gameplay logic must not query or branch on `presentation`.

Cards outside the current vocabulary, including condition-like cards such as Starving and potentially other special cards, omit the field and retain the legacy presentation. Omission does not trigger gameplay inference or an inferred fallback role.

### Production asset contract

Simon supplied four authoritative production assets at these exact repository paths:

- `public/images/card-frames/card-frame-food.png`
- `public/images/card-frames/card-frame-item.png`
- `public/images/card-frames/card-frame-path.png`
- `public/images/card-frames/card-frame-feature.png`

These are production assets, not temporary mockups. They must be used without destructive optimization, regeneration, redrawing, or substitution. Each production frame has a transparent background, contains only reusable frame/material artwork, and leaves a transparent central aperture for card-specific artwork. It contains no card-specific illustration, title, descriptive text, Values, Actions, travel-time text, condition text, hover/selected/drag state, or baked-in capability/role icons.

The previously generated four-frame overview is design reference only. It is not a production asset and must not be used directly as a card frame.

### Renderer composition

The renderer conceptually composes independent layers in this order:

1. reusable frame/material asset;
2. existing card-specific artwork;
3. dynamic card title;
4. dynamic Values and information;
5. dynamic capability/status icons;
6. contextual information/footer areas;
7. HTML/CSS/SVG interaction styling.

Dynamic information remains dynamic. Changing a Value, Action, destination, condition, travel time, or selection state must not require editing or regenerating frame artwork. Existing card artwork remains the actual illustration inside the frame.

### Role selection

The renderer selects the frame directly from the card master's optional `presentation` field owned by this task, never from card-name/card-ID cases or gameplay inference:

```text
food    -> public/images/card-frames/card-frame-food.png
item    -> public/images/card-frames/card-frame-item.png
path    -> public/images/card-frames/card-frame-path.png
feature -> public/images/card-frames/card-frame-feature.png
```

Cards without `presentation`, including current condition-like or other special cards outside the four roles, retain the existing legacy rendering. The renderer must not infer a value from Markers or other gameplay state, and gameplay must never query the field.

### UI-06 compatibility

UI-06 remains the authority for artwork stability. The layered renderer must not visibly reload or remount card artwork on first click, hover, selection, drag start, dragging, or other normal card interaction. Frame changes and dynamic overlays should remain independent of the mounted card-art image where practical.

### Acceptance criteria

- Food, Item, Path, and Feature are visually distinct while remaining one coherent Safe Room language.
- Presentation roles add no gameplay state or authority and do not depend on a class field.
- Card-master validation accepts only `food`, `item`, `path`, and `feature` when `presentation` is present, preserves omission, and keeps the field unavailable to gameplay logic.
- The renderer uses no card-name or card-ID special cases to choose a role.
- The renderer maps the four exact authored values to the four exact authoritative asset paths.
- Cards without `presentation` preserve the legacy rendering.
- The supplied 512 × 768 RGBA PNG production frames comply with the asset contract and are composed with existing art and dynamic UI as independent layers.
- Production builds and GitHub Pages deploy all four assets at their base-path-correct URLs.
- Dynamic state and interaction styling never require regenerating a frame asset.
- Condition cards retain their current presentation in v1; their future treatment remains isolated in UI-08.
- UI-06 artwork-stability criteria remain satisfied across normal interaction.

### Implementation status

Implementation-ready but not implemented. This task now owns both the approved card-master presentation metadata and the renderer that consumes it; DATA-11 is closed and merged. The production assets, exact role selection, validation, gameplay separation, and legacy fallback are fully specified. UI-07 remains future UI work and is not part of the engine replacement iteration.

## UI-08 — Condition card presentation

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Safe Room must revisit the visual presentation of condition or state cards such as Starving in a future design pass. The need for that future work is approved, but no concrete visual treatment is approved.

UI-07 v1 remains limited to Food, Item, Path, and Feature. Condition cards retain their existing legacy presentation for that implementation. This task does not add a fifth `presentation` value or expand UI-07's production vocabulary.

### QUESTION FOR SIMON — Condition-card visual language

- What frame or material treatment should condition cards use?
- What silhouette should they have?
- What information hierarchy should they use?
- Should condition cards share one future presentation value?
- Should condition severity affect their appearance?
- How should they remain visually distinct from Food, Item, Path, and Feature?
- How should they fit the overall Safe Room visual language?

### Implementation status

Open design task. The need to design condition-card presentation is approved, but its treatment and data representation are not implementation-ready. Do not add UI-08 to an implementation iteration until those decisions are approved.

## UI-09 — Configurable card scale and drag-pointer presentation

Priority: P2
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

The existing card dimensions are the `100%` reference size. Resting cards default to `150%` of that reference size. Dragged cards default to `90%` of the original reference dimensions, not 90% of the enlarged resting size. Both scales are dynamically configurable.

Dragged cards are partially transparent. Drag opacity is dynamically configurable and defaults to approximately 70%.

While dragging, the card's top-left corner is the interaction pointer. That corner aligns with the mouse pointer, and hit testing and drop targeting use the corner rather than the card center or another point. The smaller, partially transparent dragged card exposes more of the destination underneath.

The active pointer corner uses a yellow/gold `┌` treatment: a short section of the top edge and a short section of the left edge. The entire card border must not be highlighted. Drop-target feedback uses the same yellow/gold visual language.

A player-facing settings/menu control allows immediate changes to resting scale, dragged scale, and dragged opacity. The settings persist locally between sessions. The persistence mechanism and UI layout must remain generic presentation concerns and must not affect gameplay state.

### Acceptance criteria

- Default resting cards render at 150% of the existing reference dimensions.
- Default dragged cards render at 90% of the reference dimensions, independently of resting scale.
- Drag opacity defaults to approximately 70%, and all three presentation settings update immediately.
- The dragged card's top-left corner aligns with the mouse and is the authoritative hit-test/drop point.
- Only short top and left edge segments mark the active corner in yellow/gold; drop-target feedback uses the same visual language.
- Settings persist locally between sessions without becoming authored gameplay data.

### Implementation status

Approved future UI work and not implemented. Do not add UI-09 to the engine replacement iteration.

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

## BUILD-01 — Display and verify deployed build metadata

Priority: P0
Decision: APPROVED BY SIMON
Origin: Simon

### Rule

Safe Room displays its build number and build date/time unobtrusively in a fixed corner of the game window. Production GitHub Pages builds use GitHub Actions `GITHUB_RUN_NUMBER` as the build number and a UTC timestamp generated for the build being produced; the concrete values are injected into the production bundle at build time rather than fetched by the browser. Local development uses a safe `dev` fallback, and a production deployment must never silently show that fallback.

The display is small, subdued, always readable, unaffected by Room zoom, and visible across Apartment and other Rooms without covering important gameplay controls or cards. The preferred location is the bottom-right corner.

As part of the permanent iteration-completion invariant in DEPLOY-01, deployment verification confirms that the visible build number matches the GitHub Actions run number, that the visible timestamp matches the metadata injected into that build, and that the deployed page is not showing stale metadata from an earlier deployment. `BUILD-01` does not need to remain in `docs/next-iteration.md` after implementation for this verification rule to continue applying.

### Acceptance criteria

- The application visibly renders build metadata in the format `Build <number> · YYYY-MM-DD HH:mm UTC` in a fixed bottom-right position.
- Production builds receive their build number from `GITHUB_RUN_NUMBER` and receive an unambiguous UTC build timestamp generated during the workflow/build.
- The production bundle contains the concrete number and timestamp and does not fetch GitHub APIs at runtime for them.
- Local development has a safe `dev` fallback, while the GitHub Pages production build fails rather than silently displaying `dev`.
- The metadata remains visible across Apartment and other Rooms, is unaffected by Room zoom, and does not obscure important gameplay UI.
- Automated tests cover supplied metadata rendering and any nontrivial formatting or production-fallback protection.
- Deployment browser verification matches the displayed values to the successful workflow run and injected build metadata, rules out stale deployment content, confirms assets and basic interaction, and finds no new console errors.

### Implementation status

Implemented with Vite-injected compile-time metadata, a fixed bottom-right display, GitHub Actions run-number/timestamp injection, focused tests, and permanent deployment-verification instructions.
