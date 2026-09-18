import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { CardInstance, EquipmentSlot, GameState, ItemSize } from "../src/domain/types";
import {
  allocateCarriedCapacity,
  canCarryCard,
  canEquip,
  canTakeOpeningCard,
  EQUIPMENT_SLOTS,
  equipmentSlotName,
  isEquipmentActive,
  itemSize,
  openingSelectionCount,
  storageCapacity,
} from "../src/game/equipment";
import { createWorldGameState, equipCard } from "../src/game/world";

function seeded(seed = 12) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x1_0000_0000);
}
function find(state: GameState, masterId: string, occurrence = 0): CardInstance {
  const matches = state.cards.filter((card) => card.masterId === masterId);
  if (!matches[occurrence]) throw new Error(`Missing ${masterId}`);
  return matches[occurrence];
}
function moveToInventory(state: GameState, id: string): GameState {
  return {
    ...state,
    cards: state.cards.map((card) => card.id === id
      ? { ...card, zone: "inventory" as const, roomId: undefined, equipmentSlot: undefined }
      : card),
  };
}
function capacityProvider(id: string, slot: EquipmentSlot, values: Partial<Record<ItemSize, number>>): CardInstance {
  return {
    id,
    masterId: id,
    title: id,
    image: "",
    attributes: [
      { kind: "marker", id: "medium" },
      ...Object.entries(values).map(([size, value]) => ({
        kind: "value" as const,
        id: `storage-${size.toLowerCase()}`,
        value: value!, min: 0, max: 100,
      })),
    ],
    references: { equip: slot },
    zone: "inventory",
    equipmentSlot: slot,
    position: { x: 0, y: 0 },
  };
}
function carried(id: string, size?: ItemSize): CardInstance {
  return {
    id,
    masterId: `master-${id}`,
    title: id,
    image: "",
    attributes: size ? [{ kind: "marker", id: size.toLowerCase() }] : [],
    references: {},
    zone: "inventory",
    position: { x: 0, y: 0 },
  };
}

describe("attribute-driven equipment, opening, and carried capacity", () => {
  let state: GameState;
  beforeEach(() => {
    state = createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, { x: 0, y: 0, width: 1400, height: 800 }, seeded(),
    );
  });

  it("enforces the independent five-offered-card opening limit", () => {
    const offered = state.cards.filter((card) => card.offered);
    offered.slice(0, 5).forEach((card) => { state = moveToInventory(state, card.id); });
    expect(openingSelectionCount(state)).toBe(5);
    expect(canTakeOpeningCard(state, offered[5])).toBe(false);
    expect(openingSelectionCount(moveToInventory(state, find(state, "body").id))).toBe(5);
    expect(find(state, "pants").offered).not.toBe(true);
    expect(find(state, "t-shirt").offered).not.toBe(true);
  });

  it("reads non-Hand compatibility from instance References and keeps Hands universal", () => {
    const glasses = find(state, "glasses");
    const pants = find(state, "pants");
    const shirt = find(state, "t-shirt");
    const backpack = find(state, "simple-backpack");
    const cannedFood = find(state, "canned-food");
    const body = find(state, "body");
    expect(canEquip(pants, "legs")).toBe(true);
    expect(canEquip(shirt, "chest")).toBe(true);
    expect(canEquip(glasses, "eyes")).toBe(true);
    expect(canEquip(backpack, "back")).toBe(true);
    expect(canEquip(cannedFood, "left-hand")).toBe(true);
    expect(canEquip(cannedFood, "right-hand")).toBe(true);
    expect(canEquip(cannedFood, "eyes")).toBe(false);
    expect(canEquip(body, "left-hand")).toBe(false);
  });

  it("starts with authored Pants in Legs and T-Shirt in Chest", () => {
    const pants = find(state, "pants");
    const shirt = find(state, "t-shirt");
    expect(pants.equipmentSlot).toBe("legs");
    expect(pants.references).toEqual({ equip: "legs" });
    expect(pants.attributes).toContainEqual(expect.objectContaining({ id: "storage-small", value: 2 }));
    expect(shirt.equipmentSlot).toBe("chest");
    expect(shirt.references).toEqual({ equip: "chest" });
  });

  it("uses two Trinket slots instead of the superseded Neck slot", () => {
    expect(EQUIPMENT_SLOTS).toEqual([
      "left-hand", "right-hand", "head", "eyes", "trinket-1", "trinket-2",
      "chest", "back", "legs", "feet",
    ]);
    expect(EQUIPMENT_SLOTS).not.toContain("neck");
    expect(equipmentSlotName("trinket-1")).toBe("Trinket 1");
    expect(equipmentSlotName("trinket-2")).toBe("Trinket 2");
  });

  it("distinguishes equipped cards from merely carried cards", () => {
    const glasses = find(state, "glasses");
    const master = CARD_MASTERS.find((item) => item.id === glasses.masterId)!;
    state = moveToInventory(state, glasses.id);
    expect(isEquipmentActive(find(state, "glasses"), master)).toBe(false);
    state = equipCard(state, glasses.id, "eyes");
    expect(isEquipmentActive(find(state, "glasses"), master)).toBe(true);
  });

  it("derives Pants and Backpack capacity only from equipped storage Values", () => {
    expect(storageCapacity(state.cards)).toEqual({ Small: 2, Medium: 0, Large: 0 });
    state = moveToInventory(state, find(state, "pants").id);
    expect(storageCapacity(state.cards)).toEqual({ Small: 0, Medium: 0, Large: 0 });
    state = equipCard(state, find(state, "pants").id, "legs");
    state = equipCard(state, find(state, "simple-backpack").id, "back");
    expect(storageCapacity(state.cards)).toEqual({ Small: 2, Medium: 5, Large: 0 });
    state = moveToInventory(state, find(state, "simple-backpack").id);
    expect(storageCapacity(state.cards)).toEqual({ Small: 2, Medium: 0, Large: 0 });
  });

  it("activates Backpack storage during Opening without changing the take limit", () => {
    state = equipCard(state, find(state, "simple-backpack").id, "back");
    expect(storageCapacity(state.cards).Medium).toBe(5);
    const remaining = state.cards.filter((card) => card.offered && card.zone === "room");
    remaining.slice(0, 4).forEach((card) => { state = moveToInventory(state, card.id); });
    expect(openingSelectionCount(state)).toBe(5);
    expect(canTakeOpeningCard(state, remaining[4])).toBe(false);
  });

  it("does not charge carried capacity for equipped or held cards", () => {
    state = equipCard(state, find(state, "canned-food").id, "left-hand");
    state = equipCard(state, find(state, "plastic-bottle").id, "right-hand");
    expect(allocateCarriedCapacity(state.cards).used).toEqual({ Small: 0, Medium: 0, Large: 0 });
  });

  it("allocates Small, Medium, and Large by smallest compatible capacity first", () => {
    const cards = [
      capacityProvider("small-storage", "legs", { Small: 2 }),
      capacityProvider("medium-storage", "back", { Medium: 2 }),
      capacityProvider("large-storage", "head", { Large: 2 }),
      carried("small-a", "Small"), carried("small-b", "Small"), carried("small-overflow", "Small"),
      carried("medium-a", "Medium"), carried("medium-overflow", "Medium"), carried("large-a", "Large"),
    ];
    expect(allocateCarriedCapacity(cards)).toEqual({
      capacity: { Small: 2, Medium: 2, Large: 2 },
      used: { Small: 2, Medium: 2, Large: 2 },
      unplacedIds: [],
    });
  });

  it.each([
    {
      name: "Small into Small",
      providers: [capacityProvider("small-storage", "legs", { Small: 1 })],
      items: [carried("small", "Small")],
      used: { Small: 1, Medium: 0, Large: 0 },
    },
    {
      name: "Small overflow into Medium",
      providers: [
        capacityProvider("small-storage", "legs", { Small: 1 }),
        capacityProvider("medium-storage", "back", { Medium: 1 }),
      ],
      items: [carried("small-a", "Small"), carried("small-b", "Small")],
      used: { Small: 1, Medium: 1, Large: 0 },
    },
    {
      name: "Medium into Medium",
      providers: [capacityProvider("medium-storage", "back", { Medium: 1 })],
      items: [carried("medium", "Medium")],
      used: { Small: 0, Medium: 1, Large: 0 },
    },
    {
      name: "Medium overflow into Large",
      providers: [
        capacityProvider("medium-storage", "back", { Medium: 1 }),
        capacityProvider("large-storage", "head", { Large: 1 }),
      ],
      items: [carried("medium-a", "Medium"), carried("medium-b", "Medium")],
      used: { Small: 0, Medium: 1, Large: 1 },
    },
  ])("allocates $name", ({ providers, items, used }) => {
    expect(allocateCarriedCapacity([...providers, ...items])).toEqual({
      capacity: providers.reduce((total, provider) => {
        for (const size of ["Small", "Medium", "Large"] as const) {
          const value = provider.attributes.find((attribute) =>
            attribute.kind === "value" && attribute.id === `storage-${size.toLowerCase()}`);
          if (value?.kind === "value") total[size] += value.value;
        }
        return total;
      }, { Small: 0, Medium: 0, Large: 0 }),
      used,
      unplacedIds: [],
    });
  });

  it("requires Large capacity for Large items", () => {
    const cards = [capacityProvider("medium-storage", "back", { Medium: 5 }), carried("large", "Large")];
    expect(allocateCarriedCapacity(cards).unplacedIds).toEqual(["large"]);
  });

  it("treats different masters with the same Marker identically without ID lookup", () => {
    const cards = [
      capacityProvider("pants-like", "legs", { Small: 2 }),
      carried("first-master", "Small"),
      carried("second-master", "Small"),
    ];
    expect(itemSize(cards[1])).toBe("Small");
    expect(itemSize(cards[2])).toBe("Small");
    expect(allocateCarriedCapacity(cards).unplacedIds).toEqual([]);
    expect(allocateCarriedCapacity([...cards, carried("third-master", "Small")]).unplacedIds)
      .toEqual(["third-master"]);
  });

  it("rejects missing authored size instead of falling back to identity", () => {
    const missing = carried("flashlight");
    const testState = { ...state, cards: [...state.cards, { ...missing, zone: "room" as const, roomId: "opening-room" }] };
    expect(canCarryCard(testState, testState.cards.at(-1)!)).toEqual({ legal: false, reason: "capacity" });
  });
});
