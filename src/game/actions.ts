import type {
  ActionDefinition,
  ActionRole,
  CardInstance,
  DeckCardState,
  DeckState,
  GameState,
  ValueOperand,
} from "../domain/types";
import { clampValue, getValue, hasMarker } from "./cardState";
import { createOwnedDeckStates, deckOwnedByCard, replaceDeck } from "./decks";
import { evaluateCondition } from "./logic";

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
interface Roles { selfId?: string; otherId?: string; }
export interface ActionExecutionOptions {
  random?: () => number;
  adjustSpendTime?: (
    baseMinutes: number,
    state: GameState,
    roles: Roles,
    action: ExecutableAction,
  ) => number | null;
}

type PlannedEffect =
  | { kind: "add-marker"; cardId: string; marker: string }
  | { kind: "remove-marker"; cardId: string; marker: string }
  | { kind: "value"; cardId: string; value: string; operator: "=" | "+=" | "-="; operand: number }
  | { kind: "discard"; cardId: string }
  | { kind: "set-room"; destinationRoomId: string }
  | { kind: "spend-time"; minutes: number }
  | { kind: "add-random-card"; deckId: string; masterIds: string[] };

interface ActionPlan { action: ExecutableAction; effects: PlannedEffect[]; }

function masterActions(state: GameState, card: CardInstance): ActionDefinition[] {
  return state.masters.find((master) => master.id === card.masterId)?.actions ?? [];
}

export function matchingActions(
  state: GameState,
  accepted: CardInstance,
  received: CardInstance,
): ActionMatch[] {
  const onMatches = masterActions(state, accepted).flatMap((action) => {
    if (action.applicable.direction !== "on") return [];
    const result = evaluateCondition(action.applicable.selector, { state, self: accepted, other: received });
    return result.valid && result.value ? [{
      action, acceptedId: accepted.id, receivedId: received.id, selfId: accepted.id, otherId: received.id,
    }] : [];
  });
  const receiveMatches = masterActions(state, received).flatMap((action) => {
    if (action.applicable.direction !== "receive") return [];
    const result = evaluateCondition(action.applicable.selector, { state, self: received, other: accepted });
    return result.valid && result.value ? [{
      action, acceptedId: accepted.id, receivedId: received.id, selfId: received.id, otherId: accepted.id,
    }] : [];
  });
  return [...onMatches, ...receiveMatches];
}

function cardForRole(
  state: GameState,
  roles: Roles,
  role: ActionRole,
  activeIds: Set<string>,
): CardInstance | undefined {
  const cardId = role === "self" ? roles.selfId : roles.otherId;
  return cardId && activeIds.has(cardId) ? state.cards.find((card) => card.id === cardId) : undefined;
}

function resolveOperand(
  state: GameState,
  roles: Roles,
  operand: number | ValueOperand,
  activeIds: Set<string>,
): number | undefined {
  if (typeof operand === "number") return Number.isFinite(operand) ? operand : undefined;
  const card = cardForRole(state, roles, operand.target, activeIds);
  return card ? getValue(card, operand.value)?.value : undefined;
}

function planAction(
  state: GameState,
  action: ExecutableAction,
  roles: Roles,
  options: ActionExecutionOptions = {},
): { plan?: ActionPlan; reason?: ActionExecutionResult["reason"]; message?: string } {
  const activeIds = new Set(state.cards.map((card) => card.id));
  const effects: PlannedEffect[] = [];
  const random = options.random ?? Math.random;
  for (const effect of action.effects) {
    if (effect.kind === "spend-time") {
      const baseMinutes = resolveOperand(state, roles, effect.operand, activeIds);
      if (baseMinutes === undefined || baseMinutes < 0) {
        return { reason: "invalid", message: `Action "${action.id}" has an unresolved spend-time operand` };
      }
      const adjusted = options.adjustSpendTime?.(baseMinutes, state, roles, action);
      const minutes = adjusted === undefined ? baseMinutes : adjusted;
      if (minutes === null) return { reason: "too-dark", message: `Action "${action.id}" is blocked` };
      if (!Number.isFinite(minutes) || minutes < 0) {
        return { reason: "invalid", message: `Action "${action.id}" produced an invalid duration` };
      }
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
    if (effect.kind === "add-random-card") {
      const deck = roles.selfId ? deckOwnedByCard(state, roles.selfId) : undefined;
      if (!deck) return { reason: "invalid", message: `Action "${action.id}" requires one self-owned deck` };
      const masterIds = Array.from({ length: effect.count }, () =>
        effect.from[Math.min(effect.from.length - 1, Math.floor(random() * effect.from.length))]);
      effects.push({ kind: "add-random-card", deckId: deck.id, masterIds });
      continue;
    }
    const role = effect.target ?? "self";
    const card = cardForRole(state, roles, role, activeIds);
    if (!card) return { reason: "invalid", message: `Action "${action.id}" has an unresolved ${role} target` };
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
    const resolvedOperand = resolveOperand(state, roles, effect.operand, activeIds);
    if (!targetValue || resolvedOperand === undefined) {
      return { reason: "invalid", message: `Action "${action.id}" has an unresolved Value operand` };
    }
    effects.push({ kind: "value", cardId: card.id, value: effect.value, operator: effect.operator, operand: resolvedOperand });
  }
  return { plan: { action, effects } };
}

function applyValueEffect(state: GameState, effect: Extract<PlannedEffect, { kind: "value" }>): GameState | null {
  const card = state.cards.find((candidate) => candidate.id === effect.cardId);
  const current = card && getValue(card, effect.value);
  if (!card || !current) return null;
  const raw = effect.operator === "=" ? effect.operand
    : effect.operator === "+=" ? current.value + effect.operand : current.value - effect.operand;
  const value = clampValue(raw, current.min, current.max);
  return {
    ...state,
    cards: state.cards.map((candidate) => candidate.id === card.id ? {
      ...candidate,
      attributes: candidate.attributes.map((attribute) =>
        attribute.kind === "value" && attribute.id === effect.value ? { ...attribute, value } : attribute),
    } : candidate),
  };
}

function removeOwnedDeckTree(state: GameState, cardId: string): GameState {
  const deckIds = new Set<string>();
  const cardIds = [cardId];
  for (let index = 0; index < cardIds.length; index += 1) {
    for (const deck of state.decks ?? []) {
      if (deck.owner.kind === "card" && deck.owner.id === cardIds[index] && !deckIds.has(deck.id)) {
        deckIds.add(deck.id);
        cardIds.push(...deck.cards.map((card) => card.id));
      }
    }
  }
  return { ...state, decks: (state.decks ?? []).filter((deck) => !deckIds.has(deck.id)) };
}

function applyAddRandomCard(
  state: GameState,
  effect: Extract<PlannedEffect, { kind: "add-random-card" }>,
  random: () => number,
): GameState | null {
  const deck = state.decks?.find((candidate) => candidate.id === effect.deckId);
  if (!deck) return null;
  let serial = state.nextEntitySerial ?? 1;
  const nextId = (prefix: string) => `${prefix}-${serial++}`;
  const cards: DeckCardState[] = [];
  const nestedDecks: DeckState[] = [];
  for (const masterId of effect.masterIds) {
    const master = state.masters.find((candidate) => candidate.id === masterId);
    if (!master) return null;
    const card: DeckCardState = {
      id: nextId(`deck-card-${master.id}`),
      masterId: master.id,
      attributes: master.attributes.map((attribute) => ({ ...attribute })),
      references: { ...master.references },
    };
    cards.push(card);
    nestedDecks.push(...createOwnedDeckStates(
      state.masters, master.decks, { kind: "card", id: card.id }, nextId, random,
    ));
  }
  const withDeck = replaceDeck(state, deck.id, { ...deck, cards: [...deck.cards, ...cards] });
  return { ...withDeck, decks: [...(withDeck.decks ?? []), ...nestedDecks], nextEntitySerial: serial };
}

function applySimpleEffect(state: GameState, effect: PlannedEffect, random: () => number): GameState | null {
  if (effect.kind === "value") return applyValueEffect(state, effect);
  if (effect.kind === "add-random-card") return applyAddRandomCard(state, effect, random);
  if (effect.kind === "discard") {
    if (!state.cards.some((card) => card.id === effect.cardId)) return null;
    return removeOwnedDeckTree({ ...state, cards: state.cards.filter((card) => card.id !== effect.cardId) }, effect.cardId);
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

function applyProcessTick(state: GameState, options: ActionExecutionOptions): { state?: GameState; message?: string } {
  if (state.phase !== "main") return { state };
  let next = state;
  const ownerIds = state.cards.map((card) => card.id);
  for (const ownerId of ownerIds) {
    const owner = next.cards.find((card) => card.id === ownerId);
    if (!owner) continue;
    const master = next.masters.find((candidate) => candidate.id === owner.masterId);
    for (const [index, process] of (master?.processes ?? []).entries()) {
      const currentOwner = next.cards.find((card) => card.id === ownerId);
      if (!currentOwner) break;
      if (process.condition) {
        const result = evaluateCondition(process.condition, { state: next, self: currentOwner });
        if (!result.valid) return { message: result.reason ?? "A Process condition could not be evaluated" };
        if (!result.value) continue;
      }
      const planned = planAction(next, {
        id: `process-${master!.id}-${index}`,
        name: `${master!.title} Process`,
        effects: process.effects,
      }, { selfId: ownerId }, options);
      if (!planned.plan) return { message: planned.message ?? "A Process could not be resolved" };
      if (planned.plan.effects.some((effect) => effect.kind === "spend-time" || effect.kind === "set-room")) {
        return { message: "Processes cannot advance time or change Rooms" };
      }
      for (const effect of planned.plan.effects) {
        const applied = applySimpleEffect(next, effect, options.random ?? Math.random);
        if (!applied) return { message: "A Process effect could not be applied" };
        next = applied;
      }
    }
  }
  const dehydrated = next.cards.some((card) => getValue(card, "hydration")?.value === 0);
  return { state: dehydrated ? { ...next, gameOver: true } : next };
}

export function crossedQuarterHourTicks(oldMinutes: number, newMinutes: number): number {
  return Math.floor(newMinutes / 15) - Math.floor(oldMinutes / 15);
}

export function advanceWorldTime(
  state: GameState,
  minutes: number,
  options: ActionExecutionOptions = {},
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
    const tick = applyProcessTick(next, options);
    if (!tick.state) return { state, success: false, processTicks: 0, message: tick.message };
    next = tick.state;
    boundary += 15;
  }
  return { state: { ...next, elapsedMinutes: end }, success: true, processTicks };
}

function valueChanges(before: GameState, after: GameState, plan: ActionPlan): ValueChange[] {
  return plan.effects.flatMap((effect) => {
    if (effect.kind !== "value") return [];
    const beforeCard = before.cards.find((card) => card.id === effect.cardId);
    const afterCard = after.cards.find((card) => card.id === effect.cardId);
    const beforeValue = beforeCard && getValue(beforeCard, effect.value);
    const afterValue = afterCard && getValue(afterCard, effect.value);
    return beforeValue && afterValue ? [{
      cardId: effect.cardId, attribute: effect.value,
      before: beforeValue.value, after: afterValue.value,
    }] : [];
  });
}

function failure(original: GameState, message?: string): Omit<ActionExecutionResult, "match"> {
  return {
    state: original, success: false, reason: "invalid", message,
    valueChanges: [], discardedCardIds: [], minutes: 0, processTicks: 0,
  };
}

function runPlan(
  original: GameState,
  plan: ActionPlan,
  options: ActionExecutionOptions = {},
): Omit<ActionExecutionResult, "match"> {
  let next = original;
  let minutes = 0;
  let processTicks = 0;
  const discardedCardIds: string[] = [];
  const random = options.random ?? Math.random;
  for (const effect of plan.effects) {
    if (effect.kind === "spend-time") {
      const advanced = advanceWorldTime(next, effect.minutes, options);
      if (!advanced.success) return failure(original, advanced.message);
      next = advanced.state;
      minutes += effect.minutes;
      processTicks += advanced.processTicks;
      continue;
    }
    const applied = applySimpleEffect(next, effect, random);
    if (!applied) return failure(original, `Action "${plan.action.id}" could not complete`);
    if (effect.kind === "discard") discardedCardIds.push(effect.cardId);
    next = applied;
  }
  return {
    state: next, success: true,
    valueChanges: valueChanges(original, next, plan), discardedCardIds, minutes, processTicks,
  };
}

export function executeStandaloneAction(
  state: GameState,
  action: ExecutableAction,
  roles: Roles = {},
  options: ActionExecutionOptions = {},
): ActionExecutionResult {
  const planned = planAction(state, action, roles, options);
  if (!planned.plan) return { ...failure(state, planned.message), reason: planned.reason ?? "invalid" };
  return runPlan(state, planned.plan, options);
}

export function executeCardInteraction(
  state: GameState,
  accepted: CardInstance,
  received: CardInstance,
  options: ActionExecutionOptions = {},
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
  const roles = { selfId: match.selfId, otherId: match.otherId };
  const planned = planAction(state, match.action, roles, options);
  if (!planned.plan) return { ...failure(state, planned.message), reason: planned.reason ?? "invalid", match };
  return { ...runPlan(state, planned.plan, options), match };
}
