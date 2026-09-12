# Safe Room authored JSON

## Purpose

Safe Room's runtime-authored content has one source of truth:

- `data/cards.json` owns card masters and card-owned behavior;
- `data/rooms.json` owns world composition, Nadir state cards, room instances, opening configuration, and Search decks;
- `data/attributes.json` owns player-facing attribute names and descriptions.

All three files are strict JSON. Design notes and unresolved values belong in focused documents or `docs/backlog.md`, not runtime data.

## Schema discipline

Do not invent new JSON structure unless Simon explicitly asks for it.

Do not introduce a new field, object shape, array shape, wrapper, or special-purpose authored datatype merely because it would make implementation convenient.

Reuse structures that are already explicitly decided. If a mechanic cannot be represented with the currently decided schema, record the missing design decision instead of silently creating syntax.

Documentation must not present speculative JSON as decided authored data.

## Stable identity

Card, room, deck, Marker, Value, Reference name/target, structured-attribute, and equipment-slot IDs use stable lowercase kebab-case IDs. Display names are presentation metadata and may change without changing runtime identity.

## Attributes

`attributes.json` maps player-facing attribute IDs to name and description metadata.

Card-master Markers are ID arrays and Values are ID-to-integer maps.

Values use bounds `0..100` unless a concrete Value explicitly defines otherwise. Instance Marker overrides may change mutable Marker state. Instance Value overrides may replace Values already present on the master.

The currently decided concrete structured attributes are `path`, `food`, and `hydration`.

`contains-water` remains a Marker representing current water presence. It is not replaced by `hydration`.

### Item size

Item size uses the ordinary Marker system:

- `small`;
- `medium`;
- `large`.

A size-based carried item has exactly one size Marker. There is no separate card `size` field or separate size datatype.

### Storage capacity

Carried-storage capacity uses ordinary Values:

- `storage-small`;
- `storage-medium`;
- `storage-large`.

Current examples:

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5`.

Only equipped cards contribute their storage-capacity Values to active carried capacity. Storage/packing matches item size Markers against aggregated equipped `storage-*` Values.

There is no separate `storage` object in the target model.

## References

References are authored on a card through a `references` object mapping a reference name to a reference target ID:

```json
"references": { "<reference name>": "<reference target id>" }
```

The reference name identifies the relationship. The value is the stable ID of the referenced target.

Do not expand this decided representation into arrays, nested objects, wrappers, or alternate forms unless Simon explicitly decides a different Reference structure.

Reference target IDs must be validated against the target set appropriate to that reference name.

### Equipment compatibility

Compatibility with non-Hand equipment slots is a Reference named `equip`.

Examples:

```json
"references": { "equip": "chest" }
```

```json
"references": { "equip": "legs" }
```

Current equipment semantics are:

- T-Shirt: `equip -> chest`;
- Pants: `equip -> legs`;
- Glasses: `equip -> eyes`;
- Simple Backpack: `equip -> back`.

Hands are different: every ordinary movable card may be placed in Left Hand or Right Hand by the general Hand rule. Ordinary cards do not need authored Hand References merely to be holdable. Anchored world cards and Nadir-state cards cannot be held.

The legacy standalone `equip` array is superseded by the `equip` Reference and must be removed once the migration is complete.

## Card masters and Actions

`cards.json` uses card IDs as top-level keys.

The target model removes separate `size` and `storage` data because those concepts are represented by Markers and Values.

The target model removes the standalone `equip` array because non-Hand equipment compatibility is represented through `references`.

The target model also removes the receiver-owned `accept` gameplay model in favor of trigger-based Actions as defined in `docs/action-process-model.md`.

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` Actions belong to accepted and match received;
- `receive` Actions belong to received and match accepted.

Trigger selectors may combine stable card IDs, Marker requirements, and structured-attribute presence. Combined requirements are conjunctive.

For Drink, `contains-water` is part of legality. The incoming card's `hydration` attribute owns the concrete completion effects.

Every executable Action must resolve an explicit duration. There is no default duration. Travel uses `path.time`.

Do not introduce a generic scripting language.

## Structured attributes

### Path

A route card's `path` owns destination and base travel duration. Destination and base travel duration must not be duplicated in room composition, route-specific Travel Actions, or a separate `go` effect.

### Food

`food` owns the concrete completion effects contributed by an edible card. Body owns the generic Eat Action.

### Hydration

`hydration` owns the concrete completion effects contributed when drinking from a water-bearing card. Body owns the generic Drink Action.

Current water presence is separate mutable state expressed by `contains-water`, and that Marker is part of the Drink trigger.

## World composition and instances

`rooms.json` defines the start room, persistent Nadir state cards, room composition, opening configuration, and Search decks.

Runtime creation clones a master's starting state before applying valid overrides. Instances never mutate their master or one another.

Search decks are room-local interactive objects, not cards.

## Validation

The centralized JSON loading path validates all authored documents before transforming them into typed runtime structures.

Validation must cover the concrete schema that has actually been decided, including stable IDs, cross-file IDs, instance overrides, Action duration resolution, effect targets, trigger validity, and Action ambiguity.

For the current migrations:

- size-based carried cards use exactly one of `small`, `medium`, or `large`, and no standalone `size` field remains;
- storage capacity uses `storage-small`, `storage-medium`, and `storage-large` Values, and no standalone `storage` field remains;
- References are represented only by the decided `references` object mapping names to target IDs;
- `references.equip`, when present, targets a valid non-Hand equipment-slot ID;
- the legacy standalone `equip` array is not permitted in the target model;
- ordinary Hand compatibility is not authored per card.

Invalid authored data fails startup rather than falling back to a legacy format.
