# Safe Room data language

## Purpose

Safe Room's authored game content lives in plain UTF-8 text files.

The text data is the source of truth for:

- card master definitions and their authored properties;
- card attributes and authored interaction/process data;
- level design, including rooms and the cards/initial state placed in them.

Game code may parse, validate, index, or transform this data into runtime structures, but it must not duplicate card masters or level layouts as TypeScript/React constants.

## Authoring goals

The format follows the earlier Safe Room **Data language** discussion. Its priority is extremely low authoring friction rather than compatibility with a generic interchange format.

- Keep boilerplate as close to zero as practical.
- Make files easy to type and edit from a phone.
- Prefer plain lines and obvious context over structural punctuation.
- Do not require tabs.
- Do not require braces.
- Do not require an author to specify array/list lengths.
- Do not repeatedly require field labels such as `name`, `damage`, or similar when the surrounding structure already makes the meaning unambiguous.
- Lists should be dynamic: authors add another line/entry rather than changing a declared count.
- Keep the files pleasant to jot ideas into before every detail is known.

JSON, YAML, TOON, and the older modified-properties approach are not the authoring format merely because parsers already exist for them. The project should keep the terse text-language direction instead.

## Card attributes

The data language must map directly onto the game's visible attribute model without introducing a second taxonomy.

- A Marker can be represented tersely as its attribute name.
- A Value can be represented tersely as its attribute name followed by its integer value.

Examples of the intended authoring feel are `Anchored`, `Cutting Tool`, `Sterilized`, `Container`, `Contains-Water`, `Durability 80`, `Infection 50`, and `Hydration 50`.

Unless Simon explicitly defines a different range for a specific Value, every Value is bounded from **0 to 100**. Value changes are clamped at those bounds by default.

Parser-facing attribute names may use hyphens to avoid spaces. The UI renders those hyphens as spaces. For example, `Contains-Water` is displayed to the player as **Contains Water**.

These examples express the desired low-boilerplate style. Do not turn them into a more verbose key/value object model during implementation.

Mutable object state should prefer Markers/Values on the same card identity where appropriate. Example: a `Plastic Bottle` remains the same card whether full or empty; it always has `Container`, and it has `Contains-Water` only while it contains water.

## Card descriptions

Card descriptions are authored in `data/cards.txt` as part of the card master definition.

A description line begins with `>` and appears immediately after the picture path. Example:

```text
Body
images/body.png
> Nadir's physical condition and basic survival needs.
Anchored
Hydration 50
Satiation 50
```

The description is optional. If no `>` description line is present, the card still exists normally and the hover-inspection UI displays `missing description` for the card description.

The `>` marker is intentionally terse so adding a description does not require a repeated `description` key.

## Attribute descriptions

Shared attribute explanations are authored separately in `data/attributes.txt`.

Each entry contains the attribute name on the first line and one explanatory paragraph on the following line. Blank lines separate entries. Example:

```text
Hydration
How well hydrated Nadir is. Reaching zero is fatal.

Satiation
How well fed Nadir is. Reaching zero is fatal.

Anchored
This card belongs permanently to its home zone.
```

Each attribute has one master description reused wherever that attribute appears. Do not duplicate the same explanation inside individual card masters or hard-code attribute help text in React components.

## Interaction requirements

When an Action or other interaction accepts a source based on more than one Marker, combine the required Markers with `+`.

Example:

`action Fabric+Sterilized Dress 15m`

means the dragged source card must carry both `Fabric` and `Sterilized`.

A single Marker requirement remains unadorned, for example `action Contains-Water Clean 15m`.

When a card is itself the source of an Action and eligibility depends on one of its own mutable Markers, state that explicitly. Current draft example:

`requires Contains-Water self`

A receiving card may be named directly in source-card interaction data. Current examples include `action Body Drink 0m` and `eat Body`.

## Removal vocabulary

When a card leaves play, use `discard`, not `remove`.

Examples:

- `discard self`
- `at progress 100 discard self`

Use `remove` for removing an attribute/Marker from an existing card instance, for example `remove Contains-Water source` or `remove Contains-Water self`.

## Explicit time

Every authored **Action** and **Process** must include an explicit time value in the data.

Examples:

- `Skin 15m`
- `Sleep 8h`
- `action Body Drink 0m`
- fabric sterilization must explicitly say `1h`
- a repeating Process may use its explicit tick interval, e.g. a wound or Hydration Process evaluated every `15m`

There is no implicit default duration. If the duration or tick interval of an Action or Process has not yet been designed, that authored behavior is incomplete and should remain visibly unresolved rather than receiving a guessed time.

Only Actions advance game time. A Process time describes how much elapsed game time must accumulate before that Process evaluates/progresses; it does not itself create elapsed time.

## Conditional ranges

For parser-friendly conditional data, numeric bands use explicit `start..end` syntax instead of comparison operators.

Current Flesh Wound example:

- `if Infection 0..24 progress +2`
- `if Infection 25..49 progress +1`
- `if Infection 50..74 progress +0`
- `if Infection 75..100 progress -1`

The bands are non-overlapping and cover the full default `0..100` Infection range.

## Current format draft

`data/cards.txt` contains the first concrete draft of the card-data format using current Safe Room card decisions.

The draft currently uses:

- blank lines to separate card masters;
- the card title as the first line;
- the picture path as the second line;
- an optional `>` description line immediately after the picture path;
- Marker names as plain lines;
- Values as `name integer`;
- Values bounded to `0..100` by default unless explicitly overridden;
- hyphens inside parser-facing attribute names where spaces would make parsing awkward; the UI displays those hyphens as spaces;
- `+` between Marker names when a source must satisfy all listed Markers;
- explicit time tokens such as `0m`, `15m`, `1h`, or `8h` on every Action/Process;
- `start..end` numeric bands for conditional ranges;
- `discard` for removing cards from play and `remove` for removing attributes from a surviving card;
- short behavior verbs only where the data needs to express an Action, Process, input, output, condition, or state change.

`data/attributes.txt` contains one master explanatory paragraph per attribute for hover inspection.

This file exists so the format can be judged against real Safe Room data. Keep changing syntax if doing so removes boilerplate or ambiguity while preserving phone-friendly authoring, but syntax explicitly decided by Simon should not be changed silently during implementation.

## Level design

Level design uses the same text-data philosophy and parser/tooling family as card data.

The runtime world should be constructed from authored text data rather than from room-specific setup code. At minimum, level data must be able to identify rooms and the card instances/starting state that belong in them. As more world relationships become implementation-relevant, extend the text format rather than moving those authored facts into code.

This makes the data files the place where Simon can both design cards and author the playable world.

## Evolution rule

Do not pre-design a large general-purpose configuration language. Add syntax only when a concrete Safe Room data need requires it, and choose the shortest unambiguous form that remains readable.

When the parser gains new syntax, document that syntax here with a small real game-data example.

## Milestone 2 parser subset

The prototype deliberately parses only the authored forms used by
`data/cards.txt`, `data/attributes.txt`, and `data/rooms.txt`.

Card masters currently support:

- title, image path, and an optional `>` description;
- Marker lines and `Name integer` Values before behavior statements;
- `size Small|Medium|Large`;
- `equip <slot>` for authored non-Hand compatibility and active-effect context; either Hand accepts any ordinary movable item through the general equipment rule, so `equip Hand` is needed only when an authored effect is specifically active in a Hand;
- `storage <size> <count> [main]`, where `main` delays capacity until the
  opening has ended;
- `while-equipped <Value> <signed integer>`;
- the Milestone 1 eating subset: `eat Body`, signed target Value changes, and
  `consume self`.

Room data currently supports the forms documented in `data/rooms.txt`.
`deck <name> <duration>` authors the Search deck's base duration. Instance
overrides support `+Marker`, `Value <integer>`, and
`-> <destination room> <duration>`.

These are implementation boundaries for the current slice, not a generic
configuration language or a promise to execute unfinished historical
Action/Process sketches. Malformed lines in supported syntax produce
line-numbered parser errors.
