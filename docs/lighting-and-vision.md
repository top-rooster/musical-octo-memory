# Lighting and Vision

This document records the current decided lighting, Vision, and task-light requirements for Safe Room.

## DECIDED BY SIMON

### Vision

`Vision` is a visible Value on Nadir's **Mind** card.

Nadir's normal Vision is:

`Vision 4`

Glasses equipped in the `Eyes` slot provide:

`Vision +1`

Vision is modified by room lighting and portable light sources. The resulting effective Vision determines what Nadir can do and how long some activities take.

### Effective Vision levels

Effective Vision uses the following capability levels:

- **0 or lower** — Nadir can do nothing except leave the room. Leaving takes **3x** the normal travel time.
- **1** — Nadir may leave the room at **2x** normal travel time. Searching is possible at **3x** normal search time.
- **2** — Nadir may perform **low-light tasks**. Searching takes **2x** normal search time.
- **3** — Nadir may perform **normal-light tasks**. Searching takes its normal time.
- **4 or higher** — Nadir may perform **precision tasks**. Searching takes its normal time.

These levels deliberately make small Vision modifiers meaningful. A single `+1` may cross a capability threshold instead of merely producing a small percentage bonus.

### Room light conditions

Room lighting applies an environmental Vision modifier.

Current conditions are:

- **Darkness** — `Vision -4`. Reserved for a future room not yet designed.
- **Twilight** — `Vision -3`. **Deep Tunnels** currently use this condition.
- **Dim** — `Vision -1`. **Tunnels** currently use this condition.
- **Bright** — no Vision penalty. **Abandoned Office** is Bright during daytime because it has a window.

With Nadir's normal `Vision 4`, this means:

- Bright -> effective Vision 4;
- Dim -> effective Vision 3;
- Twilight -> effective Vision 1;
- Darkness -> effective Vision 0.

Glasses raise each of those by one while worn.

This deliberately leaves a gap between Dim and Twilight. Deep Tunnels are substantially harder to function in without either eyewear, portable light, or both.

### Portable light sources

Current portable light effects are:

- **Flashlight** — `Vision +1`; consumes battery charge over time while in use.
- **Torch** — a lit oil rag on a stick; `Vision +1`; the Torch card is discarded when it burns out.

A lit lighter is **not** a Vision-producing light source. The lighter may still be used for ignition, but keeping it lit does not provide a `Vision` bonus.

The exact flashlight battery consumption rate and Torch burn duration remain to be authored separately.

### Combined examples

The modifiers are additive.

In **Deep Tunnels** (`Twilight`, `Vision -3`):

- Nadir alone: effective Vision 1;
- glasses only: effective Vision 2;
- flashlight or Torch only: effective Vision 2;
- glasses plus flashlight or Torch: effective Vision 3.

In **Darkness** (`Vision -4`):

- Nadir alone: effective Vision 0;
- glasses only: effective Vision 1;
- flashlight or Torch only: effective Vision 1;
- glasses plus flashlight or Torch: effective Vision 2.

### Deep Tunnels are soft-gated by Vision

A Flashlight is **not an absolute requirement** for entering or travelling to Deep Tunnels.

Deep Tunnels are instead soft-gated by the normal Vision rules. Nadir may go there without a Flashlight or Torch, but at his unmodified effective Vision of 1 he is severely constrained: travel takes 2x normal time, searching takes 3x normal time, and he cannot perform low-light, normal-light, or precision tasks.

The intent is that entering Deep Tunnels without preparing for the lighting conditions remains technically possible but may be practically useless.

If the player did not take either the `Glasses` or `Flashlight` during the opening evacuation, the game still has recovery paths rather than becoming hard-locked:

- a `Torch` can be crafted and used for `Vision +1`;
- a `Flashlight` can be found by searching in **Deep Tunnels**.

Finding that Flashlight is deliberately somewhat self-rescuing: reaching and searching Deep Tunnels without good Vision is inefficient, but success can improve future trips to the same area.

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

Every task is also classified independently as either:

- **stationary**; or
- **moving**.

Light requirement and movement are separate properties. A task can therefore be low-light/stationary, normal-light/moving, precision/stationary, and so on.

The exact mechanical consequences of stationary versus moving beyond the already-decided travel/search behavior remain open. This dimension is intended to support later distinctions such as which light sources can practically be used while performing an activity.

### Background presentation

The room background should visually respond to the room's current light condition.

The background image itself remains atmospheric presentation rather than the authoritative source of mechanical state. The room's authored/current light condition determines the Vision modifier, and the renderer derives background brightness from that condition.

This means the same room background can be shown darker or brighter as its light state changes without requiring separate artwork for every lighting level.

Portable light sources may also add a visual lighting effect. Their exact presentation is not yet fixed; for example, a flashlight may eventually be better represented by a localized beam/vignette treatment rather than globally brightening the entire room.

## OPEN

The following remain undecided:

- exact flashlight battery consumption rate;
- exact Torch burn duration;
- the exact crafting recipe for a Torch beyond the current concept of an oil rag on a stick;
- whether Vision can exceed the currently useful threshold of 4 and, if so, whether values above 4 have any additional effect;
- how daylight changes over time in rooms such as Abandoned Office;
- exact stationary-versus-moving consequences for light-source compatibility;
- exact visual treatment of portable/local light sources;
- whether additional environmental conditions such as smoke, eye injury, weather, or glare modify Vision later.
