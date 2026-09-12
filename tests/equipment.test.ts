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
    expect(openingSelectionCount(moveToInventory(state, find(state, "body").id))).toBe(5);
  });

  it("lets either Hand hold ordinary items while other slots use authored compatibility", () => {
    const glasses = CARD_MASTERS.find((master) => master.id === "glasses")!;
    const cannedFood = CARD_MASTERS.find((master) => master.id === "canned-food")!;
    const plasticBottle = CARD_MASTERS.find((master) => master.id === "plastic-bottle")!;
    const body = find(state, "body");
    const bodyMaster = CARD_MASTERS.find((master) => master.id === body.masterId)!;
    expect(canEquip(glasses, "eyes")).toBe(true);
    expect(canEquip(cannedFood, "left-hand")).toBe(true);
    expect(canEquip(cannedFood, "right-hand")).toBe(true);
    expect(canEquip(plasticBottle, "left-hand")).toBe(true);
    expect(canEquip(plasticBottle, "right-hand")).toBe(true);
    expect(canEquip(cannedFood, "eyes")).toBe(false);
    expect(canEquip(bodyMaster, "left-hand", body)).toBe(false);
  });

  it("distinguishes equipped cards from merely carried cards", () => {
    const glasses = find(state, "glasses");
    const master = CARD_MASTERS.find((item) => item.id === glasses.masterId)!;
    state = moveToInventory(state, glasses.id);
    expect(isEquipmentActive(find(state, "glasses"), master)).toBe(false);
    state = equipCard(state, glasses.id, "eyes");
    expect(isEquipmentActive(find(state, "glasses"), master)).toBe(true);
  });

  it("provides Pants capacity and phase-gated Backpack capacity", () => {
    expect(storageCapacity(state.cards, state.masters, "opening")).toEqual({
      Small: 2, Medium: 0, Large: 0,
    });
    state = equipCard(state, find(state, "simple-backpack").id, "back");
    expect(storageCapacity(state.cards, state.masters, "opening").Medium).toBe(0);
    expect(storageCapacity(state.cards, state.masters, "main").Medium).toBe(5);
  });

  it("holds Medium opening items in Hands without using carried capacity", () => {
    const cannedFood = find(state, "canned-food");
    const plasticBottle = find(state, "plastic-bottle");
    state = equipCard(state, cannedFood.id, "left-hand");
    state = equipCard(state, plasticBottle.id, "right-hand");

    expect(find(state, "canned-food").equipmentSlot).toBe("left-hand");
    expect(find(state, "plastic-bottle").equipmentSlot).toBe("right-hand");
    expect(openingSelectionCount(state)).toBe(2);
    expect(allocateCarriedCapacity(state.cards, state.masters, "opening").used).toEqual({
      Small: 0, Medium: 0, Large: 0,
    });
    const cannedMaster = CARD_MASTERS.find((master) => master.id === cannedFood.masterId)!;
    expect(isEquipmentActive(find(state, "canned-food"), cannedMaster)).toBe(true);
    expect(isAuthoredEquipmentEffectActive(find(state, "canned-food"), cannedMaster)).toBe(false);
  });

  it("still applies storage legality when a held card moves to flat Inventory", () => {
    expect(canCarryCard(state, find(state, "pocket-knife")).legal).toBe(true);
    state = equipCard(state, find(state, "canned-food").id, "left-hand");
    expect(canCarryCard(state, find(state, "canned-food"))).toEqual({
      legal: false,
      reason: "capacity",
    });
  });

  it("allocates Small, Medium, and Large items to the smallest compatible capacity", () => {
    state = equipCard(state, find(state, "simple-backpack").id, "back");
    state = { ...state, phase: "main" };
    const small = [find(state, "pocket-knife"), find(state, "spare-batteries"), find(state, "pain-killers")];
    const medium = [find(state, "canned-food"), find(state, "plastic-bottle")];
    [...small, ...medium].forEach((card) => { state = moveToInventory(state, card.id); });
    const allocation = allocateCarriedCapacity(state.cards, state.masters, "main");
    expect(allocation.capacity).toEqual({ Small: 2, Medium: 5, Large: 0 });
    expect(allocation.used).toEqual({ Small: 2, Medium: 3, Large: 0 });
    expect(allocation.unplacedIds).toEqual([]);
  });
});
