# Safe Room authored JSON

## Purpose

Safe Room's runtime-authored content has one source of truth:

- `data/cards.json` owns card masters and card-owned behavior;
- `data/rooms.json` owns world composition, Nadir state cards, room instances, opening configuration, and Search decks;
- `data/attributes.json` owns player-facing attribute names and descriptions.

All three files are strict JSON: no comments, JSONC, or trailing commas. Design notes and unresolved values belong in focused documents or `docs/backlog.md`, not runtime data.

## Stable identity

Card, room, deck, Marker, Value, structured-attribute, and equipment-slot references use stable lowercase kebab-case IDs. Object keys define master identities. Display names are presentation metadata and may change or be duplicated without changing runtime identity.

For example, `go-tunnels-from-office` and `go-tunnels-from-deep-tunnels` are distinct masters even though both display as **Go to tunnels**. Runtime code must not derive IDs by slugifying display names.

## Attributes

`attributes.json` maps player-facing attribute IDs to name and description metadata.

Card-master Markers are ID arrays and Values are ID-to-integer maps:

```json
{
  "markers": ["anchored", "container", "contains-water", "medium"],
  "values": { "hydration": 50, "satiation": 50 }
}
```

Values use bounds `0..100` unless a concrete Value explicitly defines otherwise. Instance Marker overrides may change mutable Marker state. Instance Value overrides may replace Values already present on the master.

Cards may also carry typed structured attributes with authored payload. Current concrete examples are `path`, `food`, and `hydration`.

`contains-water` remains a Marker representing current water presence. It is not replaced by the `hydration` structured attribute.

Item size also uses the ordinary Marker system. The current size Markers are `small`, `medium`, and `large`. A size-based carried item has exactly one of these Markers. There is no separate card `size` field or separate size attribute type.

Storage/packing code matches these Markers against available Small/Medium/Large capacity. Do not duplicate the same size information in another field.

## Card masters and Actions

`cards.json` uses card IDs as top-level keys. Concrete fields may include display metadata, Markers, Values, Hidden Values, structured attributes, Actions, Processes, equipment compatibility, storage, and equipped modifiers.

There is no receiver-owned `accept` gameplay model in the current design.

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`;
- `on` Actions belong to accepted and match received;
- `receive` Actions belong to received and match accepted.

Trigger selectors may combine stable card IDs, Marker requirements, and structured-attribute presence. Combined requirements are conjunctive.

Conceptual Body Actions:

```json
"actions": [
  {
    "name": "Travel",
    "trigger": {
      "on": { "attribute": "path" }
    }
  },
  {
    "name": "Eat",
    "trigger": {
      "receive": { "attribute": "food" }
    }
  },
  {
    "name": "Drink",
    "trigger": {
      "receive": {
        "markers": ["contains-water"],
        "attribute": "hydration"
      }
    }
  }
]
```

The schema above is conceptual where exact field layout is still implementation-owned, but the trigger semantics are fixed.

For Drink, `contains-water` is part of legality. The incoming card's `hydration` attribute owns the concrete completion effects. Drinking may remove `contains-water` while leaving the reusable hydration behavior payload on the same container.

Use only concrete effect forms required by authored behavior. Do not introduce a generic scripting language.

Every executable Action must resolve an explicit duration. Instant Actions use `0m`. Duration may be authored directly on the Action or supplied by a structured attribute when that attribute owns the duration. Travel uses `path.time`.

## Structured attributes

### Path

A route card's `path` owns destination and base travel duration:

```json
"path": {
  "room": "deep-tunnels",
  "time": "30m"
}
```

Destination and base travel duration must not be duplicated in room composition, route-specific Travel Actions, or a separate `go` effect.

### Food

`food` owns the concrete completion effects contributed by an edible card. Body owns the generic Eat Action.

### Hydration

`hydration` owns the concrete completion effects contributed when drinking from a water-bearing card. Body owns the generic Drink Action.

Current water presence is separate mutable state expressed by `contains-water`, and that Marker is part of the Drink trigger.

## World composition and instances

`rooms.json` defines `start`, the shared `searchBack`, persistent Nadir state card IDs, and a stable-ID `rooms` object. Rooms own display/background/light metadata, opening configuration, placed card instances, and stable-ID Search decks.

A simple instance is its card ID:

```json
"scrap-metal"
```

Use an object only when an instance has state overrides:

```json
{ "card": "flashlight", "values": { "battery": 0 } }
```

Runtime creation clones the master's starting state before applying valid overrides. Instances never mutate their master or one another.

Search duration is deck data. Deck contents use the same string-or-override-object representation as other room instances. Search decks are room-local interactive objects, not cards.

## Validation

The centralized JSON loading path validates all authored documents before transforming them into typed runtime structures.

Validation must cover at least:

- stable ID form;
- cross-file references;
- structured-attribute references such as `path.room`;
- explicit/resolvable Action durations;
- instance overrides;
- supported effect targets;
- supported equipment-slot IDs;
- Action trigger validity;
- overlapping Action match domains that could yield more than one Action for the same card pair;
- size Marker validity: size-based carried cards must use exactly one of `small`, `medium`, or `large`, and no standalone `size` field is permitted.

Invalid authored data fails startup rather than falling back to a legacy format.
