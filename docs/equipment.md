# Equipment and carried storage

## DECIDED BY SIMON

Safe Room uses explicit equipment slots as part of Nadir's persistent Inventory interface.

The equipment slots are not cards. They are fixed interface positions represented visually as indentations/placeholders.

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

Equipment remains represented by ordinary cards. A card in a compatible equipment slot is equipped/active. A card outside an equipment slot is not equipped/active merely because it is carried in Inventory.

For the current prototype, equipping or unequipping itself is free and does not advance time.

## Equipment compatibility uses References

Compatibility with non-Hand equipment slots is represented through the existing **Reference** mechanism.

Examples of the intended semantics:

- a T-Shirt references Chest;
- Pants reference Legs;
- Glasses reference Eyes;
- Simple Backpack references Back.

Do not represent this with a separate `equip` field.

The exact authored JSON form must use the project's existing Reference structure. Do not invent a new Reference JSON shape in design documentation or implementation work.

### Hands

Hands are intentionally not authored as per-card equipment compatibility.

Either Hand may hold any ordinary movable card. Therefore ordinary item cards do not need References to Left Hand or Right Hand merely to be holdable.

Anchored world cards and Nadir-state cards are not ordinary movable items and cannot be placed in Hands.

A card in a Hand is equipped/active. A card in flat carried Inventory is only carried.

Held cards do not consume carried-storage capacity. During the opening evacuation, an offered card held in a Hand still counts toward the five-card selection limit.

This does not imply that every directly used tool must first be held. Add such requirements only when a concrete mechanic is explicitly decided.

## Eyes and Vision

Vision belongs on Mind, not on the Eyes slot or eyewear card.

Nadir's normal Vision is `Vision 4`.

Glasses provide `Vision +1` while equipped in Eyes.

The full lighting/Vision rules are recorded in `docs/lighting-and-vision.md`.

## Trinkets

Trinket 1 and Trinket 2 replace the earlier Neck slot.

No particular trinket items or effects are implied merely because these slots exist.

## Carried Inventory

There is no fixed generic five-card carrying capacity independent of equipment.

Cards are not visually or mechanically nested inside Backpack, Pants, pockets, or other equipment cards. Carried cards remain ordinary cards in one flat Inventory area.

Equipped storage gear contributes carrying capacity to that flat area.

Cards occupying equipment slots, including Hands, are equipped rather than carried and do not consume carried-storage capacity.

## Item size Markers

Item size is not a separate card field or separate attribute type. It uses the ordinary Marker system.

Current size Markers are:

- `small`
- `medium`
- `large`

A carried item that consumes size-based storage has exactly one of these size Markers.

There must not also be a separate `size` property containing the same information.

## Storage capacity Values

Storage capacity is not a separate `storage` object or separate storage type. It uses ordinary Values on equipment cards.

Current storage-capacity Values are:

- `storage-small`
- `storage-medium`
- `storage-large`

Confirmed examples:

- Pants: `storage-small = 2`;
- Simple Backpack: `storage-medium = 5`.

These Values contribute capacity only while the card is equipped. A Backpack carried flat in Inventory does not provide active carrying capacity.

The opening evacuation remains governed by its explicit five-offered-card selection rule. Normal storage data therefore does not need a separate phase property.

The Inventory UI should show current/maximum readouts for all three capacity classes.

## Packing convention

For the current prototype:

- `storage-small` accepts cards with `small` only;
- `storage-medium` accepts `small` or `medium`;
- `storage-large` accepts `small`, `medium`, or `large`;
- allocate carried items to the smallest fitting capacity first.

This is a prototype allocation convention, not a separate container simulation.

## Starting clothing

At the beginning of the evacuation interlude:

- Pants are already equipped in Legs;
- T-Shirt is already equipped in Chest;
- Feet are empty;
- both Hands are empty;
- Head, Eyes, both Trinket slots, and Back are empty.

The worn Pants therefore provide the initial main-game carried-storage capacity of `Storage Small 2`.

## Equipment as progression

Equipment is expected to become a meaningful crafting/progression surface. Its value can come from practical survival capabilities such as storage, protection, warmth, access, visibility, concealment, comfort, or mood effects.

## SUPERSEDES

The following earlier rules are superseded:

- `Inventory = equipped`;
- a fixed five-card generic carrying capacity as Nadir's permanent Inventory model;
- the earlier Neck slot;
- representing item size through a separate `size` field/type rather than Markers;
- representing carrying capacity through a separate `storage` object/type rather than Values;
- representing equipment-slot compatibility through a separate `equip` field;
- authored Left Hand/Right Hand compatibility on ordinary movable cards.

## Schema discipline

Do not invent new JSON structure for equipment or storage unless Simon explicitly asks for it.

If the existing Markers, Values, References, or other already-decided structures cannot express a future mechanic, record that as an unresolved design question instead of adding a new authored field or object shape.

## OPEN

The following remain undecided beyond the current prototype convention:

- the final long-term packing/allocation model if the prototype convention proves insufficient;
- whether the UI should identify which equipped storage item supplies capacity for each carried card;
- exact effects of most clothing/equipment families;
- which future items use the Trinket slots and what they do;
- whether equipping/unequipping should later consume time;
- whether any future equipment occupies more than one slot.
