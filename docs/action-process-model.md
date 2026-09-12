# Safe Room - Action and Process model

This document defines the current design for Actions, card-on-card triggers, world time, Processes, and hidden card state.

It is a design contract. Implementation details may change, but runtime behavior must preserve these rules unless Simon explicitly changes the design.

## Terminology

For a card-on-card drag/drop interaction:

- **accepted card** - the card the player dragged and dropped;
- **received card** - the card underneath that receives the drop.

These role names remain stable regardless of which card master owns the Action definition.

## Action ownership and triggers

There is no separate `accept` gameplay concept.

A card master owns Actions. Each Action has a trigger that determines when that Action applies.

For card-on-card interactions there are two trigger directions:

- `on` - the Action is authored on the accepted card and matches the received card;
- `receive` - the Action is authored on the received card and matches the accepted card.

Conceptually:

```json
{
  "trigger": {
    "on": {
      "card": "body"
    }
  },
  "name": "Eat",
  "time": "0m",
  "effects": []
}
```

means: when this card is dropped **on Body**, start this Action.

Conceptually:

```json
{
  "trigger": {
    "receive": {
      "markers": ["cutting-tool"]
    }
  },
  "name": "Skin",
  "time": "15m",
  "effects": []
}
```

means: when this card **receives a card with `cutting-tool`**, start this Action.

A trigger selector may match by stable card ID, required Marker IDs, or both. When both are present, all requirements must match.

## Requirements on the Action-owning card

The trigger selector describes the counterpart card.

Requirements on the card that owns the Action are separate and use `requires`.

Example: a Plastic Bottle owns Drink because consumable behavior belongs with the consumable item, not as an ever-growing list on Body.

Conceptually:

```json
{
  "trigger": {
    "on": {
      "card": "body"
    }
  },
  "requires": {
    "markers": ["contains-water"]
  },
  "name": "Drink",
  "time": "0m",
  "effects": [
    {
      "change": "hydration",
      "target": "received",
      "amount": 25
    },
    {
      "remove": "contains-water",
      "target": "accepted"
    }
  ]
}
```

This keeps Body small. Canned Food, Rat Meat, Rotten Meat, Plastic Bottle, medicine, and future consumables normally own their own behavior.

`receive` remains appropriate when behavior naturally belongs to the receiving object, such as Dead Rat receiving a Cutting Tool.

## Action resolution on drag-end

A card-on-card Action starts on player drag-end/drop.

At drag-end:

1. the dragged card becomes `accepted`;
2. the card underneath becomes `received`;
3. find Actions on the accepted card whose `on` trigger matches received;
4. find Actions on the received card whose `receive` trigger matches accepted;
5. evaluate requirements on each Action-owning card;
6. resolve the result.

Resolution must produce:

- **0 matching Actions** - illegal/non-interacting drop; no Action starts;
- **1 matching Action** - that Action starts;
- **2 or more matching Actions** - invalid authored data.

The runtime must never choose one ambiguous Action by ordering or precedence.

## Ambiguity validation

Authored-data validation must reject Action definitions whose match domains can overlap for the same accepted/received pair.

This includes:

- two overlapping Actions on the same card master;
- an `on` Action on the accepted card and a `receive` Action on the received card that can both match the same drop;
- selectors that overlap through card IDs, Marker requirements, or combinations of both.

The error must be descriptive and identify at least:

- accepted card master ID;
- received card master ID;
- each matching Action name when present;
- JSON path/index for each conflicting Action.

Runtime Action resolution must also assert that no more than one Action matches. The runtime assertion is a safety net; ambiguity should normally be caught during authored-data validation.

## Action execution

Only one Action may be under execution at a time.

Potentially many Processes may be active while that Action executes.

Every Action has an explicit duration. Instant Actions use `0m`. There is no default duration.

Normal Action effects are completion effects. They do not execute once per 15-minute tick merely because the Action takes time.

Example for a 30-minute Skin Action beginning at 10:07:

```text
10:07  Action starts
10:15  world tick
10:30  world tick
10:37  Action completes and completion effects execute
```

A `0m` Action starts and completes at the same world time and crosses no world tick.

Effect targets in card-on-card Actions use the stable interaction roles `accepted` and `received`, not ownership-relative names such as `self`, `source`, or `receiver`.

## World time and ticks

Only Actions advance world time.

The world has one global 15-minute update grid:

- `:00`
- `:15`
- `:30`
- `:45`

While an Action executes, every crossed global quarter-hour boundary produces one world tick.

For an Action moving time from `oldElapsedMinutes` to `newElapsedMinutes`, the number of crossed ticks is equivalent to:

```text
floor(newElapsedMinutes / 15) - floor(oldElapsedMinutes / 15)
```

Examples:

- 10 -> 14: 0 ticks
- 10 -> 16: 1 tick
- 14 -> 31: 2 ticks
- 44 -> 61: 2 ticks
- 0-minute Action: 0 ticks

All time-consuming Action paths, including travel, Search, and future card Actions, must use the same centralized time-advance mechanism.

## Process model

A Process has no private timer, interval, or duration.

Every active Process updates exactly once on every global world tick.

Therefore Process authored data must not contain `interval`, `intervalMinutes`, or another per-Process clock.

Conceptually Body Hydration is:

```json
{
  "processes": [
    {
      "effects": [
        {
          "change": "hydration",
          "amount": -2
        }
      ]
    }
  ]
}
```

At every world tick all active Processes participate in one world update.

Process ordering in JSON must not become gameplay semantics. The world update is resolved as one tick, not as a sequence whose result depends on file ordering.

There may be one Action executing and many active Processes updating during that Action.

Finite or staged Processes are represented through card state, Process effects, and conditions/thresholds rather than by giving each Process a separate timer. Concrete progression rules are authored only when their gameplay is decided.

## Tick and Action completion at the same time

If an Action completes exactly on a global world-tick boundary, the order is fixed:

1. advance world time to the boundary;
2. run the world tick and all active Processes;
3. resolve consequences of that world update;
4. complete the Action;
5. execute the Action completion effects.

Example:

```text
10:00  Action starts, duration 15m
10:15  world tick and Process update
10:15  Action completes afterward
```

The Action cannot complete just before a world tick occurring at the same timestamp.

## Visible and hidden Values

Cards may contain both visible and hidden numeric state.

- **Values** are player-facing numeric attributes and are rendered on the card.
- **Hidden Values** are card-instance numeric state used for internal game logic and are not rendered in normal UI.

A working JSON representation is:

```json
{
  "values": {
    "infection": 50
  },
  "hiddenValues": {
    "healing-progress": 0
  }
}
```

Hidden Values:

- use stable lowercase kebab-case IDs;
- belong to individual card instances and are cloned from master starting state;
- may receive instance overrides;
- may be referenced by Actions, Processes, and conditions when such behavior is authored;
- do not require player-facing metadata in `attributes.json` unless they later become visible;
- must not automatically appear in CardView, inspection UI, previews, or normal player-facing attribute lists.

Hidden Values exist so internal logic does not require fake visible attributes or ad-hoc TypeScript state.

General bounds/clamping rules for Hidden Values are not defined until a concrete mechanic needs them.

## Current unresolved details

This model deliberately does not decide:

- general Hidden Value bounds/clamping;
- whether Hidden Values affect Stack eligibility;
- generic conflict resolution for future Process effects that make incompatible changes in the same world tick;
- interruption/cancellation rules for a currently executing Action if a future Process invalidates one of its involved cards.

Those rules should be decided from concrete gameplay needs rather than invented as infrastructure.