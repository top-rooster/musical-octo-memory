import type {
  ActionDefinition,
  ActionRole,
  ActionSelector,
  CardInstance,
  GameState,
  ValueOperand,
} from "../domain/types";
import { clampValue, getValue, hasMarker } from "./cardState";
import { effectiveVision, searchDuration, travelDuration } from "./vision";

export interface ActionMatch {
  action: ActionDefinition;
  acceptedId: string;
  receivedId: string;
  selfId: string;
  otherId: string;
}

export interface ValueChange {
  cardId: string;
  attribute: string;
  before: number;
  after: number;
}

export interface ActionExecutionResult {
  state: GameState;
  success: boolean;
  reason?: "no-match" | "ambiguous" | "invalid" | "too-dark";
  message?: string;
  match?: ActionMatch;
  valueChanges: ValueChange[];
  discardedCardIds: string[];
  minutes: number;
  processTicks: number;
}

type ExecutableAction = Pick<ActionDefinition, "id" | "name" | "effects">;

type PlannedEffect =
  | { kind: "add-marker"; cardId: string; marker: string }
  | { kind: "remove-marker"; cardId: string; marker: string }
  | { kind: "value"; cardId: string; value: string; operator: "=" | "+=" | "-="; operand: number }
  | { kind: "discard"; cardId: string }
  | { kind: "set-room"; destinationRoomId: string }
  | { kind: "spend-time"; minutes: number };

interface ActionPlan {
  action: ExecutableAction;
  effects: PlannedEffect[];
}

interface Roles { selfId?: string; otherId?: string; }

function masterActions(state: GameState, card: CardInstance): ActionDefinition[] {
  return state.masters.find((master) => master.id === card.masterId)?.actions ?? [];
}

export function evaluateSelector(selector: ActionSelector, card: CardInstance): boolean {
  if (selector.kind === "marker") return hasMarker(card, selector.marker);
  if (selector.kind === "and") return selector.selectors.every((child) => evaluateSelector(child, card));
  if (selector.kind === "or") return selector.selectors.some((child) => evaluateSelector(child, card));
  if (selector.kind === "not") return !evaluateSelector(selector.selector, card);
  const value = getValue(card, selector.value)?.value;
  if (value === undefined) return false;
  switch (selector.operator) {
    case ">": return value > selector.operand;
    case ">=": return value >= selector.operand;
    case "<": return value < selector.operand;
    case "<=": return value <= selector.operand;
    case "=": return value === selector.operand;
    case "<>": return value !== selector.operand;
  }
}

export function matchingActions(
  state: GameState,
  accepted: CardInstance,
  received: CardInstance,
): ActionMatch[] {
  const onMatches = masterActions(state, accepted)
    .filter((action) => action.applicable.direction === "on" &&
      evaluateSelector(action.applicable.selector, received))
    .map((action) => ({
      action,
      acceptedId: accepted.id,
      receivedId: received.id,
      selfId: accepted.id,
      otherId: received.id,
    }));
  const receiveMatches = masterActions(state, received)
    .filter((action) => action.applicable.direction === "receive" &&
      evaluateSelector(action.applicable.selector, accepted))
    .map((action) => ({
      action,
      acceptedId: accepted.id,
      receivedId: received.id,
      selfId: received.id,
      otherId: accepted.id,
    }));
  return [...onMatches, ...receiveMatches];
}

function cardForRole(
  state: GameState,
  roles: Roles,
  role: ActionRole,
  activeIds: Set<string>,
): CardInstance | undefined {
  const cardId = role === "self" ? roles.selfId : roles.otherId;
  return cardId && activeIds.has(cardId)
    ? state.cards.find((card) => card.id === cardId)
    : undefined;
}

function resolveOperand(
  state: GameState,
  roles: Roles,
  operand: number | ValueOperand,
  activeIds: Set<string>,
): number | undefined {
  if (typeof operand === "number") return Number.isFinite(operand) ? operand : undefined;
  if (!operand || typeof operand !== "object") return undefined;
  const card = cardForRole(state, roles, operand.target, activeIds);
  return card ? getValue(card, operand.value)?.value : undefined;
}

function resolvedMinutes(state: GameState, actionId: string, baseMinutes: number): number | null {
  if (actionId === "travel") return travelDuration(baseMinutes, effectiveVision(state));
  if (actionId === "search") return searchDuration(baseMinutes, effectiveVision(state));
  return baseMinutes;
}

function planAction(
  state: GameState,
  action: ExecutableAction,
  roles: Roles,
): { plan?: ActionPlan; reason?: ActionExecutionResult["reason"]; message?: string } {
  const activeIds = new Set(state.cards.map((card) => card.id));
  const effects: PlannedEffect[] = [];
  for (const effect of action.effects) {
    if (effect.kind === "spend-time") {
      const baseMinutes = resolveOperand(state, roles, effect.operand, activeIds);
      if (baseMinutes === undefined || baseMinutes < 0) {
        return { reason: "invalid", message: `Action "${action.id}" has an unresolved spend-time operand` };
      }
      const minutes = resolvedMinutes(state, action.id, baseMinutes);
      if (minutes === null) return { reason: "too-dark", message: `Action "${action.id}" is blocked by Vision` };
      effects.push({ kind: "spend-time", minutes });
      continue;
    }
    if (effect.kind === "set-room") {
      const card = cardForRole(state, roles, effect.target, activeIds);
      const destinationRoomId = card?.references[effect.reference];
      if (!destinationRoomId || !state.rooms?.[destinationRoomId]) {
        return { reason: "invalid", message: `Action "${action.id}" has an unresolved Room Reference` };
      }
      effects.push({ kind: "set-room", destinationRoomId });
      continue;
    }
    const card = cardForRole(state, roles, effect.target, activeIds);
    if (!card) return { reason: "invalid", message: `Action "${action.id}" has an unresolved ${effect.target} target` };
    if (effect.kind === "discard") {
      effects.push({ kind: "discard", cardId: card.id });
      activeIds.delete(card.id);
      continue;
    }
    if (effect.kind === "add-marker" || effect.kind === "remove-marker") {
      effects.push({ kind: effect.kind, cardId: card.id, marker: effect.marker });
      continue;
    }
    if (effect.kind !== "value") {
      return { reason: "invalid", message: `Action "${action.id}" has an unsupported effect` };
    }
    const targetValue = getValue(card, effect.value);
    const operand = resolveOperand(state, roles, effect.operand, activeIds);
    if (!targetValue || operand === undefined) {
      return { reason: "invalid", message: `Action "${action.id}" has an unresolved Value operand` };
    }
    effects.push({
      kind: "value",
      cardId: card.id,
      value: effect.value,
      operator: effect.operator,
      operand,
    });
  }
  return { plan: { action, effects } };
}

function applyValueEffect(state: GameState, effect: Extract<PlannedEffect, { kind: "value" }>): GameState | null {
  const card = state.cards.find((candidate) => candidate.id === effect.cardId);
  const current = card && getValue(card, effect.value);
  if (!card || !current) return null;
  const raw = effect.operator === "="
    ? effect.operand
    : effect.operator === "+=" ? current.value + effect.operand : current.value - effect.operand;
  const value = clampValue(raw, current.min, current.max);
  return {
    ...state,
    cards: state.cards.map((candidate) => candidate.id === card.id ? {
      ...candidate,
      attributes: candidate.attributes.map((attribute) =>
        attribute.kind === "value" && attribute.id === effect.value
          ? { ...attribute, value }
          : attribute),
    } : candidate),
  };
}

function processWriteKeys(effect: PlannedEffect): string[] {
  if (effect.kind === "value") return [`card:${effect.cardId}:value:${effect.value}`];
  if (effect.kind === "add-marker" || effect.kind === "remove-marker") {
    return [`card:${effect.cardId}:marker:${effect.marker}`];
  }
  if (effect.kind === "discard") return [`card:${effect.cardId}:*`];
  return [effect.kind];
}

function processEffectsConflict(first: PlannedEffect, second: PlannedEffect): boolean {
  if (first.kind === "discard" || second.kind === "discard") {
    const firstCard = "cardId" in first ? first.cardId : undefined;
    const secondCard = "cardId" in second ? second.cardId : undefined;
    return Boolean(firstCard && firstCard === secondCard);
  }
  return processWriteKeys(first).some((key) => processWriteKeys(second).includes(key));
}

function applySimpleEffect(state: GameState, effect: PlannedEffect): GameState | null {
  if (effect.kind === "value") return applyValueEffect(state, effect);
  if (effect.kind === "discard") {
    if (!state.cards.some((card) => card.id === effect.cardId)) return null;
    return { ...state, cards: state.cards.filter((card) => card.id !== effect.cardId) };
  }
  if (effect.kind === "add-marker" || effect.kind === "remove-marker") {
    const card = state.cards.find((candidate) => candidate.id === effect.cardId);
    if (!card) return null;
    const has = hasMarker(card, effect.marker);
    const attributes = effect.kind === "add-marker"
      ? has ? card.attributes : [...card.attributes, { kind: "marker" as const, id: effect.marker }]
      : card.attributes.filter((attribute) => !(attribute.kind === "marker" && attribute.id === effect.marker));
    return {
      ...state,
      cards: state.cards.map((candidate) => candidate.id === card.id ? { ...candidate, attributes } : candidate),
    };
  }
  if (effect.kind === "set-room") {
    const room = state.rooms?.[effect.destinationRoomId];
    if (!room) return null;
    return {
      ...state,
      currentRoomId: room.id,
      rooms: { ...state.rooms, [room.id]: { ...room, discovered: true } },
    };
  }
  return null;
}

function applyProcessTick(state: GameState): { state?: GameState; message?: string } {
  if (state.phase !== "main") return { state };
  const effects: PlannedEffect[] = [];
  for (const card of state.cards) {
    const master = state.masters.find((candidate) => candidate.id === card.masterId);
    for (const [index, process] of (master?.processes ?? []).entries()) {
      const planned = planAction(
        state,
        { id: `process-${master!.id}-${index}`, name: `${master!.title} Process`, effects: process.effects },
        { selfId: card.id },
      );
      if (!planned.plan) return { message: planned.message ?? "A Process could not be resolved" };
      if (planned.plan.effects.some((effect) => effect.kind === "spend-time" || effect.kind === "set-room")) {
        return { message: "Processes cannot advance time or change Rooms" };
      }
      effects.push(...planned.plan.effects);
    }
  }
  for (let first = 0; first < effects.length; first += 1) {
    for (let second = first + 1; second < effects.length; second += 1) {
      if (processEffectsConflict(effects[first], effects[second])) {
        return { message: "Simultaneous Process effects conflict" };
      }
    }
  }
  let next = state;
  for (const effect of effects) {
    const applied = applySimpleEffect(next, effect);
    if (!applied) return { message: "A Process effect could not be applied" };
    next = applied;
  }
  const body = next.cards.find((card) => card.masterId === "body");
  if (body && getValue(body, "hydration")?.value === 0) next = { ...next, gameOver: true };
  return { state: next };
}

export function crossedQuarterHourTicks(oldMinutes: number, newMinutes: number): number {
  return Math.floor(newMinutes / 15) - Math.floor(oldMinutes / 15);
}

export function advanceWorldTime(
  state: GameState,
  minutes: number,
): { state: GameState; success: boolean; processTicks: number; message?: string } {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return { state, success: false, processTicks: 0, message: "spend-time must be a non-negative number" };
  }
  const start = state.elapsedMinutes ?? 0;
  const end = start + minutes;
  const processTicks = crossedQuarterHourTicks(start, end);
  let next = state;
  let boundary = (Math.floor(start / 15) + 1) * 15;
  while (boundary <= end) {
    next = { ...next, elapsedMinutes: boundary };
    const tick = applyProcessTick(next);
    if (!tick.state) return { state, success: false, processTicks: 0, message: tick.message };
    next = tick.state;
    boundary += 15;
  }
  return { state: { ...next, elapsedMinutes: end }, success: true, processTicks };
}

function valueChanges(before: GameState, after: GameState, plan: ActionPlan): ValueChange[] {
  const directValues = plan.effects.filter(
    (effect): effect is Extract<PlannedEffect, { kind: "value" }> => effect.kind === "value",
  );
  return directValues.flatMap((effect) => {
    const beforeCard = before.cards.find((card) => card.id === effect.cardId);
    const afterCard = after.cards.find((card) => card.id === effect.cardId);
    const beforeValue = beforeCard && getValue(beforeCard, effect.value);
    const afterValue = afterCard && getValue(afterCard, effect.value);
    return beforeValue && afterValue ? [{
      cardId: effect.cardId,
      attribute: effect.value,
      before: beforeValue.value,
      after: afterValue.value,
    }] : [];
  });
}

function runPlan(
  original: GameState,
  plan: ActionPlan,
): Omit<ActionExecutionResult, "match"> {
  let next = original;
  let minutes = 0;
  let processTicks = 0;
  const discardedCardIds: string[] = [];
  for (const effect of plan.effects) {
    if (effect.kind === "spend-time") {
      const advanced = advanceWorldTime(next, effect.minutes);
      if (!advanced.success) {
        return {
          state: original,
          success: false,
          reason: "invalid",
          message: advanced.message,
          valueChanges: [],
          discardedCardIds: [],
          minutes: 0,
          processTicks: 0,
        };
      }
      next = advanced.state;
      minutes += effect.minutes;
      processTicks += advanced.processTicks;
      continue;
    }
    const applied = applySimpleEffect(next, effect);
    if (!applied) {
      return {
        state: original,
        success: false,
        reason: "invalid",
        message: `Action "${plan.action.id}" could not complete`,
        valueChanges: [],
        discardedCardIds: [],
        minutes: 0,
        processTicks: 0,
      };
    }
    if (effect.kind === "discard") discardedCardIds.push(effect.cardId);
    next = applied;
  }
  return {
    state: next,
    success: true,
    valueChanges: valueChanges(original, next, plan),
    discardedCardIds,
    minutes,
    processTicks,
  };
}

export function executeStandaloneAction(
  state: GameState,
  action: ExecutableAction,
): ActionExecutionResult {
  const planned = planAction(state, action, {});
  if (!planned.plan) return {
    state,
    success: false,
    reason: planned.reason ?? "invalid",
    message: planned.message,
    valueChanges: [],
    discardedCardIds: [],
    minutes: 0,
    processTicks: 0,
  };
  return runPlan(state, planned.plan);
}

export function executeCardInteraction(
  state: GameState,
  accepted: CardInstance,
  received: CardInstance,
): ActionExecutionResult {
  const matches = matchingActions(state, accepted, received);
  if (matches.length === 0) return {
    state, success: false, reason: "no-match", valueChanges: [], discardedCardIds: [], minutes: 0, processTicks: 0,
  };
  if (matches.length > 1) return {
    state, success: false, reason: "ambiguous", message: "More than one Action matches this pair",
    valueChanges: [], discardedCardIds: [], minutes: 0, processTicks: 0,
  };
  const match = matches[0];
  const planned = planAction(state, match.action, { selfId: match.selfId, otherId: match.otherId });
  if (!planned.plan) return {
    state,
    success: false,
    reason: planned.reason ?? "invalid",
    message: planned.message,
    match,
    valueChanges: [],
    discardedCardIds: [],
    minutes: 0,
    processTicks: 0,
  };
  return { ...runPlan(state, planned.plan), match };
}
