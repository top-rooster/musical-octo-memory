import type {
  ActionRole,
  CardInstance,
  ComparisonOperator,
  GameState,
  LogicCondition,
} from "../domain/types";
import { getValue, hasMarker } from "./cardState";

export interface LogicContext {
  state: GameState;
  self: CardInstance;
  other?: CardInstance;
}

export interface LogicResult {
  valid: boolean;
  value: boolean;
  reason?: string;
}

export function compareNumbers(
  left: number,
  operator: ComparisonOperator,
  right: number,
): boolean {
  switch (operator) {
    case ">": return left > right;
    case ">=": return left >= right;
    case "<": return left < right;
    case "<=": return left <= right;
    case "=": return left === right;
    case "<>": return left !== right;
  }
}

function cardForTarget(context: LogicContext, target: ActionRole = "self"): CardInstance | undefined {
  return target === "self" ? context.self : context.other;
}

function invalid(reason: string): LogicResult {
  return { valid: false, value: false, reason };
}

function evaluateAll(
  conditions: LogicCondition[],
  context: LogicContext,
  every: boolean,
): LogicResult {
  const results = conditions.map((condition) => evaluateCondition(condition, context));
  const invalidResult = results.find((result) => !result.valid);
  if (invalidResult) return invalidResult;
  return {
    valid: true,
    value: every ? results.every((result) => result.value) : results.some((result) => result.value),
  };
}

export function evaluateCondition(condition: LogicCondition, context: LogicContext): LogicResult {
  if (condition.kind === "and") return evaluateAll(condition.conditions, context, true);
  if (condition.kind === "or") return evaluateAll(condition.conditions, context, false);
  if (condition.kind === "not") {
    const result = evaluateCondition(condition.condition, context);
    return result.valid ? { valid: true, value: !result.value } : result;
  }
  if (condition.kind === "count") {
    let count = 0;
    for (const card of context.state.cards) {
      const result = evaluateCondition(condition.condition, { ...context, self: card });
      if (!result.valid) return result;
      if (result.value) count += 1;
    }
    return { valid: true, value: compareNumbers(count, condition.operator, condition.operand) };
  }
  if (condition.kind === "time") {
    const minuteOfDay = ((context.state.elapsedMinutes ?? 0) % 1440 + 1440) % 1440;
    return { valid: true, value: compareNumbers(minuteOfDay, condition.operator, condition.operandMinutes) };
  }

  const card = cardForTarget(context, condition.target);
  if (!card) return invalid(`Condition target "${condition.target ?? "self"}" is unavailable`);
  if (condition.kind === "marker") {
    return { valid: true, value: hasMarker(card, condition.marker) };
  }
  if (condition.kind === "value") {
    const value = getValue(card, condition.value)?.value;
    return {
      valid: true,
      value: value !== undefined && compareNumbers(value, condition.operator, condition.operand),
    };
  }
  if (condition.kind === "literal") {
    if (condition.literal === "equipped") {
      return { valid: true, value: card.zone === "inventory" && Boolean(card.equipmentSlot) };
    }
    if (condition.literal === "in-inventory") {
      return { valid: true, value: card.zone === "inventory" && !card.equipmentSlot };
    }
    return {
      valid: true,
      value: card.zone === "room" && card.roomId === context.state.currentRoomId,
    };
  }

  const ownedDecks = context.state.decks?.filter(
    (deck) => deck.owner.kind === "card" && deck.owner.id === card.id,
  ) ?? [];
  if (ownedDecks.length > 1) return invalid(`Card "${card.id}" owns more than one deck`);
  const size = ownedDecks[0]?.cards.length ?? 0;
  return { valid: true, value: compareNumbers(size, condition.operator, condition.operand) };
}
