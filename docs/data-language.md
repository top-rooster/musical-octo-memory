# Safe Room authored JSON

## Purpose

Safe Room's runtime-authored content has one source of truth:

- `data/cards.json` owns card masters and card-owned behavior;
- `data/rooms.json` owns world composition, Nadir state cards, room instances, opening configuration, and Search decks;
- `data/attributes.json` owns player-facing attribute names and descriptions.

All three files are strict JSON: no comments, JSONC, or trailing commas. Design notes and unresolved values belong in focused documents or `docs/backlog.md`, not runtime data.

## Stable identity

Card, room, deck, Marker, Value, and equipment-slot references use stable lowercase kebab-case IDs. Object keys define master identities. Display names are presentation metadata and may change or be duplicated without changing runtime identity.

For example, `go-tunnels-from-office` and `go-tunnels-from-deep-tunnels` are distinct masters even though both display as **Go to tunnels**. Runtime code must not derive IDs by slugifying display names.

## Attributes

`attributes.json` maps each stable attribute ID to `name` and `description`. It does not classify an attribute as a Marker or Value; usage on a card or instance supplies that distinction.

Card-master Markers are ID arrays and Values are ID-to-integer maps:

```json
{
  "markers": ["anchored", "container"],
  "values": { "hydration": 50, "satiation": 50 }
}
```

Values use bounds `0..100` unless a concrete Value explicitly defines otherwise. Instance Marker overrides add to the master's initial Marker set. Instance Value overrides may only replace Values already present on that master.

## Card masters and interactions

`cards.json` uses card IDs as top-level keys. Concrete fields include display metadata, attributes, size, equipment compatibility, storage, equipped modifiers, accepted interactions, Processes, and thresholds.

Interactions are receiver-owned: the master containing `accept` is the receiver, while `card` and `markers` are conjunctive requirements on the incoming source. Every Action has explicit `time`, including `0m`.

```json
"accept": [
  {
    "card": "plastic-bottle",
    "markers": ["contains-water"],
    "action": {
      "name": "Drink",
      "time": "0m",
      "effects": [
        { "change": "hydration", "target": "receiver", "amount": 25 },
        { "remove": "contains-water", "target": "source" }
      ]
    }
  }
]
```

Use only the concrete effect forms required by authored behavior. Do not introduce a generic scripting language. Travel is an accepted Body interaction on a route card; destination and duration never belong to room composition.

Processes and thresholds remain typed authored data even when their execution belongs to a later milestone. Never invent a missing duration, Value, condition, or effect to make an unfinished design appear complete.

## World composition and instances

`rooms.json` defines `start`, the shared `searchBack`, persistent `nadir` card IDs, and a stable-ID `rooms` object. Rooms own display/background/light metadata, opening configuration, placed card instances, and stable-ID Search decks.

A simple instance is its card ID:

```json
"scrap-metal"
```

Use an object only when an instance has state overrides:

```json
{ "card": "flashlight", "values": { "battery": 0 } }
```

Runtime creation clones the master's initial Markers and Values before applying overrides. Instances never mutate their master or one another.

Search duration is deck data. Deck contents use the same string-or-override-object representation as other room instances. Search decks are room-local interactive objects, not cards.

## Validation

The centralized JSON loading path validates all three documents before transforming them into typed runtime structures. Validation checks stable ID form, explicit durations, supported equipment-slot IDs, cross-file references, local Value references, instance overrides, and supported effect targets. Invalid authored data fails startup rather than falling back to a legacy format.
