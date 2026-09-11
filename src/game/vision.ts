import type { GameState, LightLevel } from "../domain/types";
import { getValue } from "./rules";
import { isEquipmentActive } from "./equipment";

export const LIGHT_MODIFIERS: Record<LightLevel, number> = {
  Bright: 0,
  Dim: -1,
  Twilight: -3,
  Darkness: -4,
};

export function effectiveVision(state: GameState, roomId = state.currentRoomId): number {
  const mind = state.cards.find((card) => card.masterId === "mind");
  const base = mind ? getValue(mind, "Vision")?.value ?? 0 : 0;
  const equipment = state.cards.reduce((sum, card) => {
    const master = state.masters.find((candidate) => candidate.id === card.masterId);
    if (!master || !isEquipmentActive(card, master)) return sum;
    return sum + master.whileEquipped
      .filter((modifier) => modifier.attribute === "Vision")
      .reduce((amount, modifier) => amount + modifier.amount, 0);
  }, 0);
  const light = roomId && state.rooms?.[roomId]?.light;
  return base + equipment + (light ? LIGHT_MODIFIERS[light] : 0);
}

export function searchDuration(baseMinutes: number, vision: number): number | null {
  if (vision <= 0) return null;
  if (vision === 1) return baseMinutes * 3;
  if (vision === 2) return baseMinutes * 2;
  return baseMinutes;
}

export function travelDuration(baseMinutes: number, vision: number): number {
  if (vision <= 0) return baseMinutes * 3;
  if (vision === 1) return baseMinutes * 2;
  return baseMinutes;
}

export type VisionTaskClass = "leave" | "low-light" | "normal-light" | "precision";
export function canPerformVisionTask(vision: number, task: VisionTaskClass): boolean {
  if (task === "leave") return true;
  if (task === "low-light") return vision >= 2;
  if (task === "normal-light") return vision >= 3;
  return vision >= 4;
}
