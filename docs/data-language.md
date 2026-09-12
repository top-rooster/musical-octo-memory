# Safe Room authored JSON

## Purpose

Safe Room's runtime-authored content has one source of truth:

- `data/cards.json` owns card masters, starting card state, structured attributes, Actions, Processes, and other card-owned behavior;
- `data/rooms.json` owns world composition, persistent Nadir state, room instances, opening configuration, Search decks, equipment placement, and instance overrides;
- `data/attributes.json` owns player-facing attribute names and descriptions.

All three files are strict JSON: no comments, JSONC, or trailing commas. Design notes and unresolved values belong in focused documents or `docs/backlog.md`, not runtime data.

## Stable identity

Card, room, deck, Marker, Value, Hidden Value, structured-attribute, and equipment-slot references use stable lowercase kebab-case IDs.

Display names are presentation metadata and may change or be duplicated without changing runtime identity.

For example, two distinct route masters may both display as **Go to tunnels** while carrying different Path destinations or travel times.

Runtime code must never derive identity by slugifying display names.

## Card state and attributes

Card masters may contain:

- Markers;
- visible Values;
- Hidden Values;
- structured attributes such as `path`, `food`, and `hydration`;
- Actions;
- Processes;
- equipment/storage metadata where relevant.

Marker presence and visible Values are player-facing state. Hidden Values are internal card-instance state and are not rendered automatically.

Structured attributes carry typed authored payload. They are not merely display labels.

Current concrete structured attributes are:

- `path` - destination Room ID and travel time;
- `food` - completion effects contributed by food when eaten;
- `hydration` - completion effects contributed by a drinkable card.

Do not generalize these into an unrestricted scripting language.

## Nadir

Nadir is one persistent anchored card in Inventory.

His ordinary permanent state, including current `Hydration`, `Satiation`, and `Vision`, belongs on that card.

Generic Nadir behavior such as Travel, Eat, and Drink is authored as Actions on Nadir. Object-specific payload belongs on the triggering object's structured attribute.

## Action triggers

For card-on-card drag/drop:

- dragged card = `accepted`;
- card underneath = `received`.

An Action may use:

- `on` when the Action belongs to the accepted card and matches the received card;
- `receive` when the Action belongs to the received card and matches the accepted card.

Trigger selectors may match stable card IDs, Marker requirements, or structured-attribute presence.

Requirements on the Action-owning card are separate from the counterpart trigger selector.

Effect targets use the stable interaction roles `accepted` and `received`.

The runtime must resolve:

- 0 matching Actions -> no Action;
- 1 matching Action -> execute it;
- 2+ matching Actions -> invalid authored data.

Validation must detect overlapping match domains before runtime wherever possible.

## Action duration and effects

Every executable Action resolves an explicit duration. There is no default duration.

The duration may be authored directly on the Action or supplied by a triggering structured attribute when that attribute owns the duration. Travel is the concrete example: `path.time` supplies Travel duration.

Normal Action effects execute at completion.

Action execution is atomic: if required effects are unsupported, the Action must not partially execute.

## World composition and instances

`rooms.json` defines the starting room, room data, opening configuration, persistent Nadir state/equipment, room-local cards, and Search decks.

Room data owns composition, not card behavior.

Travel destination/time belongs to route-card `path`, not to room placement data.

Runtime creation clones master state before applying instance overrides. Instances never mutate their master or one another.

## Search decks

Search decks remain room-local interactive objects rather than cards.

Search duration is deck-authored data and Search advances time through the same centralized Action/time system as card Actions and Travel.

## Validation

The centralized JSON loading path validates all authored documents before transforming them into runtime structures.

Validation should cover at least:

- stable ID form;
- cross-file references;
- supported equipment-slot IDs;
- valid instance overrides;
- valid structured-attribute payloads;
- explicit/resolvable Action durations;
- supported effect targets/effect forms;
- overlapping Action match domains;
- card/room references inside Path and other typed payloads.

Invalid authored data fails startup rather than falling back to legacy behavior.
