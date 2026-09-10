# Equipment and carried storage

## DECIDED BY SIMON

The earlier simplification that an equipment card is equipped merely because it is somewhere in Inventory is superseded.

Safe Room uses explicit **equipment slots** as part of Nadir's Inventory interface.

The equipment slots are not cards and do not consume card instances. They are fixed interface positions represented visually as indentations/placeholders in the Inventory area. An empty slot may show a faint slot image/icon; when equipment is placed there, the equipment card visually covers the slot.

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

Equipment remains represented by ordinary cards. A card is equipped when placed into its compatible equipment slot.

The `Eyes` slot is for eyewear such as glasses or goggles. **Vision itself belongs on `Mind`, not on the Eyes slot or eyewear card.** Eyewear may later modify Vision or otherwise affect it, but the underlying Nadir state remains on Mind.

The exact question of whether Nadir normally wears glasses is still open.

### Carried Inventory

There is no longer a fixed generic five-card carrying capacity independent of equipment.

Equipped storage items such as backpacks, pants with pockets, jackets, and future carrying gear add usable carrying capacity to the Inventory interface.

Cards are **not visually or mechanically nested inside the backpack, pants, pockets, or other equipment cards**. Carried cards remain ordinary cards in the flat Inventory area. Equipped storage gear instead increases how many carried cards the Inventory can legally hold and what sizes of card can be accommodated.

This keeps the player-facing manipulation model flat while making carrying capacity originate from physical equipment rather than an abstract inventory number.

### Item size and storage compatibility

Carried items need a size property or equivalent authored constraint so different storage equipment can accept different kinds of items.

Confirmed examples:

- pants pockets may provide capacity for two small items such as a `Pocket Knife` and a `Lighter`;
- those pockets must not be able to carry a long/bulky item such as a `Pipe`;
- a backpack can provide capacity for larger items such as a `Pipe` and `Plastic Bottle` cards.

The exact size vocabulary and packing/compatibility rules are not yet fixed. They should remain as simple as possible while supporting these concrete distinctions.

### Simple Backpack

The opening evacuation includes a `Simple Backpack`.

The backpack is initially empty. If the player chooses it, it occupies the Back equipment slot and, once the main survival phase begins in the Tunnels, provides capacity for **five additional carried cards**.

Cards enabled by the backpack's carrying capacity are carried, not equipped merely because they are in Inventory.

### Equipment as progression

Equipment is expected to become a meaningful crafting/progression surface rather than merely conventional RPG stat gear.

Confirmed equipment families/slots already create useful crafting targets including backpacks, hats/headwear, eyewear, shirts/jackets, pants, shoes, and potentially neck-worn items. Their value can come from practical survival capabilities such as storage, protection, warmth, access, visibility, concealment, or comfort/mood effects.

## SUPERSEDES

The following earlier rules are superseded:

- `Inventory = equipped`;
- a fixed five-card generic carrying capacity as Nadir's permanent inventory model;
- the idea that equipment should avoid explicit body slots.

## OPEN

The following remain undecided:

- the exact item-size vocabulary;
- how storage capacity and size compatibility are validated when several equipped storage items contribute capacity at once;
- whether the UI visually indicates which equipped item is supplying capacity for a carried card, despite keeping the carried cards flat rather than nested;
- exact effects of each clothing/equipment family;
- whether equipping and unequipping consumes time;
- whether Nadir normally uses glasses;
- whether any equipment can occupy more than one slot, such as a future two-handed object or garment spanning multiple locations.
