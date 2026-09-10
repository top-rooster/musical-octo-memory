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
import { CARD_HEIGHT, CARD_WIDTH, INVENTORY_CAPACITY } from "./constants";

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
}

export type DropIntent =
  | { kind: "card"; targetId: string }
  | { kind: "zone"; zone: Zone; position: Position; bounds: Bounds }
  | { kind: "outside" };

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

export function countInventoryCards(cards: CardInstance[], excludingId?: string): number {
  return cards.filter(
    (card) =>
      card.id !== excludingId && card.zone === "inventory" && !isAnchored(card),
  ).length;
}

export function canPlaceInZone(
  card: CardInstance,
  zone: Zone,
  cards: CardInstance[],
): { legal: boolean; reason?: "anchored" | "capacity" } {
  if (isAnchored(card) && card.homeZone !== zone) {
    return { legal: false, reason: "anchored" };
  }
  if (
    zone === "inventory" &&
    !isAnchored(card) &&
    countInventoryCards(cards, card.id) >= INVENTORY_CAPACITY
  ) {
    return { legal: false, reason: "capacity" };
  }
  return { legal: true };
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
): boolean {
  return cards.every(
    (other) =>
      other.id === cardId ||
      other.zone !== zone ||
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
  return calculateInteractionOutcome(state, source, target) !== null;
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

function restoreOrigin(state: GameState, cardId: string, origin: DragOrigin): GameState {
  const card = state.cards.find((candidate) => candidate.id === cardId);
  if (
    !card ||
    (card.zone === origin.zone &&
      card.position.x === origin.position.x &&
      card.position.y === origin.position.y)
  ) {
    return state;
  }
  return {
    ...state,
    cards: state.cards.map((candidate) =>
      candidate.id === cardId
        ? { ...candidate, zone: origin.zone, position: { ...origin.position } }
        : candidate,
    ),
  };
}

export function resolveDrop(
  state: GameState,
  sourceId: string,
  origin: DragOrigin,
  intent: DropIntent,
): GameState {
  const restored = restoreOrigin(state, sourceId, origin);
  const source = restored.cards.find((card) => card.id === sourceId);
  if (!source) return restored;

  if (intent.kind === "card") {
    return applyInteraction(restored, sourceId, intent.targetId);
  }
  if (intent.kind === "outside") return restored;

  if (
    !canPlaceInZone(source, intent.zone, restored.cards).legal ||
    !isWithinBounds(intent.position, intent.bounds) ||
    !positionIsFree(sourceId, intent.zone, intent.position, restored.cards)
  ) {
    return restored;
  }

  return {
    ...restored,
    cards: restored.cards.map((card) =>
      card.id === sourceId
        ? { ...card, zone: intent.zone, position: { ...intent.position } }
        : card,
    ),
  };
}
