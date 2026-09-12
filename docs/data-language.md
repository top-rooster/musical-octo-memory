# Safe Room authored JSON

## Purpose

Safe Room's runtime-authored content has one source of truth:

- `data/cards.json` owns card masters and card-owned behavior;
- `data/rooms.json` owns world composition, Nadir state cards, room instances, opening configuration, and Search decks;
- `data/attributes.json` owns player-facing attribute names and descriptions.

All three files are strict JSON: no comments, JSONC, or trailing commas. Design notes and unresolved values belong in focused documents or `docs/backlog.md`, not runtime data.

## Schema discipline

Do not invent new JSON structure unless Simon explicitly asks for it.

In particular, do not introduce a new field, object shape, array shape, wrapper, or special-purpose datatype merely because it would make implementation convenient. Reuse the already-decided concepts such as Markers, Values, References, Actions, Processes, and the explicitly decided structured attributes.

If a required mechanic cannot be represented with the existing decided model, record the missing design decision instead of silently creating a new JSON schema.

Documentation must not present speculative JSON as though it were decided authored data. Where exact existing Reference syntax is not being restated from the authoritative implementation/schema, describe the semantic Reference requirement without inventing syntax.

## Stable identity

Card, room, deck, Marker, Value, Reference target, structured-attribute, and equipment-slot references use stable lowercase kebab-case IDs. Object keys define master identities. Display names are presentation metadata and may change or be duplicated without changing runtime identity.

For example, `go-tunnels-from-office` and `go-tunnels-from-deep-tunnels` are distinct masters even though both display as **Go to tunnels**. Runtime code must not derive IDs by slugifying display names.

## Attributes

`attributes.json` maps player-facing attribute IDs to name and description metadata.

Card-master Markers are ID arrays and Values are ID-to-integer maps.

Values use bounds `0..100` unless a concrete Value explicitly defines otherwise. Instance Marker overrides may change mutable Marker state. Instance Value overrides may replace Values already present on the master.

Cards may also carry typed structured attributes with authored payload. The currently decided concrete examples are `path`, `food`, and `hydration`.

`contains-water` remains a Marker representing current water presence. It is not replaced by the `hydration` structured attribute.

### Item size

Item size uses the ordinary Marker system. The current size Markers are:

- `small`;
- `medium`;
- `large`.

A size-based carried item has exactly one size Marker. There is no separate card `size` field or separate size datatype.

### Storage capacity

Carried-storage capacity uses ordinary Values rather than a separate `storage` object. The current capacity Values are:

- `storage-small`;
- `storage-medium`;
- `storage-large`.

Pants have `storage-small = 2`. Simple Backpack has `storage-medium = 5`.

An equipped card contributes its storage-capacity Values to the flat carried Inventory. A carried but unequipped storage item does not contribute those Values as active capacity.

Storage/packing code matches item size Markers against the aggregated equipped `storage-*` Values. Do not duplicate size or storage capacity in parallel fields.

## Equipment compatibility uses References

Compatibility with non-Hand equipment slots is represented through the existing **Reference** mechanism, not through a separate `equip` field.

For example, a T-Shirt's relationship to the Chest slot is an equipment-slot Reference. The exact JSON syntax must use the project's existing Reference representation; this document deliberately does not invent or redefine that structure.

Hands are different: every ordinary movable card may be placed in Left Hand or Right Hand by the general Hand rule. Cards therefore do **not** need authored References to `left-hand` or `right-hand` merely to be holdable.

Anchored world cards and Nadir-state cards remain excluded from Hands by the general rule.

## Card masters and Actions

`cards.json` uses card IDs as top-level keys. Concrete authored data may include display metadata, Markers, Values, Hidden Values, References, the explicitly decided structured attributes, Actions, Processes, and equipped modifiers according to already-decided schema.

There is no separate `size` field, no separate `storage` field, and no separate `equip` field in the target model.

There is no receiver-owned `accept` gameplay model in the current design.

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` Actions belong to accepted and match received;
- `receive` Actions belong to received and match accepted.

Trigger selectors may combine stable card IDs, Marker requirements, and structured-attribute presence. Combined requirements are conjunctive.

For Drink, `contains-water` is part of legality. The incoming card's `hydration` attribute owns the concrete completion effects. Drinking may remove `contains-water` while leaving the reusable hydration behavior payload on the same container.

Use only concrete effect forms required by authored behavior. Do not introduce a generic scripting language.

Every executable Action must resolve an explicit duration. Instant Actions use `0m`. Duration may be authored directly on the Action or supplied by a structured attribute when that attribute owns the duration. Travel uses `path.time`.

## Structured attributes

### Path

A route card's `path` owns destination and base travel duration. Destination and base travel duration must not be duplicated in room composition, route-specific Travel Actions, or a separate `go` effect.

### Food

`food` owns the concrete completion effects contributed by an edible card. Body owns the generic Eat Action.

### Hydration

`hydration` owns the concrete completion effects contributed when drinking from a water-bearing card. Body owns the generic Drink Action.

Current water presence is separate mutable state expressed by `contains-water`, and that Marker is part of the Drink trigger.

## World composition and instances

`rooms.json` defines `start`, the shared `searchBack`, persistent Nadir state card IDs, and a stable-ID `rooms` object. Rooms own display/background/light metadata, opening configuration, placed card instances, and stable-ID Search decks.

Runtime creation clones a master's starting state before applying valid overrides. Instances never mutate their master or one another.

Search duration is deck data. Search decks are room-local interactive objects, not cards.

## Validation

The centralized JSON loading path validates all authored documents before transforming them into typed runtime structures.

Validation must cover at least:

- stable ID form;
- cross-file references;
- valid References and Reference targets;
- structured-attribute references such as `path.room`;
- explicit/resolvable Action durations;
- instance overrides;
- supported effect targets;
- Action trigger validity;
- overlapping Action match domains that could yield more than one Action for the same card pair;
- size Marker validity: size-based carried cards use exactly one of `small`, `medium`, or `large`, and no standalone `size` field is permitted;
- storage capacity validity: capacity is represented through `storage-small`, `storage-medium`, and `storage-large` Values, and no standalone `storage` field is permitted;
- equipment compatibility is expressed through References for non-Hand slots; a standalone `equip` field is not permitted;
- ordinary Hand compatibility is not authored per card.

Invalid authored data fails startup rather than falling back to a legacy format.
