# Equipment and carried storage

## DECIDED BY SIMON

Equipment is represented by ordinary cards, but the earlier simplification that every equipment card is equipped merely because it is in Inventory is no longer sufficient.

Safe Room needs to distinguish at least between cards that are **equipped** and cards that are merely **carried**.

The first concrete reason is the `Simple Backpack` from the opening evacuation. The backpack itself can be equipped, and once Nadir reaches the Tunnels it allows him to carry five additional cards. Cards carried inside the backpack do **not** count as equipped.

Equipment is expected to become a meaningful crafting/progression surface. Confirmed equipment families that should be supported by the design include:

- backpacks;
- hats;
- shirts;
- pants;
- shoes.

These are useful not only as found items but as potential crafting outcomes and upgrade targets.

The equipment model should remain card-based and should not silently turn into a separate conventional RPG character-sheet subsystem unless a later decision explicitly requires that.

## SUPERSEDES

The previous rule that an equipment card is equipped exactly while that card instance is in Inventory is superseded by this document.

Inventory remains the persistent player-facing zone, but being present in Inventory is no longer enough by itself to define equipped state.

## OPEN

The exact representation is not yet decided. In particular:

- whether equipment uses explicit body slots such as Head, Torso, Legs, Feet, Back, etc.;
- whether equipped cards attach to `Body`, occupy dedicated positions within Inventory, or use another card relationship;
- how many items can be equipped in each equipment family;
- whether clothing itself provides carrying capacity, protection, warmth, concealment, or other effects;
- whether containers other than backpacks can provide carried-but-not-equipped card storage;
- how nested carried cards are displayed and manipulated;
- whether backpack contents can be accessed during all interactions or whether access can depend on context;
- whether equipping/unequipping consumes time.

These should be fixed only when concrete interactions require them, keeping the visible system as small as possible.
