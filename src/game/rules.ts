import type {
  Bounds,
  CardAttribute,
  CardInstance,
  CardMaster,
  GameState,
  Position,
  ValueAttribute,
  Zone,
} from "../domain/types";
import { CARD_HEIGHT, CARD_WIDTH } from "./constants";

export interface ValueChangePreview {
  cardId: string;
  attribute: string;
  before: number;
  after: number;
}

export interface InteractionOutcome {
  sourceId: string;
  targetId: string;
  valueChanges: ValueChangePreview[];
  consumeSource: boolean;
}

export interface DragOrigin {
  zone: Zone;
  position: Position;
  roomId?: string;
  equipmentSlot?: CardInstance["equipmentSlot"];
}

export function displayAttributeName(name: string): string {
  return name.replaceAll("-", " ");
}

export function hasMarker(card: Pick<CardInstance | CardMaster, "attributes">, name: string): boolean {
  return card.attributes.some(
    (attribute) => attribute.kind === "marker" && attribute.name === name,
  );
}

export function isAnchored(card: Pick<CardInstance | CardMaster, "attributes">): boolean {
  return hasMarker(card, "Anchored");
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

export function clampValue(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function getValue(
  card: Pick<CardInstance, "attributes">,
  name: string,
): ValueAttribute | undefined {
  return card.attributes.find(
    (attribute): attribute is ValueAttribute =>
      attribute.kind === "value" && attribute.name === name,
  );
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

function masterFor(state: GameState, card: CardInstance): CardMaster | undefined {
  return state.masters.find((master) => master.id === card.masterId);
}

export function calculateInteractionOutcome(
  state: GameState,
  source: CardInstance,
  target: CardInstance,
): InteractionOutcome | null {
  const interaction = masterFor(state, source)?.interactions.find(
    (candidate) => candidate.targetTitle === target.title,
  );
  if (!interaction) return null;

  const valueChanges: ValueChangePreview[] = [];
  let consumeSource = false;
  for (const effect of interaction.effects) {
    if (effect.kind === "consume-source") {
      consumeSource = true;
      continue;
    }
    const value = getValue(target, effect.attribute);
    if (!value) return null;
    valueChanges.push({
      cardId: target.id,
      attribute: effect.attribute,
      before: value.value,
      after: clampValue(value.value + effect.amount, value.min, value.max),
    });
  }

  return { sourceId: source.id, targetId: target.id, valueChanges, consumeSource };
}

export function canInteract(
  state: GameState,
  source: CardInstance,
  target: CardInstance,
): boolean {
  return (
    calculateInteractionOutcome(state, source, target) !== null ||
    (source.masterId === "body" && Boolean(target.travel))
  );
}

function visibleAttributeIdentity(card: CardInstance): string[] {
  return card.attributes.map((attribute) =>
    attribute.kind === "marker"
      ? `marker:${attribute.name}`
      : `value:${attribute.name}:${attribute.value}`,
  ).sort();
}

export function canStackCards(source: CardInstance, target: CardInstance): boolean {
  if (source.id === target.id || source.masterId !== target.masterId) return false;
  if (target.zone !== "room" || !target.roomId) return false;
  if (source.zone === "room" && source.roomId !== target.roomId) return false;
  if (source.zone === "inventory" && isAnchored(source)) return false;
  const sourceAttributes = visibleAttributeIdentity(source);
  const targetAttributes = visibleAttributeIdentity(target);
  return sourceAttributes.length === targetAttributes.length &&
    sourceAttributes.every((attribute, index) => attribute === targetAttributes[index]);
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

function applyValueChanges(
  attributes: CardAttribute[],
  changes: ValueChangePreview[],
): CardAttribute[] {
  return attributes.map((attribute) => {
    if (attribute.kind !== "value") return attribute;
    const change = changes.find((candidate) => candidate.attribute === attribute.name);
    return change ? { ...attribute, value: change.after } : attribute;
  });
}

export function applyInteraction(
  state: GameState,
  sourceId: string,
  targetId: string,
): GameState {
  const source = state.cards.find((card) => card.id === sourceId);
  const target = state.cards.find((card) => card.id === targetId);
  if (!source || !target) return state;

  const outcome = calculateInteractionOutcome(state, source, target);
  if (!outcome) return state;

  const cards = state.cards
    .filter((card) => !(outcome.consumeSource && card.id === sourceId))
    .map((card) =>
      card.id === targetId
        ? { ...card, attributes: applyValueChanges(card.attributes, outcome.valueChanges) }
        : card,
    );
  return { ...state, cards };
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
