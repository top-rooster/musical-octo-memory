# Safe Room - Action and Process model

This document defines the current design contract for card Actions, card-owned attributes, world time, Processes, and hidden card state.

## Nadir state cards

Nadir is represented by three persistent anchored Inventory cards:

- **Body** - physical state and bodily survival needs;
- **Mind** - perception/cognitive state;
- **Spirit** - emotional/spiritual state.

There is no separate generic Nadir card. Actions belong on the state card that naturally represents what Nadir is doing or what part of his state is affected.

Current examples in this document use Body for Travel, Eat, and Drink.

## Interaction terminology

For a card-on-card drag/drop interaction:

- **accepted card** - the card being dragged and dropped;
- **received card** - the card underneath that receives the drop.

These role names do not depend on which card owns the Action.

## Actions and triggers

There is no separate `accept` gameplay concept.

A card owns Actions. Each Action has a trigger that determines when it applies.

For card-on-card interactions:

- `on` - the Action is authored on the accepted card and matches the received card;
- `receive` - the Action is authored on the received card and matches the accepted card.

A trigger may match by stable card ID, Marker requirements, or attribute presence. These requirements may be combined, and when combined all must match. Requirements on the Action-owning card remain separate from the trigger.

At drag-end:

1. resolve the dragged card as `accepted` and the card underneath as `received`;
2. find matching `on` Actions on accepted and matching `receive` Actions on received;
3. evaluate Action requirements;
4. resolve the result.

The result must be:

- 0 matches: no Action starts;
- 1 match: that Action starts;
- 2+ matches: invalid authored data.

Authored-data validation must reject overlapping Action match domains. Runtime resolution must also assert that no more than one Action matches.

## Actions describe what Nadir does

The Action owns the verb. The triggering card state/attribute owns the concrete eligibility, data, and effects contributed by the object being used.

This keeps generic behavior on Body instead of producing long lists of item-specific Actions there.

The current Body model is:

```text
Travel  -> Body is dropped on a card with Path
Eat     -> Body receives a card with Food
Drink   -> Body receives a card with Contains Water and Hydration
```

Conceptually:

```json
{
  "actions": [
    {
      "name": "Travel",
      "trigger": {
        "on": {
          "attribute": "path"
        }
      }
    },
    {
      "name": "Eat",
      "trigger": {
        "receive": {
          "attribute": "food"
        }
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
}
```

This is conceptual schema. Exact JSON field layout may evolve, but the ownership and runtime semantics are decided.

`contains-water` is deliberately part of the Drink trigger. It represents current water presence. The `hydration` attribute provides the concrete effect payload and does not by itself mean that a container currently contains water.

## Structured card attributes

Cards may carry typed attributes with authored payload beyond Marker presence or a single numeric Value.

The current concrete structured attributes are `path`, `food`, and `hydration`.

### Path

Every card that represents a passage to another Room has a `path` attribute.

`path` owns:

- the target Room ID;
- the travel time.

Example:

```json
{
  "path": {
    "room": "deep-tunnels",
    "time": "30m"
  }
}
```

Body owns one generic Travel Action. Travel triggers when Body is dropped on a card with `path`.

The Travel Action reads destination and duration from that Path. Route cards do not need their own Travel Actions, and travel destination/time must not also be duplicated in room data or a separate `go` effect.

Different route-card masters may still share the same visible name while carrying different Path targets or times.

### Food

Cards that can be eaten carry a `food` attribute.

Body owns one generic Eat Action. Eat triggers when Body receives a card with `food`.

The Food attribute owns the concrete completion effects of eating that card. Body must not contain a list of every edible master or duplicate the food's effects.

Conceptually:

```json
{
  "food": {
    "effects": [
      {
        "change": "satiation",
        "target": "received",
        "amount": 15
      },
      {
        "discard": "accepted"
      }
    ]
  }
}
```

A different food can provide different effects without changing Body or the Eat Action. For example, spoiled food may add an additional negative effect.

Do not duplicate the same sustenance number both as a Food property and as an effect amount unless a future mechanic genuinely needs both representations.

### Hydration and Contains Water

A card that can provide hydration carries a `hydration` structured attribute describing the concrete completion effects of drinking from it.

A container currently holding water carries the mutable Marker `contains-water`.

Body owns one generic Drink Action. Drink triggers only when Body receives a card that satisfies the Drink trigger, including `contains-water`. In the current model the same card also provides the `hydration` attribute from which Drink obtains its completion effects.

Conceptually:

```json
{
  "markers": ["container", "contains-water"],
  "hydration": {
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
}
```

After drinking, removing `contains-water` makes the same container no longer a legal Drink source. The `hydration` behavior payload may remain on the card so refilling the container can make the same Drink interaction legal again.

Do not duplicate current water presence in another state system merely because `hydration` exists.

## Action effects and duration

Normal Action effects are completion effects. They do not execute once per world tick merely because the Action takes time.

Effect targets in card-on-card Actions use the stable roles `accepted` and `received`.

There is no implicit/default Action duration. An Action must resolve an explicit execution duration when it starts.

The duration may be authored directly on the Action or supplied by the triggering attribute when that attribute defines the duration. Travel is the concrete current example: `path.time` supplies Travel duration.

A `0m` Action starts and completes at the same world time and crosses no world tick.

Only one Action may be under execution at a time.

Potentially many Processes may be active while that Action executes.

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

All time-consuming Action paths, including Travel, Search, and future card Actions, must use the same centralized time-advance mechanism.

## Process model

A Process has no private timer, interval, or duration.

Every active Process updates exactly once on every global world tick.

Process authored data must not contain `interval`, `intervalMinutes`, or another per-Process clock.

Body Hydration is the first concrete recurring Process:

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

At every world tick all active Processes participate in one world update. Process ordering in JSON must not become gameplay semantics.

Finite or staged Processes use card state, Process effects, and conditions/thresholds rather than acquiring independent timers.

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

## Visible and hidden Values

Cards may contain both visible and hidden numeric state.

- **Values** are player-facing numeric attributes and are rendered on the card.
- **Hidden Values** are card-instance numeric state used for internal game logic and are not rendered in normal UI.

Hidden Values:

- use stable lowercase kebab-case IDs;
- belong to individual card instances and are cloned from master starting state;
- may receive instance overrides;
- may be referenced by Actions, Processes, and conditions;
- do not require player-facing metadata unless they later become visible;
- must not automatically appear in CardView, inspection UI, previews, or normal player-facing attribute lists.

General bounds/clamping rules for Hidden Values remain undecided until a concrete mechanic needs them.

## Still unresolved

This model deliberately does not decide:

- general Hidden Value bounds/clamping;
- whether Hidden Values affect Stack eligibility;
- generic conflict resolution for future Process effects that make incompatible changes in the same world tick;
- interruption/cancellation rules if a Process invalidates an executing Action;
- a universal schema for every future structured attribute beyond the concrete Path, Food, and Hydration semantics above.
