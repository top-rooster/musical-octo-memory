# Milestone 2 - opening, equipment, rooms, search, and Vision

This is the active implementation contract for the second code iteration.

## Goal

Turn the Milestone 1 interaction prototype into the first small playable world slice:

**evacuation -> choose a five-card starting loadout -> enter Tunnels -> search -> discover routes -> travel -> experience equipment and Vision as practical constraints.**

Milestone 2 should remain a prototype. Implement only the systems needed to make that loop coherent and testable.

## Sources of truth for this milestone

Read these focused design notes before changing code:

- `docs/opening.md`
- `docs/equipment.md`
- `docs/rooms.md`
- `docs/explore-deck.md`
- `docs/lighting-and-vision.md`
- `docs/drag-feedback.md`
- `docs/card-inspection.md`
- `docs/card-animations.md`
- `docs/data-language.md`

Where an older rule in `docs/game-design.md`, `docs/roadmap.md`, or `docs/backlog.md` conflicts with an explicit **SUPERSEDES** statement in one of the focused files above, the newer focused decision wins for Milestone 2.

## Part A - finish the Milestone 1 interaction shell

Implement the four already-specified issues before or as part of the larger world refactor:

- issue #2: Inventory card click/release coordinate shift;
- issue #3: drag feedback for legal targets, current hovered target, rejected targets, legal zone placement, and immediate known attribute previews;
- issue #4: taller cards so square artwork is not cropped while card width remains unchanged;
- issue #5: mouse-following card inspection using authored card descriptions and shared attribute descriptions.

Preserve the interaction semantics already specified in those issues and focused docs.

## Part B - authored world data

Add and load `data/rooms.txt` as the Milestone 2 room/level source of truth.

The file defines:

- initial room;
- room background;
- room light condition;
- opening take limit and starting equipment;
- room-local starting cards;
- search decks and their contents;
- travel-card destination and travel duration;
- instance-state overrides needed by the current slice.

Do not hard-code the current room graph or deck compositions into React components or TypeScript constants.

The first room-file syntax is deliberately small and may evolve later. Follow `docs/data-language.md` and the comments in `data/rooms.txt` rather than designing a general-purpose level language.

## Part C - opening evacuation

The opening is a short special interlude.

Nadir begins surprised and only partly dressed:

- `Pants` equipped in Legs;
- `T-Shirt` equipped in Chest;
- Feet empty: he is barefoot;
- both Hands empty;
- Eyes, Head, Neck, and Back empty.

Body, Mind, and Spirit remain Nadir's persistent state cards.

The player may take **at most five offered card instances** before leaving. Equipped offered items count toward that five-card limit exactly like carried offered items.

Current offered cards:

- Pocket Knife x1;
- Plastic Bottle with `Contains-Water` x2;
- Canned Food x2;
- Simple Lighter with `Fuel 50` x1;
- Flashlight with `Battery 20` x1;
- Spare Batteries x1;
- Pain Killers x1;
- Simple Backpack x1;
- Glasses x1.

The already-worn T-Shirt is not an offered card.

After the player commits the escape, the main survival phase begins in **Tunnels**. The opening room does not need a return route in Milestone 2.

Do not build a real-time escape countdown in Milestone 2. The explicit five-card take limit supplies the opening constraint for now.

## Part D - equipment slots and carried Inventory

Replace the old rule that every card in Inventory is equipped and the old permanent five-card generic capacity.

Render fixed equipment-slot indentations/placeholders in the persistent Nadir/Inventory area:

- Left Hand
- Right Hand
- Head
- Eyes
- Neck
- Chest
- Back
- Legs
- Feet

Slots are UI positions, not card instances. An equipment card placed in a compatible slot covers that indentation and is **equipped/active**. A card merely present in carried Inventory is not equipped/active.

For Milestone 2, equipping and unequipping are free and do not advance time.

### Item size

Use exactly three carried-item size classes:

- `Small`
- `Medium`
- `Large`

The Inventory UI shows **current / maximum** capacity for Small, Medium, and Large.

Decided storage contributions:

- equipped Pants add **2 Small** storage;
- equipped Simple Backpack adds **5 Medium** storage once the main game begins in Tunnels.

Cards are not nested inside Pants or Backpack. They remain ordinary cards in one flat carried-Inventory area.

### Milestone 2 packing convention

This is an implementation convention for the prototype rather than a permanent product rule:

- Small storage accepts Small only;
- Medium storage accepts Small or Medium;
- Large storage accepts Small, Medium, or Large;
- when several compatible storage spaces exist, allocate carried items to the smallest compatible capacity first so larger capacity is preserved.

Keep this allocation in pure game-rule code so it can be changed without restructuring the UI.

Cards occupying equipment slots, including Hands, do not consume carried-storage capacity.

## Part E - equipment activity

A card in any compatible equipment slot is equipped/active. The same card in the flat carried Inventory is only carried.

For this milestone the only equipment effects that must materially use that distinction are:

- Glasses in Eyes: `Vision +1`;
- Flashlight in either Hand, while `Battery > 0`: `Vision +1` and it is considered switched on/active;
- Pants in Legs: +2 Small storage;
- Simple Backpack in Back: +5 Medium storage in the main survival phase.

Do not invent a general requirement that every directly used tool must first be placed in a Hand unless a concrete Milestone 2 interaction requires it.

### Flashlight battery scope

The Flashlight starts at `Battery 20` and only drains while equipped in a Hand. It does not drain while carried or lying in a Room.

The exact numerical drain rate has not been decided. Therefore Milestone 2 should implement the **active/inactive state and battery-aware Vision effect**, but must not invent a permanent battery-consumption rate. Isolate battery depletion behind one rule/config value so a rate can be added immediately when decided. Do not silently choose a product value.

## Part F - rooms and navigation

Persistent world rooms for this slice:

- Tunnels
- Abandoned Office
- Deep Tunnels

The opening room is a special introductory location.

Room state persists while Nadir is elsewhere. Changing rooms swaps the Room-zone card set and background; Nadir/equipment/carried Inventory persist.

Travel cards remain ordinary Anchored room cards. Dragging Body onto a legal travel card commits the travel Action.

Current links:

- Tunnels -> Abandoned Office: 15m;
- Abandoned Office -> Tunnels: 15m;
- Tunnels -> Deep Tunnels: 30m;
- Deep Tunnels -> Tunnels: 30m.

The two outbound Tunnels travel cards begin inside the Tunnels Explore deck and appear only when drawn.

## Part G - game time needed for this slice

Implement a minimal global game-time mechanism because Search and travel are Actions.

Required:

- Actions advance elapsed game time by their authored duration;
- Vision may multiply Search/travel duration;
- elapsed time is represented centrally so later Processes can consume it;
- do not implement the full wound/spoilage/survival Process engine in this milestone merely because time now exists.

The Action presentation can be simple, but the duration used by game rules must be explicit and testable.

## Part H - search decks

Search decks are **not cards**. Implement them as separate room-local interactive objects.

All search decks:

- use the same dedicated face-down `Search` backside artwork;
- are clicked to search rather than used through card-on-card drag;
- commit a base 15m Search Action;
- are shuffled once at new-game creation, including decks in undiscovered rooms;
- retain that fixed hidden order for the run;
- do not show a remaining-card count;
- are finite;
- disappear immediately with no animation when the final card is drawn, as provisional Milestone 2 behavior.

Drawing a card should visibly animate a card outward from the deck and settle it in the nearest legal free Room location.

Tunnels uses the exact 10-card Explore composition in `docs/explore-deck.md` and `data/rooms.txt`.

Abandoned Office uses 10 explicit placeholder entries for now.

Deep Tunnels uses 1 Flashlight and 9 placeholder entries for now.

Do not infer mechanics for Pipe, Squatter, Puddle of Water, Service Cabinet, or placeholder cards.

## Part I - Vision and room light

Implement effective Vision from `docs/lighting-and-vision.md`.

Nadir base:

`Vision 4`

Equipment:

- Glasses in Eyes: +1;
- active Flashlight in a Hand: +1.

Room modifiers:

- Bright: 0;
- Dim: -1;
- Twilight: -3;
- Darkness: -4.

Milestone 2 rooms:

- opening room: Bright;
- Tunnels: Dim;
- Abandoned Office: Bright;
- Deep Tunnels: Twilight.

Effective Vision behavior:

- 0 or lower: only leave room; travel 3x;
- 1: travel 2x; Search 3x;
- 2: low-light tasks allowed; Search 2x;
- 3: normal-light tasks allowed; Search normal;
- 4 or higher: precision tasks allowed; Search normal.

Deep Tunnels have no special Flashlight requirement. They are soft-gated by these Vision rules.

The room background brightness should visibly reflect the room light condition. The background remains presentation; authored room light is authoritative.

Do not implement Torch crafting or burn behavior in Milestone 2.

## Part J - data additions

Add card masters needed by the playable slice to `data/cards.txt`. At minimum this includes the opening equipment/items, room/search discoveries, and travel cards referenced by `data/rooms.txt`.

Extend the parser only for syntax the milestone actually uses.

Add `data/attributes.txt` for hover help required by issue #5. Missing descriptions must still fall back exactly as specified by that issue.

Do not attempt to make every older unfinished Action/Process in `data/cards.txt` executable in this iteration.

## Art assets

Expected Milestone 2 assets:

- `public/images/search-back.png`
- `public/images/opening-room-background.jpg`
- `public/images/tunnels-background.jpg`
- `public/images/abandoned-office-background.jpg`
- `public/images/deep-tunnels-background.jpg`

Search deck backside artwork covers the entire deck face and includes a stylized `Search` as part of the image. All Search decks use this identical backside.

Each room background is unique. Mechanically significant lighting remains data-driven and renderer-applied rather than baked into separate state-specific artworks.

## Explicitly not in Milestone 2

Do not expand into:

- Torch recipe/burn duration;
- full crafting;
- wound treatment/healing;
- spoilage;
- full Hydration/Satiation ticking;
- NPC behavior for Squatter;
- Service Cabinet unlocking;
- Puddle of Water behavior;
- Pipe mechanics;
- day/night simulation for Abandoned Office;
- stealth/search-team simulation;
- combat, traps, or turrets;
- saving/loading;
- final narrative presentation;
- final deck exhaustion behavior;
- final battery drain tuning.

## Tests / done means

Milestone 2 is done when a fresh run can:

1. start in the evacuation room with Pants and T-Shirt equipped;
2. choose no more than five offered cards;
3. equip compatible cards into visible slots and carry legal items under size/storage rules;
4. escape into Tunnels;
5. see the Tunnels background rendered at Dim light;
6. click the face-down Search deck and spend Vision-adjusted time searching;
7. draw cards in the fixed shuffled run order with a visible draw animation;
8. reveal travel cards and move among Tunnels, Abandoned Office, and Deep Tunnels;
9. preserve each room's card state/positions when leaving and returning;
10. see effective Vision change from room light, Glasses, and a hand-held Flashlight;
11. experience Deep Tunnels as inefficient but still accessible without glasses/light;
12. retain the fixed deck order and provisional exhausted-deck removal behavior;
13. pass the existing regression tests plus focused tests for room parsing, opening take limit, equipment-slot legality, storage-size capacity, deck shuffle/depletion, room persistence, travel duration multipliers, Vision calculation, and the four existing UI issues;
14. pass `pnpm test` and `pnpm build`.
