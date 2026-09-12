# Rooms and navigation

This document records the current decided room/world model for Safe Room.

## DECIDED BY SIMON

### Opening and starting state

The game opens with a short evacuation interlude rather than with Nadir already established in a permanent Safe Room/base.

The authorities are coming and Nadir has to leave. The player may take **five** offered card instances. Details of the offered cards and Nadir's starting clothing are in `docs/opening.md`.

After the interlude, Nadir escapes into **Tunnels**. The main survival/exploration game begins there without an established base of operations.

The opening room uses the working implementation name `Opening Room` in `data/rooms.json`; that is not yet its final narrative name. Milestone 2 does not need a return route to it.

This supersedes the earlier assumption that `Safe Room` is Nadir's permanent starting base with a normal two-way connection to Tunnels.

### Persistent world rooms

The persistent rooms in the first playable world slice are:

- **Tunnels**
- **Abandoned Office**
- **Deep Tunnels**

These rooms exist from new-game creation whether or not Nadir has discovered access to them.

Discovery controls access and visible travel options. It does not create or activate the destination room.

### Current connections

Passage/exit points are ordinary interactable cards in the Room zone.

All travel cards are `Anchored` to their home room. Dragging Nadir's **Body** onto one commits its travel Action.

Current links are:

- Tunnels -> Abandoned Office: **15m**;
- Abandoned Office -> Tunnels: **15m**;
- Tunnels -> Deep Tunnels: **30m**;
- Deep Tunnels -> Tunnels: **30m**.

The two outbound Tunnels travel cards begin inside the Tunnels Explore deck:

- `Go to abandoned office`;
- `Go to deep tunnels`.

Once drawn, each remains as a persistent room-local travel card.

Abandoned Office and Deep Tunnels each begin with an Anchored `Go to tunnels` card. The exact destination and travel duration are authored on their distinct route-card masters in `data/cards.json`.

Travel is an Action, so its elapsed time participates in the normal time system. Vision may multiply travel time according to `docs/lighting-and-vision.md`.

### Room lighting

Current Milestone 2 room-light conditions are:

- Opening Room: **Bright**;
- Tunnels: **Dim** (`Vision -1`);
- Abandoned Office: **Bright** during the current prototype;
- Deep Tunnels: **Twilight** (`Vision -3`).

The authoritative light condition is room state/data. The renderer changes the visible brightness of the room background from that state.

The background itself remains presentation rather than gameplay state.

### Deep Tunnels gameplay role

Deep Tunnels are intentionally difficult to use without preparation and are **soft-gated by Vision**, not by possession of a particular item.

With normal `Vision 4` and Twilight `-3`, Nadir has effective Vision 1 there without Glasses or an active light source. Travel is slower, searching is much slower, and ordinary work is unavailable.

Skipping both Glasses and Flashlight during the opening does not hard-lock the player. A Flashlight is part of the Deep Tunnels search content, and a Torch can be introduced later as another recovery path.

Torch crafting/burn behavior is outside Milestone 2.

### Room backgrounds

Every room has its own background image:

- `images/opening-room-background.jpg`
- `images/tunnels-background.jpg`
- `images/abandoned-office-background.jpg`
- `images/deep-tunnels-background.jpg`

Room backgrounds provide location identity and atmosphere. Mechanically meaningful state remains in authored game state/cards rather than being baked into the artwork.

### Room-local cards and persistence

Cards in the Room zone belong to the current room and do not follow Nadir when he changes rooms.

Changing rooms swaps the visible Room card set and room background. Nadir's persistent state, equipment slots, equipped cards, and carried Inventory remain present across room changes.

A persistent room preserves the exact state of its cards while Nadir is elsewhere, including:

- card identity;
- current Markers and Values;
- relationships;
- exact position.

Persistent rooms are off-screen, not reset. The time model must allow later Processes in inactive rooms to receive elapsed game time, although Milestone 2 does not need to implement every existing unfinished Process.

### Search decks

Search decks are room-local interactive objects and are **not cards**.

Card-instance rules, card attributes, stacking, Anchored behavior, card inspection, and discard behavior do not automatically apply to decks.

All Search decks use the same dedicated face-down backside artwork:

`images/search-back.png`

The artwork covers the whole visible deck face and includes a stylized `Search` as part of the image. Different rooms do not get different Search backs.

All Search decks use the same basic interaction:

1. player clicks the deck;
2. the click commits a base **15-minute Search Action**;
3. Vision may multiply that duration;
4. when the Action resolves, one card visibly draws out of the deck;
5. the deck depletes by exactly one card.

All Search decks are finite and are shuffled **once at new-game creation**, including decks in rooms Nadir has not yet discovered. Each resulting hidden order stays fixed for the run. There is no reshuffle or per-draw reroll.

The player is not shown the remaining card count.

For the current implementation, an exhausted Search deck disappears immediately and without an animation. That behavior is provisional.

### Current search decks

**Tunnels / Explore** contains exactly 10 cards:

- Scrap Metal x2
- Pipe x1
- Squatter x1
- Dead Rat x1
- Plastic Bottle x1, empty
- Puddle of Water x1
- Go to deep tunnels x1
- Go to abandoned office x1
- Service Cabinet x1, locked

Detailed behavior is also recorded in `docs/explore-deck.md`.

**Abandoned Office** currently has 10 explicit Placeholder entries. They are implementation scaffolding, not designed content.

**Deep Tunnels** currently has:

- Flashlight x1;
- Placeholder x9.

The Flashlight is a decided useful find in Deep Tunnels. The other nine entries are temporary scaffolding.

### Authored room data

Milestone 2 uses `data/rooms.json` as the authored world/room source of truth.

Its current small syntax covers:

- initial room;
- room background and light condition;
- opening take limit/escape destination;
- Nadir starting state cards;
- equipped starting cards;
- offered opening cards;
- room-local cards;
- Search decks and ordered authored contents before shuffle;
- instance Markers/Values;
- travel destinations and durations.

Do not hard-code this room graph or these deck compositions in React/TypeScript. The format should grow only when a concrete level-design need requires it.

## OPEN

Still open beyond Milestone 2:

- final narrative name/identity and revisit behavior of the opening room;
- real Abandoned Office and Deep Tunnels search compositions beyond currently decided content;
- future deck behavior after exhaustion;
- day/night changes in Abandoned Office;
- additional rooms and routes;
- future mechanics for the currently inert Pipe, Squatter, Puddle of Water, Service Cabinet, and Placeholder content.
