import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import type { CardInstance, GameState } from "../src/domain/types";
import {
  allocateCarriedCapacity,
  canEquip,
  canTakeOpeningCard,
  isAuthoredEquipmentEffectActive,
  isEquipmentActive,
  openingSelectionCount,
  storageCapacity,
  canCarryCard,
} from "../src/game/equipment";
import { createWorldGameState, equipCard } from "../src/game/world";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";

function seeded(seed = 12) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x1_0000_0000);
}
function find(state: GameState, title: string, occurrence = 0): CardInstance {
  const matches = state.cards.filter((card) => card.title === title);
  if (!matches[occurrence]) throw new Error(`Missing ${title}`);
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

describe("equipment, opening, and carried capacity", () => {
  let state: GameState;
  beforeEach(() => {
    state = createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, { x: 0, y: 0, width: 1400, height: 800 }, seeded(),
    );
  });

  it("enforces the five-offered-card opening limit", () => {
    const offered = state.cards.filter((card) => card.offered);
    offered.slice(0, 5).forEach((card) => { state = moveToInventory(state, card.id); });
    expect(openingSelectionCount(state)).toBe(5);
    expect(canTakeOpeningCard(state, offered[5])).toBe(false);
    expect(openingSelectionCount(moveToInventory(state, find(state, "Body").id))).toBe(5);
  });

  it("lets either Hand hold ordinary items while other slots use authored compatibility", () => {
    const glasses = CARD_MASTERS.find((master) => master.title === "Glasses")!;
    const cannedFood = CARD_MASTERS.find((master) => master.title === "Canned Food")!;
    const plasticBottle = CARD_MASTERS.find((master) => master.title === "Plastic Bottle")!;
    const body = find(state, "Body");
    const bodyMaster = CARD_MASTERS.find((master) => master.id === body.masterId)!;
    expect(canEquip(glasses, "Eyes")).toBe(true);
    expect(canEquip(cannedFood, "Left Hand")).toBe(true);
    expect(canEquip(cannedFood, "Right Hand")).toBe(true);
    expect(canEquip(plasticBottle, "Left Hand")).toBe(true);
    expect(canEquip(plasticBottle, "Right Hand")).toBe(true);
    expect(canEquip(cannedFood, "Eyes")).toBe(false);
    expect(canEquip(bodyMaster, "Left Hand", body)).toBe(false);
  });

  it("distinguishes equipped cards from merely carried cards", () => {
    const glasses = find(state, "Glasses");
    const master = CARD_MASTERS.find((item) => item.id === glasses.masterId)!;
    state = moveToInventory(state, glasses.id);
    expect(isEquipmentActive(find(state, "Glasses"), master)).toBe(false);
    state = equipCard(state, glasses.id, "Eyes");
    expect(isEquipmentActive(find(state, "Glasses"), master)).toBe(true);
  });

  it("provides Pants capacity and phase-gated Backpack capacity", () => {
    expect(storageCapacity(state.cards, state.masters, "opening")).toEqual({
      Small: 2, Medium: 0, Large: 0,
    });
    state = equipCard(state, find(state, "Simple Backpack").id, "Back");
    expect(storageCapacity(state.cards, state.masters, "opening").Medium).toBe(0);
    expect(storageCapacity(state.cards, state.masters, "main").Medium).toBe(5);
  });

  it("holds Medium opening items in Hands without using carried capacity", () => {
    const cannedFood = find(state, "Canned Food");
    const plasticBottle = find(state, "Plastic Bottle");
    state = equipCard(state, cannedFood.id, "Left Hand");
    state = equipCard(state, plasticBottle.id, "Right Hand");

    expect(find(state, "Canned Food").equipmentSlot).toBe("Left Hand");
    expect(find(state, "Plastic Bottle").equipmentSlot).toBe("Right Hand");
    expect(openingSelectionCount(state)).toBe(2);
    expect(allocateCarriedCapacity(state.cards, state.masters, "opening").used).toEqual({
      Small: 0, Medium: 0, Large: 0,
    });
    const cannedMaster = CARD_MASTERS.find((master) => master.id === cannedFood.masterId)!;
    expect(isEquipmentActive(find(state, "Canned Food"), cannedMaster)).toBe(true);
    expect(isAuthoredEquipmentEffectActive(find(state, "Canned Food"), cannedMaster)).toBe(false);
  });

  it("still applies storage legality when a held card moves to flat Inventory", () => {
    expect(canCarryCard(state, find(state, "Pocket Knife")).legal).toBe(true);
    state = equipCard(state, find(state, "Canned Food").id, "Left Hand");
    expect(canCarryCard(state, find(state, "Canned Food"))).toEqual({
      legal: false,
      reason: "capacity",
    });
  });

  it("allocates Small, Medium, and Large items to the smallest compatible capacity", () => {
    state = equipCard(state, find(state, "Simple Backpack").id, "Back");
    state = { ...state, phase: "main" };
    const small = [find(state, "Pocket Knife"), find(state, "Spare Batteries"), find(state, "Pain Killers")];
    const medium = [find(state, "Canned Food"), find(state, "Plastic Bottle")];
    [...small, ...medium].forEach((card) => { state = moveToInventory(state, card.id); });
    const allocation = allocateCarriedCapacity(state.cards, state.masters, "main");
    expect(allocation.capacity).toEqual({ Small: 2, Medium: 5, Large: 0 });
    expect(allocation.used).toEqual({ Small: 2, Medium: 3, Large: 0 });
    expect(allocation.unplacedIds).toEqual([]);
  });
});
