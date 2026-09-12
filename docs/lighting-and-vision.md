# Lighting and Vision

This document records the current decided lighting, Vision, and task-light requirements for Safe Room.

## DECIDED BY SIMON

### Vision

`Vision` is a visible Value on Nadir's anchored **Nadir** card.

Nadir's normal Vision is:

`Vision 4`

Glasses equipped in the `Eyes` slot provide:

`Vision +1`

Vision is modified by room lighting and active portable light sources. The resulting effective Vision determines what Nadir can do and how long some activities take.

There is no separate Mind card in the current Nadir model.

### Effective Vision levels

Effective Vision uses the following capability levels:

- **0 or lower** - Nadir can do nothing except leave the room. Leaving takes **3x** the normal travel time.
- **1** - Nadir may leave the room at **2x** normal travel time. Searching is possible at **3x** normal search time.
- **2** - Nadir may perform **low-light tasks**. Searching takes **2x** normal search time.
- **3** - Nadir may perform **normal-light tasks**. Searching takes its normal time.
- **4 or higher** - Nadir may perform **precision tasks**. Searching takes its normal time.

These levels deliberately make small Vision modifiers meaningful. A single `+1` may cross a capability threshold instead of merely producing a small percentage bonus.

### Room light conditions

Room lighting applies an environmental Vision modifier.

Current conditions are:

- **Darkness** - `Vision -4`. Reserved for a future room not yet designed.
- **Twilight** - `Vision -3`. **Deep Tunnels** currently use this condition.
- **Dim** - `Vision -1`. **Tunnels** currently use this condition.
- **Bright** - no Vision penalty. **Abandoned Office** is Bright during daytime because it has a window.

With Nadir's normal `Vision 4`, this means:

- Bright -> effective Vision 4;
- Dim -> effective Vision 3;
- Twilight -> effective Vision 1;
- Darkness -> effective Vision 0.

Glasses raise each of those by one while worn.

### Portable light sources

Current portable light effects are:

- **Flashlight** - `Vision +1` while actively held in either Hand and `Battery > 0`;
- **Torch** - a lit oil rag on a stick; `Vision +1`; the Torch card is discarded when it burns out.

A lit lighter is **not** a Vision-producing light source.

### Flashlight active state and battery

The Flashlight is active exactly while it is equipped in either Hand and has battery remaining.

While active:

- it provides `Vision +1`;
- its battery drains over elapsed game time.

While merely carried in Inventory or left in a Room:

- it provides no Vision bonus;
- it does not drain battery.

The opening Flashlight starts at `Battery 20`.

The exact battery drain rate remains undecided and must not be invented.

### Combined examples

In **Deep Tunnels** (`Twilight`, `Vision -3`):

- Nadir alone: effective Vision 1;
- Glasses only: effective Vision 2;
- active Flashlight or Torch only: effective Vision 2;
- Glasses plus active Flashlight or Torch: effective Vision 3.

In **Darkness** (`Vision -4`):

- Nadir alone: effective Vision 0;
- Glasses only: effective Vision 1;
- active Flashlight or Torch only: effective Vision 1;
- Glasses plus active Flashlight or Torch: effective Vision 2.

### Deep Tunnels are soft-gated by Vision

A Flashlight is not an absolute requirement for entering Deep Tunnels.

Deep Tunnels are soft-gated by the normal Vision rules. Nadir may go there without a Flashlight or Torch, but at effective Vision 1 he is severely constrained: travel takes 2x normal time, searching takes 3x normal time, and he cannot perform low-light, normal-light, or precision tasks.

### Task light requirements

Every task has one light requirement:

- **Low-light**
- **Normal-light**
- **Precision**

Current examples are:

Low-light tasks:

- ripping cloth;
- making wood shavings;
- knife sharpening;
- spear practice;
- fire starting.

Normal-light tasks:

- cooking;
- stone throwing.

Precision tasks:

- sewing.

A task can only be started/performed when effective Vision reaches the corresponding capability level above.

### Stationary and moving tasks

Every task is also classified independently as either stationary or moving. Light requirement and movement are separate properties.

The exact mechanical consequences of stationary versus moving beyond the already-decided travel/search behavior remain open.

### Background presentation

The room background should visually respond to the room's current light condition.

The background image remains atmospheric presentation rather than authoritative mechanical state. The room's authored/current light condition determines the Vision modifier, and the renderer derives background brightness from that condition.

## OPEN

The following remain undecided:

- exact Flashlight battery drain rate;
- exact Torch burn duration and crafting recipe;
- whether Vision above 4 has any effect beyond satisfying the highest current threshold;
- how daylight changes over time in rooms such as Abandoned Office;
- exact stationary-versus-moving consequences beyond Search/travel;
- exact visual treatment of local portable light sources;
- whether additional conditions such as smoke, eye injury, weather, or glare modify Vision later.
