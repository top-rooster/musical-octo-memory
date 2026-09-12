# Safe Room - Action and Process model

This document defines the current design contract for card Actions, card-owned attributes, world time, Processes, and hidden card state.

## Interaction terminology

For a card-on-card drag/drop interaction:

- **accepted card** - the card being dragged and dropped;
- **received card** - the card underneath that receives the drop.

These role names do not depend on which card owns the Action.

## Nadir is one anchored card

Nadir is represented by one persistent **Nadir** card anchored to Inventory.

His permanent player-facing state lives as attributes on that card. Current examples include `Hydration`, `Satiation`, and `Vision`.

Do not split his ordinary state across separate Body, Mind, or Spirit cards. Conditions that deserve their own identity may still exist as separate anchored condition cards.

This keeps the interaction language uniform: food can be dragged onto Nadir, Nadir can be dragged onto a route card, and understood stat changes can be previewed directly on the Nadir card.

## Actions and triggers

There is no separate `accept` gameplay concept.

A card owns Actions. Each Action has a trigger that determines when it applies.

For card-on-card interactions:

- `on` - the Action is authored on the accepted card and matches the received card;
- `receive` - the Action is authored on the received card and matches the accepted card.

A trigger may match by stable card ID, Marker requirements, or attribute presence. Requirements on the Action-owning card remain separate from the trigger.

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

The Action owns the verb. The triggering card attribute owns the concrete data and effects contributed by the object being used.

The current Nadir model is:

```text
Travel  -> Nadir is dropped on a card with Path
Eat     -> Nadir receives a card with Food
Drink   -> Nadir receives a card with Hydration
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
          "attribute": "hydration"
        }
      }
    }
  ]
}
```

This is conceptual schema. Exact JSON field layout may evolve, but the ownership and runtime semantics are decided.

Do not turn Nadir into a registry of every edible, drinkable, or traversable card ID. Generic Actions belong on Nadir; object-specific payload belongs on the object attribute.

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

Nadir owns one generic Travel Action. Travel triggers when Nadir is dropped on a card with `path`.

The Travel Action reads destination and duration from that Path. Route cards do not need their own Travel Actions, and travel destination/time must not also be duplicated in room data or a separate `go` effect.

Different route-card masters may still share the same visible name while carrying different Path targets or times.

### Food

Cards that can be eaten carry a `food` attribute.

Nadir owns one generic Eat Action. Eat triggers when Nadir receives a card with `food`.

The Food attribute owns the concrete completion effects of eating that card. Nadir must not contain a list of every edible master or duplicate the food's effects.

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

A different food can provide different effects without changing Nadir or the Eat Action. For example, spoiled food may add an additional negative effect.

Do not duplicate the same sustenance number both as a Food property and as an effect amount unless a future mechanic genuinely needs both representations.

### Hydration

Cards that can be drunk from carry a `hydration` attribute.

Nadir owns one generic Drink Action. Drink triggers when Nadir receives a card with `hydration`.

The Hydration attribute owns the concrete completion effects of drinking from that card.

Conceptually:

```json
{
  "hydration": {
    "effects": [
      {
        "change": "hydration",
        "target": "received",
        "amount": 25
      },
      {
        "remove": "hydration",
        "target": "accepted"
      }
    ]
  }
}
```

The example only illustrates ownership. Exact container/water-state representation must follow the concrete authored model and must not be duplicated merely to fit the example.

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

Nadir's Hydration loss is the first concrete recurring Process:

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

Nadir's survival state that the player needs in order to make routine decisions must remain visible on Nadir. Hidden Values are not a license to recreate opaque survival bars or invisible hunger/fullness systems.

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
