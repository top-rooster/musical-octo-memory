# Rooms and navigation

This document records the current decided room/world model for Safe Room.

## DECIDED BY SIMON

### Opening and starting state

The game opens with a short evacuation interlude rather than with Nadir already established in a permanent Safe Room/base.

The authorities are coming and Nadir has to leave. The player may take **five** offered card instances. Details are in `docs/opening.md`.

After the interlude, Nadir escapes into **Tunnels**. The main survival/exploration game begins there without an established base of operations.

### Persistent world rooms

The persistent rooms in the first playable world slice are:

- **Tunnels**
- **Abandoned Office**
- **Deep Tunnels**

These rooms exist from new-game creation whether or not Nadir has discovered access to them.

Discovery controls access and visible travel options. It does not create the destination room.

### Current connections

Passage/exit points are ordinary interactable cards in the Room zone.

All travel cards are `Anchored` to their home room. Dragging Nadir's anchored **Nadir** card onto one commits Travel.

Current links are:

- Tunnels -> Abandoned Office: **15m**;
- Abandoned Office -> Tunnels: **15m**;
- Tunnels -> Deep Tunnels: **30m**;
- Deep Tunnels -> Tunnels: **30m**.

The two outbound Tunnels travel cards begin inside the Tunnels Explore deck. Once drawn, each remains as a persistent room-local travel card.

Abandoned Office and Deep Tunnels each begin with an Anchored `Go to tunnels` card.

Travel destination and duration belong to the route card's `path` attribute, not room composition data.

Nadir owns one generic Travel Action. Travel reads target Room ID and base duration from `path`.

Travel advances time through the same centralized Action/time system as every other time-consuming Action. Vision may multiply travel time according to `docs/lighting-and-vision.md`.

### Room lighting

Current room-light conditions are:

- Opening Room: **Bright**;
- Tunnels: **Dim** (`Vision -1`);
- Abandoned Office: **Bright** during the current prototype;
- Deep Tunnels: **Twilight** (`Vision -3`).

The authoritative light condition is room state/data. The renderer changes visible background brightness from that state.

### Deep Tunnels gameplay role

Deep Tunnels are soft-gated by Vision, not by possession of a particular item.

With Nadir's base Vision 4 and Twilight -3, effective Vision is 1 without Glasses or an active light source. Travel and Search become slower and ordinary work is unavailable.

### Room-local cards and persistence

Cards in Room belong to that room and do not follow Nadir when he changes rooms.

Changing rooms swaps the visible Room card set/background while Nadir's persistent card, condition cards, equipment slots, equipped cards, and carried Inventory remain present.

Persistent rooms preserve card identity, current state, relationships, and positions while off-screen.

### Search decks

Search decks are room-local interactive objects and are **not cards**.

All Search decks use the same dedicated backside artwork.

Search commits an Action with authored base duration. Vision may multiply it. When Search resolves, one card visibly draws from the fixed hidden deck order.

Each room's Search deck is shuffled once at new-game creation and then remains fixed for that run. There is no reshuffle/reroll and no visible remaining-card count.

Current Tunnels Explore content remains documented in `docs/explore-deck.md`.

### Authored room data

`data/rooms.json` owns world composition, including:

- initial room;
- room background/light;
- opening configuration;
- persistent Nadir/equipment starting state;
- offered opening cards;
- room-local card instances;
- Search decks and authored contents;
- instance overrides.

It must not own route behavior such as destination or travel duration; that belongs to route-card `path`.

## OPEN

Still open beyond the current slice:

- final narrative name/identity and revisit behavior of the opening room;
- real Abandoned Office and Deep Tunnels search compositions beyond decided content;
- future deck behavior after exhaustion;
- day/night changes in Abandoned Office;
- additional rooms/routes;
- future mechanics for currently inert world content.
