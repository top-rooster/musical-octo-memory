# Wound Process rules

These are **DECIDED BY SIMON** and supplement the broader wound rules in `docs/backlog.md` and `docs/game-design.md`.

## Fabric requirement

`Fabric` is a Marker.

Dressing a wound requires a source card carrying **both** `Fabric` and `Sterilized`.

In the text data language, compound Marker requirements use `+`:

`action Fabric+Sterilized Dress 15m`

The source fabric card is consumed when the Action completes and the wound gains `Dressed`.

## Card removal vocabulary

When a card ceases to exist in play, the data language uses `discard`, not `remove`.

Use `discard self` for the current card. Reserve `remove` for removing an attribute from a card that remains in play, such as `remove Contains Water source`.

## Flesh Wound healing

`Flesh Wound` has a repeating healing Process evaluated once per **15 minutes of elapsed game time**.

The wound's healing progress changes on each 15-minute Process tick according to its current `Infection`:

- `Infection < 25`: healing progress `+2`;
- `Infection 25-49`: healing progress `+1`;
- `Infection 50-75`: healing progress `+0`;
- `Infection > 75`: healing progress `-1`.

At healing progress 100, discard the `Flesh Wound` card.

The exact player-facing name of the healing progress Value remains undecided; the text-data draft currently uses the generic word `progress`.

As with every Process, these 15-minute ticks do not create game time. They occur as Actions advance game time.
