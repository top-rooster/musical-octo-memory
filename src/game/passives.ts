import type { CardInstance, GameState } from "../domain/types";
import { getValue } from "./cardState";
import { evaluateCondition } from "./logic";

export interface EffectiveValueResult {
  valid: boolean;
  base: number;
  modifier: number;
  value: number;
  reason?: string;
}

function hasActiveEquipmentPlacement(source: CardInstance): boolean {
  if (!source.equipmentSlot) return false;
  const authoredSlot = source.references.equip;
  return authoredSlot
    ? source.equipmentSlot === authoredSlot
    : source.equipmentSlot === "left-hand" || source.equipmentSlot === "right-hand";
}

export function effectiveCardValue(
  state: GameState,
  target: CardInstance,
  valueId: string,
): EffectiveValueResult {
  const base = getValue(target, valueId)?.value ?? 0;
  let modifier = 0;
  for (const source of state.cards) {
    const master = state.masters.find((candidate) => candidate.id === source.masterId);
    for (const passive of master?.passives ?? []) {
      const condition = evaluateCondition(passive.condition, { state, self: source });
      if (!condition.valid) return { valid: false, base, modifier: 0, value: base, reason: condition.reason };
      if (!condition.value || !hasActiveEquipmentPlacement(source)) continue;
      for (const effect of passive.effects) {
        if (effect.target === "nadir" && target.nadirState && effect.value === valueId) {
          modifier += effect.operand;
        }
      }
    }
  }
  return { valid: true, base, modifier, value: base + modifier };
}
