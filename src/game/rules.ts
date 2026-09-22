import type {
  Bounds,
  CardInstance,
  GameState,
  Position,
  Zone,
} from "../domain/types";
import { CARD_HEIGHT, CARD_WIDTH } from "./constants";
import { executeCardInteraction } from "./actions";
export { clampValue, getValue, hasMarker, isAnchored } from "./cardState";
import { isAnchored } from "./cardState";
import { effectiveVision, travelDuration } from "./vision";

export interface ValueChangePreview {
  cardId: string;
  attribute: string;
  before: number;
  after: number;
}

export interface InteractionOutcome {
  sourceId: string;
  targetId: string;
  actionId: string;
  actionName: string;
  valueChanges: ValueChangePreview[];
  discardedCardIds: string[];
  minutes: number;
  processTicks: number;
}

export interface DragOrigin {
  zone: Zone;
  position: Position;
  roomId?: string;
  equipmentSlot?: CardInstance["equipmentSlot"];
}

function interactionExecutionOptions() {
  return {
    adjustSpendTime: (
      baseMinutes: number,
      current: GameState,
      _roles: { selfId?: string; otherId?: string },
      action: { effects: { kind: string }[] },
    ) => action.effects.some((effect) => effect.kind === "set-room")
      ? travelDuration(baseMinutes, effectiveVision(current))
      : baseMinutes,
  };
}

export function isCardAvailableInPhase(state: GameState, card: CardInstance): boolean {
  return state.phase !== "opening" || !card.nadirState;
}

export function canCrossZoneBoundaryDuringDrag(_card: CardInstance): boolean {
  return true;
}

export function canRestInZone(
  card: CardInstance,
  zone: Zone,
): { legal: boolean; reason?: "anchored" } {
  return isAnchored(card) && card.homeZone !== zone
    ? { legal: false, reason: "anchored" }
    : { legal: true };
}

export function isWithinBounds(position: Position, bounds: Bounds): boolean {
  return (
    position.x >= bounds.x &&
    position.y >= bounds.y &&
    position.x + CARD_WIDTH <= bounds.x + bounds.width &&
    position.y + CARD_HEIGHT <= bounds.y + bounds.height
  );
}

export function rectanglesOverlap(
  first: Position,
  second: Position,
  gap = 0,
): boolean {
  return !(
    first.x + CARD_WIDTH + gap <= second.x ||
    second.x + CARD_WIDTH + gap <= first.x ||
    first.y + CARD_HEIGHT + gap <= second.y ||
    second.y + CARD_HEIGHT + gap <= first.y
  );
}

export function positionIsFree(
  cardId: string,
  zone: Zone,
  position: Position,
  cards: CardInstance[],
  roomId?: string,
): boolean {
  return cards.every(
    (other) =>
      other.id === cardId ||
      other.zone !== zone ||
      Boolean(other.equipmentSlot) ||
      (zone === "room" && other.roomId !== roomId) ||
      !rectanglesOverlap(position, other.position),
  );
}

export function calculateInteractionOutcome(
  state: GameState,
  source: CardInstance,
  target: CardInstance,
): InteractionOutcome | null {
  if (!isCardAvailableInPhase(state, source) || !isCardAvailableInPhase(state, target)) return null;
  const result = executeCardInteraction(state, source, target, interactionExecutionOptions());
  if (!result.success || !result.match) return null;
  return {
    sourceId: source.id,
    targetId: target.id,
    actionId: result.match.action.id,
    actionName: result.match.action.name,
    valueChanges: result.valueChanges,
    discardedCardIds: result.discardedCardIds,
    minutes: result.minutes,
    processTicks: result.processTicks,
  };
}

export function canInteract(
  state: GameState,
  source: CardInstance,
  target: CardInstance,
): boolean {
  if (!isCardAvailableInPhase(state, source) || !isCardAvailableInPhase(state, target)) return false;
  return calculateInteractionOutcome(state, source, target) !== null;
}

function markerIdentity(card: CardInstance): string[] {
  return card.attributes
    .filter((attribute) => attribute.kind === "marker")
    .map((attribute) => attribute.id)
    .sort();
}

export function canStackCards(source: CardInstance, target: CardInstance): boolean {
  if (source.id === target.id || source.masterId !== target.masterId) return false;
  if (source.zone !== "room" || target.zone !== "room" || !target.roomId) return false;
  if (source.roomId !== target.roomId) return false;
  if (source.attributes.some((attribute) => attribute.kind === "value") ||
      target.attributes.some((attribute) => attribute.kind === "value")) return false;
  const sourceMarkers = markerIdentity(source);
  const targetMarkers = markerIdentity(target);
  return sourceMarkers.length === targetMarkers.length &&
    sourceMarkers.every((attribute, index) => attribute === targetMarkers[index]);
}

export type CardTargetKind = "interaction" | "stack" | null;

export function cardTargetKind(
  state: GameState,
  source: CardInstance,
  target: CardInstance,
): CardTargetKind {
  if (canInteract(state, source, target)) return "interaction";
  return canStackCards(source, target) ? "stack" : null;
}

export function applyInteraction(
  state: GameState,
  sourceId: string,
  targetId: string,
): GameState {
  const source = state.cards.find((card) => card.id === sourceId);
  const target = state.cards.find((card) => card.id === targetId);
  if (!source || !target) return state;

  return executeCardInteraction(state, source, target, interactionExecutionOptions()).state;
}

export function stackCards(state: GameState, sourceId: string, targetId: string): GameState {
  const source = state.cards.find((card) => card.id === sourceId);
  const target = state.cards.find((card) => card.id === targetId);
  if (!source || !target || cardTargetKind(state, source, target) !== "stack") return state;

  const rootId = target.stackRootId ?? target.id;
  const root = state.cards.find((card) => card.id === rootId) ?? target;
  const memberCount = state.cards.filter(
    (card) => card.id === rootId || card.stackRootId === rootId,
  ).length;
  const offset = Math.min(memberCount * 6, 18);
  const stackedSource: CardInstance = {
    ...source,
    zone: "room",
    roomId: target.roomId,
    equipmentSlot: undefined,
    stackRootId: rootId,
    position: { x: root.position.x + offset, y: root.position.y + offset },
  };

  return {
    ...state,
    cards: [
      ...state.cards.filter((card) => card.id !== sourceId),
      stackedSource,
    ],
  };
}
