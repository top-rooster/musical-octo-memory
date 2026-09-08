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

Examples of the intended authoring feel are `Anchored`, `Cutting Tool`, `Sterilized`, `Container`, `Contains Water`, `Durability 80`, and `Infection 50`.

These examples express the desired low-boilerplate style. Do not turn them into a more verbose key/value object model during implementation.

Mutable object state should prefer Markers/Values on the same card identity where appropriate. Example: a `Plastic Bottle` remains the same card whether full or empty; it always has `Container`, and it has `Contains Water` only while it contains water.

## Interaction requirements

When an Action or other interaction accepts a source based on more than one Marker, combine the required Markers with `+`.

Example:

`action Fabric+Sterilized Dress 15m`

means the dragged source card must carry both `Fabric` and `Sterilized`.

A single Marker requirement remains unadorned, for example `action Contains Water Clean 15m`.

## Removal vocabulary

When a card leaves play, use `discard`, not `remove`.

Examples:

- `discard self`
- `at progress 100 discard self`

Use `remove` for removing an attribute/Marker from an existing card instance, for example `remove Contains Water source`.

## Explicit time

Every authored **Action** and **Process** must include an explicit time value in the data.

Examples:

- `Skin 15m`
- `Sleep 8h`
- an instant Action must still say `0m`
- fabric sterilization must explicitly say `1h`
- a repeating Process may use its explicit tick interval, e.g. a wound healing Process evaluated every `15m`

There is no implicit default duration. If the duration or tick interval of an Action or Process has not yet been designed, that authored behavior is incomplete and should remain visibly unresolved rather than receiving a guessed time.

Only Actions advance game time. A Process time describes how much elapsed game time must accumulate before that Process evaluates/progresses; it does not itself create elapsed time.

## Current format draft

`data/cards.txt` contains the first concrete draft of the card-data format using current Safe Room card decisions.

The draft currently uses:

- blank lines to separate card masters;
- the card title as the first line;
- the picture path as the second line;
- Marker names as plain lines;
- Values as `name integer`;
- `+` between Marker names when a source must satisfy all listed Markers;
- explicit time tokens such as `0m`, `15m`, `1h`, or `8h` on every Action/Process;
- `discard` for removing cards from play and `remove` for removing attributes from a surviving card;
- short behavior verbs only where the data needs to express an Action, Process, input, output, condition, or state change.

This file exists so the format can be judged against real Safe Room data. The syntax in `data/cards.txt` is **not yet a locked design decision**. Keep changing it if doing so removes boilerplate or ambiguity while preserving phone-friendly authoring.

## Level design

Level design uses the same text-data philosophy and parser/tooling family as card data.

The runtime world should be constructed from authored text data rather than from room-specific setup code. At minimum, level data must be able to identify rooms and the card instances/starting state that belong in them. As more authored world relationships become implementation-relevant, extend the text format rather than moving those authored facts into code.

This makes the data files the place where Simon can both design cards and author the playable world.

## Evolution rule

Do not pre-design a large general-purpose configuration language. Add syntax only when a concrete Safe Room data need requires it, and choose the shortest unambiguous form that remains readable.

When the parser gains new syntax, document that syntax here with a small real game-data example.
