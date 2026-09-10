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
- Neck
- Chest
- Back
- Legs
- Feet

Equipment remains represented by ordinary cards. **A card in any compatible equipment slot is equipped/active. A card outside an equipment slot is not equipped/active merely because it is carried in Inventory.**

For the current prototype, equipping or unequipping itself is free and does not advance time.

### Hands

Left Hand and Right Hand are ordinary equipment slots under the same rule as the other slots.

A card in a Hand is equipped/active. A card in the flat carried Inventory is only carried.

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

### Carried Inventory

There is no fixed generic five-card carrying capacity independent of equipment.

Cards are **not visually or mechanically nested inside Backpack, Pants, pockets, or other equipment cards**. Carried cards remain ordinary cards in one flat Inventory area.

Equipped storage gear contributes carrying capacity to that flat area.

Cards occupying equipment slots, including Hands, are equipped rather than carried and do not consume the storage capacity described below.

### Item sizes

Carried items use exactly three size classes for now:

- `Small`
- `Medium`
- `Large`

The Inventory UI should show a **current / maximum** readout for all three sizes so the player can see available carrying capacity directly.

Confirmed storage contributions:

- equipped `Pants` add **2 Small** storage;
- equipped `Simple Backpack` adds **5 Medium** storage once the main survival phase begins in Tunnels.

The Pants pockets can therefore carry two Small items such as Pocket Knife and Simple Lighter, but cannot carry a Pipe.

The Simple Backpack provides space suitable for Medium objects such as a Pipe or Plastic Bottle while still keeping all carried cards visually flat in Inventory.

### Milestone 2 packing convention

The exact long-term packing model has not been separately designed. For Milestone 2, use this deliberately small implementation convention:

- Small capacity accepts Small items only;
- Medium capacity accepts Small or Medium items;
- Large capacity accepts Small, Medium, or Large items;
- when more than one compatible capacity exists, allocate carried items to the smallest fitting capacity first.

This is a **prototype implementation convention**, not a claim that the final game needs invisible per-container packing simulation. Keep the rule isolated so it can be changed after playtesting.

### Simple Backpack

The opening evacuation includes a `Simple Backpack`.

The Backpack is initially empty. If chosen and equipped in Back, it adds **5 Medium** carried-Inventory capacity once Nadir reaches Tunnels.

Cards using that capacity remain ordinary carried cards. They do not become children of the Backpack and do not count as equipped merely because the Backpack supplies their capacity.

### Starting clothing

At the beginning of the evacuation interlude Nadir is surprised and only partly dressed:

- Pants are already equipped in Legs;
- T-Shirt is already equipped in Chest;
- Feet are empty: Nadir is barefoot;
- both Hands are empty;
- Head, Eyes, Neck, and Back are empty.

The worn Pants therefore provide his only initial flat carried-storage capacity: 2 Small.

### Equipment as progression

Equipment is expected to become a meaningful crafting/progression surface rather than merely conventional RPG stat gear.

Confirmed equipment families/slots already create useful crafting targets including backpacks, hats/headwear, eyewear, shirts/jackets, pants, shoes, and potentially neck-worn items. Their value can come from practical survival capabilities such as storage, protection, warmth, access, visibility, concealment, or comfort/mood effects.

## SUPERSEDES

The following earlier rules are superseded:

- `Inventory = equipped`;
- a fixed five-card generic carrying capacity as Nadir's permanent inventory model;
- the idea that equipment should avoid explicit body slots.

## OPEN

The following remain undecided beyond the Milestone 2 implementation convention above:

- the final long-term packing/allocation model if the prototype convention proves insufficient;
- whether the UI should identify which equipped storage item is supplying capacity for each carried card;
- exact effects of most clothing/equipment families;
- whether equipping/unequipping should later consume time;
- whether any future equipment occupies more than one slot.
