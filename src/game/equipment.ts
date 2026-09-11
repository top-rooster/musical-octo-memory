import type {
  CardInstance,
  CardMaster,
  EquipmentSlot,
  GamePhase,
  GameState,
  ItemSize,
} from "../domain/types";
import { getValue, isAnchored } from "./rules";

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "Left Hand", "Right Hand", "Head", "Eyes", "Neck", "Chest", "Back", "Legs", "Feet",
];
export const ITEM_SIZES: ItemSize[] = ["Small", "Medium", "Large"];
export type CapacityCounts = Record<ItemSize, number>;

function masterFor(masters: CardMaster[], card: CardInstance): CardMaster | undefined {
  return masters.find((master) => master.id === card.masterId);
}

export function isHandSlot(slot: EquipmentSlot): boolean {
  return slot === "Left Hand" || slot === "Right Hand";
}

export function canEquip(
  master: CardMaster,
  slot: EquipmentSlot,
  card?: CardInstance,
): boolean {
  if (isHandSlot(slot)) {
    return Boolean(master.size) && !isAnchored(card ?? master);
  }
  return master.equipSlots.includes(slot);
}

export function isEquipped(card: CardInstance): boolean {
  return card.zone === "inventory" && Boolean(card.equipmentSlot);
}

export function isEquipmentActive(card: CardInstance, master: CardMaster): boolean {
  if (!isEquipped(card) || !card.equipmentSlot || !canEquip(master, card.equipmentSlot, card)) return false;
  if (master.whileEquipped.length && getValue(card, "Battery")?.value === 0) return false;
  return true;
}

export function isAuthoredEquipmentEffectActive(
  card: CardInstance,
  master: CardMaster,
): boolean {
  return isEquipmentActive(card, master) && Boolean(
    card.equipmentSlot && master.equipSlots.includes(card.equipmentSlot),
  );
}

export function storageCapacity(
  cards: CardInstance[],
  masters: CardMaster[],
  phase: GamePhase,
): CapacityCounts {
  const capacity: CapacityCounts = { Small: 0, Medium: 0, Large: 0 };
  for (const card of cards) {
    const master = masterFor(masters, card);
    if (!master?.storage || !isAuthoredEquipmentEffectActive(card, master)) continue;
    if (master.storage.phase && master.storage.phase !== phase) continue;
    capacity[master.storage.size] += master.storage.count;
  }
  return capacity;
}

export interface CapacityAllocation {
  capacity: CapacityCounts;
  used: CapacityCounts;
  unplacedIds: string[];
}

export function allocateCarriedCapacity(
  cards: CardInstance[],
  masters: CardMaster[],
  phase: GamePhase,
): CapacityAllocation {
  const capacity = storageCapacity(cards, masters, phase);
  const remaining = { ...capacity };
  const used: CapacityCounts = { Small: 0, Medium: 0, Large: 0 };
  const carried = cards.filter((card) => {
    const master = masterFor(masters, card);
    return card.zone === "inventory" && !card.equipmentSlot && master?.size && !isAnchored(card);
  });
  const unplacedIds: string[] = [];
  const bins: Record<ItemSize, ItemSize[]> = {
    Large: ["Large"],
    Medium: ["Medium", "Large"],
    Small: ["Small", "Medium", "Large"],
  };
  for (const size of ["Large", "Medium", "Small"] as ItemSize[]) {
    for (const card of carried.filter((item) => masterFor(masters, item)?.size === size)) {
      const bin = bins[size].find((candidate) => remaining[candidate] > 0);
      if (!bin) unplacedIds.push(card.id);
      else {
        remaining[bin] -= 1;
        used[bin] += 1;
      }
    }
  }
  return { capacity, used, unplacedIds };
}

export function openingSelectionCount(state: GameState, excludingId?: string): number {
  return state.cards.filter(
    (card) => card.id !== excludingId && card.offered && card.zone === "inventory",
  ).length;
}

export function canTakeOpeningCard(state: GameState, card: CardInstance): boolean {
  if (state.phase !== "opening" || !card.offered || card.zone === "inventory") return true;
  return openingSelectionCount(state) < (state.openingTakeLimit ?? 0);
}

export function canCarryCard(
  state: GameState,
  card: CardInstance,
): { legal: boolean; reason?: "opening-limit" | "capacity" } {
  if (!canTakeOpeningCard(state, card)) return { legal: false, reason: "opening-limit" };
  const simulated = state.cards.map((candidate) =>
    candidate.id === card.id
      ? { ...candidate, zone: "inventory" as const, roomId: undefined, equipmentSlot: undefined }
      : candidate,
  );
  const allocation = allocateCarriedCapacity(simulated, state.masters, state.phase ?? "main");
  return allocation.unplacedIds.includes(card.id)
    ? { legal: false, reason: "capacity" }
    : { legal: true };
}
