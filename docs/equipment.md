# Equipment

**Status: DECIDED BY SIMON**

Equipment is represented by ordinary cards.

An equipment card is considered **equipped exactly while that card instance is in Inventory**. Moving it out of Inventory unequips it.

There is no separate equipment zone, equipment-slot system, attachment relationship, or `Equipped` Marker in the current design.

This does not mean every card in Inventory is equipment. Food, materials, containers, and other ordinary carried cards may also be in Inventory. The rule is simply that equipment cards do not need another state beyond their zone.

Any effect that depends on equipment being equipped should therefore derive that state from the equipment card being present in Inventory.
