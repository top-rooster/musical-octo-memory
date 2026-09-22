import type {
  CardInstance,
  CardMaster,
  EquipmentSlot,
  GameState,
  ItemSize,
} from "../domain/types";
import { getValue, hasMarker, isAnchored } from "./cardState";

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "left-hand", "right-hand", "head", "eyes", "trinket-1", "trinket-2", "chest", "back", "legs", "feet",
];
export const ITEM_SIZES: ItemSize[] = ["Small", "Medium", "Large"];
const SIZE_MARKERS: Record<ItemSize, string> = {
  Small: "small",
  Medium: "medium",
  Large: "large",
};
const STORAGE_VALUES: Record<ItemSize, string> = {
  Small: "storage-small",
  Medium: "storage-medium",
  Large: "storage-large",
};
export function equipmentSlotName(slot: EquipmentSlot): string {
  return slot.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}
export type CapacityCounts = Record<ItemSize, number>;

export function isHandSlot(slot: EquipmentSlot): boolean {
  return slot === "left-hand" || slot === "right-hand";
}

export function itemSize(card: Pick<CardInstance | CardMaster, "attributes">): ItemSize | undefined {
  return ITEM_SIZES.find((size) => hasMarker(card, SIZE_MARKERS[size]));
}

export function canEquip(card: CardInstance, slot: EquipmentSlot): boolean {
  if (isHandSlot(slot)) {
    return !isAnchored(card) && !card.nadirState;
  }
  return card.references.equip === slot;
}

export function isEquipped(card: CardInstance): boolean {
  return card.zone === "inventory" && Boolean(card.equipmentSlot);
}

export function storageCapacity(
  cards: CardInstance[],
): CapacityCounts {
  const capacity: CapacityCounts = { Small: 0, Medium: 0, Large: 0 };
  for (const card of cards) {
    if (!isEquipped(card) || !card.equipmentSlot || !canEquip(card, card.equipmentSlot)) continue;
    for (const size of ITEM_SIZES) {
      capacity[size] += getValue(card, STORAGE_VALUES[size])?.value ?? 0;
    }
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
): CapacityAllocation {
  const capacity = storageCapacity(cards);
  const remaining = { ...capacity };
  const used: CapacityCounts = { Small: 0, Medium: 0, Large: 0 };
  const carried = cards.filter((card) =>
    card.zone === "inventory" && !card.equipmentSlot && !isAnchored(card));
  const unplacedIds = carried.filter((card) => !itemSize(card)).map((card) => card.id);
  const bins: Record<ItemSize, ItemSize[]> = {
    Large: ["Large"],
    Medium: ["Medium", "Large"],
    Small: ["Small", "Medium", "Large"],
  };
  for (const size of ["Large", "Medium", "Small"] as ItemSize[]) {
    for (const card of carried.filter((item) => itemSize(item) === size)) {
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
  const allocation = allocateCarriedCapacity(simulated);
  return allocation.unplacedIds.includes(card.id)
    ? { legal: false, reason: "capacity" }
    : { legal: true };
}
