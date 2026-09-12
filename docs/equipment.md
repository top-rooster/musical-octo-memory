# Equipment and carried storage

## DECIDED BY SIMON

The earlier simplification that an equipment card is equipped merely because it is somewhere in Inventory is superseded.

Safe Room uses explicit **equipment slots** as part of Nadir's persistent Inventory interface.

The equipment slots are not cards and do not consume card instances. They are fixed interface positions represented visually as indentations/placeholders. An empty slot may show a faint slot image/icon; when equipment is placed there, the equipment card visually covers the slot.

Current equipment slots are:

- Left Hand
- Right Hand
- Head
- Eyes
- Trinket 1
- Trinket 2
- Chest
- Back
- Legs
- Feet

Equipment remains represented by ordinary cards. **A card in any compatible equipment slot is equipped/active. A card outside an equipment slot is not equipped/active merely because it is carried in Inventory.**

For the current prototype, equipping or unequipping itself is free and does not advance time.

### Hands

Left Hand and Right Hand are ordinary equipment slots under the same rule as the other slots.

A card in a Hand is equipped/active. A card in the flat carried Inventory is only carried.

Either Hand may hold any ordinary movable item card. Hand compatibility is a general rule rather than authored `equip Hand` metadata on every item. Anchored world cards and Nadir-state cards are not ordinary movable items and cannot be placed in Hands.

Held cards do not consume carried-storage capacity. During the opening evacuation, an offered card held in a Hand still counts toward the five-card selection limit. This allows a Medium offered item such as Canned Food or a Plastic Bottle to be chosen in a free Hand even though the initially equipped Pants provide only Small carried storage.

This creates a place for active hand-held items such as the Flashlight. It does not yet impose a universal rule that every directly used tool must first be in a Hand; add that only when a concrete interaction requires it.

### Eyes and Vision

The `Eyes` slot is for eyewear such as glasses or goggles.

**Vision belongs on `Mind`, not on the Eyes slot or eyewear card.** Equipment and environmental conditions modify effective Vision while the underlying Nadir state remains on Mind.

Nadir's normal Vision is:

`Vision 4`

Nadir's Glasses provide:

`Vision +1`

while equipped in Eyes.

Glasses are available as a possible choice during the opening evacuation rather than assumed to be permanently attached to Nadir.

The full lighting/Vision rules are recorded in `docs/lighting-and-vision.md`.

### Trinkets

`Trinket 1` and `Trinket 2` replace the earlier `Neck` slot.

No particular trinket items or effects are implied merely because these slots exist. Their concrete content remains deferred until a gameplay need requires it.

### Carried Inventory

There is no fixed generic five-card carrying capacity independent of equipment.

Cards are **not visually or mechanically nested inside Backpack, Pants, pockets, or other equipment cards**. Carried cards remain ordinary cards in one flat Inventory area.

Equipped storage gear contributes carrying capacity to that flat area.

Cards occupying equipment slots, including Hands, are equipped rather than carried and do not consume the storage capacity described below.

### Item size Markers

Item size is **not a separate card field or separate attribute type**. It uses the ordinary Marker system.

The current size Markers are:

- `small` -> Small
- `medium` -> Medium
- `large` -> Large

A carried item that consumes size-based storage has exactly one of these size Markers. Storage and packing rules inspect that Marker; there must not also be a separate `size` property carrying the same information.

This keeps size available to the same trigger, validation, rendering, inspection, and card-state mechanisms as other Markers rather than creating a parallel concept.

### Storage capacity Values

Storage capacity is **not a separate `storage` object or separate storage type**. It uses ordinary Values on the equipment card.

The current storage-capacity Values are:

- `storage-small`
- `storage-medium`
- `storage-large`

Examples:

```json
"pants": {
  "markers": ["medium"],
  "values": { "storage-small": 2 }
}
```

```json
"simple-backpack": {
  "markers": ["medium"],
  "values": { "storage-medium": 5 }
}
```

These Values contribute capacity only while the card is equipped. A Backpack carried flat in Inventory does not provide its storage Value as usable capacity.

The opening evacuation remains governed by its explicit five-offered-card selection rule. The normal main-game carried-capacity calculation does not require a separate `phase` property on storage data.

The Inventory UI should show a **current / maximum** readout for all three capacities so the player can see available carrying capacity directly.

Confirmed storage contributions:

- equipped `Pants` provide `Storage Small 2`;
- equipped `Simple Backpack` provides `Storage Medium 5` in the main survival game.

The Pants pockets can therefore carry two cards carrying the `small` Marker, such as Pocket Knife and Simple Lighter, but cannot carry a Pipe carrying `medium`.

The Simple Backpack provides space suitable for cards carrying `medium`, such as a Pipe or Plastic Bottle, while still keeping all carried cards visually flat in Inventory.

### Milestone 2 packing convention

The exact long-term packing model has not been separately designed. For Milestone 2, use this deliberately small implementation convention:

- `storage-small` capacity accepts cards with the `small` Marker only;
- `storage-medium` capacity accepts cards with `small` or `medium`;
- `storage-large` capacity accepts cards with `small`, `medium`, or `large`;
- when more than one compatible capacity exists, allocate carried items to the smallest fitting capacity first.

This is a **prototype implementation convention**, not a claim that the final game needs invisible per-container packing simulation. Keep the rule isolated so it can be changed after playtesting.

### Simple Backpack

The opening evacuation includes a `Simple Backpack`.

The Backpack is initially empty. If chosen and equipped in Back, its `storage-medium` Value provides 5 Medium carried-Inventory capacity in the main survival game.

Cards using that capacity remain ordinary carried cards. They do not become children of the Backpack and do not count as equipped merely because the Backpack supplies their capacity.

### Starting clothing

At the beginning of the evacuation interlude Nadir is surprised and only partly dressed:

- Pants are already equipped in Legs;
- T-Shirt is already equipped in Chest;
- Feet are empty: Nadir is barefoot;
- both Hands are empty;
- Head, Eyes, both Trinket slots, and Back are empty.

The worn Pants therefore provide his only initial main-game flat carried-storage capacity: `Storage Small 2`.

### Equipment as progression

Equipment is expected to become a meaningful crafting/progression surface rather than merely conventional RPG stat gear.

Confirmed equipment families/slots already create useful crafting targets including backpacks, hats/headwear, eyewear, shirts/jackets, pants, shoes, and future trinkets. Their value can come from practical survival capabilities such as storage, protection, warmth, access, visibility, concealment, comfort, or mood effects.

## SUPERSEDES

The following earlier rules are superseded:

- `Inventory = equipped`;
- a fixed five-card generic carrying capacity as Nadir's permanent inventory model;
- the idea that equipment should avoid explicit body slots;
- the earlier `Neck` equipment slot;
- representing item size through a separate `size` field/type rather than Markers;
- representing carrying capacity through a separate `storage` object/type rather than Values.

## OPEN

The following remain undecided beyond the Milestone 2 implementation convention above:

- the final long-term packing/allocation model if the prototype convention proves insufficient;
- whether the UI should identify which equipped storage item is supplying capacity for each carried card;
- exact effects of most clothing/equipment families;
- which future items use the Trinket slots and what they do;
- whether equipping/unequipping should later consume time;
- whether any future equipment occupies more than one slot.
