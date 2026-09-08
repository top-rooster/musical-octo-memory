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

Examples of the intended authoring feel are `Anchored`, `Cutting Tool`, `Sterilized`, `Durability 80`, and `Infection 50`.

These examples express the desired low-boilerplate style. Do not turn them into a more verbose key/value object model during implementation.

## Current format draft

`data/cards.txt` contains the first concrete draft of the card-data format using current Safe Room card decisions.

The draft currently uses:

- blank lines to separate card masters;
- the card title as the first line;
- the picture path as the second line;
- Marker names as plain lines;
- Values as `name integer`;
- short behavior verbs only where the data needs to express an Action, Process, input, output, or state change.

This file exists so the format can be judged against real Safe Room data. The syntax in `data/cards.txt` is **not yet a locked design decision**. Keep changing it if doing so removes boilerplate or ambiguity while preserving phone-friendly authoring.

## Level design

Level design uses the same text-data philosophy and parser/tooling family as card data.

The runtime world should be constructed from authored text data rather than from room-specific setup code. At minimum, level data must be able to identify rooms and the card instances/starting state that belong in them. As more world relationships become implementation-relevant, extend the text format rather than moving those authored facts into code.

This makes the data files the place where Simon can both design cards and author the playable world.

## Evolution rule

Do not pre-design a large general-purpose configuration language. Add syntax only when a concrete Safe Room data need requires it, and choose the shortest unambiguous form that remains readable.

When the parser gains new syntax, document that syntax here with a small real game-data example.
