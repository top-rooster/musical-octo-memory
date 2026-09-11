import type {
  Bounds,
  CardAttribute,
  CardInstance,
  CardMaster,
  EquipmentSlot,
  GameState,
  Position,
  SearchDeckState,
} from "../domain/types";
import type {
  CardInstanceDefinition,
  WorldDefinition,
} from "../data/roomParser";
import { CARD_GAP, CARD_HEIGHT, CARD_WIDTH, SEARCH_DECK_HEIGHT, SEARCH_DECK_WIDTH } from "./constants";
import { drawFromDeck, shuffleOnce } from "./decks";
import { allocateCarriedCapacity, canEquip, canTakeOpeningCard } from "./equipment";
import { generateRoomPlacements } from "./placement";
import { isAnchored, rectanglesOverlap } from "./rules";
import { effectiveVision, searchDuration, travelDuration } from "./vision";

function cloneAttributes(attributes: CardAttribute[]): CardAttribute[] {
  return attributes.map((attribute) => ({ ...attribute }));
}
function masterById(masters: CardMaster[], id: string): CardMaster {
  const master = masters.find((candidate) => candidate.id === id);
  if (!master) throw new Error(`Missing card master "${id}"`);
  return master;
}

export function createWorldGameState(
  masters: CardMaster[],
  definition: WorldDefinition,
  roomBounds: Bounds,
  random: () => number = Math.random,
): GameState {
  let serial = 0;
  const nextId = (prefix: string) => `${prefix}-${++serial}`;
  const cards: CardInstance[] = [];
  const start = definition.rooms.find((room) => room.id === definition.startRoomId)!;

  const makeCard = (
    authored: CardInstanceDefinition,
    zone: "room" | "inventory",
    position: Position,
    options: Partial<CardInstance> = {},
  ): CardInstance => {
    const master = masterById(masters, authored.masterId);
    return {
      id: nextId(master.id),
      masterId: master.id,
      title: master.title,
      image: master.image,
      description: master.description,
      attributes: cloneAttributes(authored.attributes),
      zone,
      homeZone: isAnchored(master) ? zone : undefined,
      position: { ...position },
      travel: authored.travel,
      ...options,
    };
  };

  start.nadir.forEach((authored, index) => {
    cards.push(makeCard(authored, "inventory", { x: 16 + index * (CARD_WIDTH + CARD_GAP), y: 0 }));
  });
  start.equipped.forEach((authored) => {
    cards.push(makeCard(authored, "inventory", { x: 0, y: 0 }, { equipmentSlot: authored.slot }));
  });

  for (const room of definition.rooms) {
    const authoredCards = [
      ...room.cards.map((card) => ({ card, offered: false })),
      ...room.offered.map((card) => ({ card, offered: true })),
    ];
    const deckReserve = room.decks.length ? SEARCH_DECK_WIDTH + CARD_GAP : 0;
    const inset = {
      x: roomBounds.x + 18 + deckReserve,
      y: roomBounds.y + 52,
      width: roomBounds.width - 36 - deckReserve,
      height: roomBounds.height - 64,
    };
    const placements = authoredCards.length
      ? generateRoomPlacements(
          authoredCards.map(({ card }) => masterById(masters, card.masterId)),
          inset,
          random,
        )
      : [];
    authoredCards.forEach(({ card, offered }, index) => {
      cards.push(makeCard(card, "room", placements[index].position, {
        roomId: room.id,
        offered,
      }));
    });
  }

  const rooms = Object.fromEntries(definition.rooms.map((room) => {
    const decks: SearchDeckState[] = room.decks.map((deck, index) => ({
      id: nextId(`deck-${room.id}`),
      name: deck.name,
      baseMinutes: deck.baseMinutes,
      position: { x: 18 + index * (SEARCH_DECK_WIDTH + CARD_GAP), y: 66 },
      cards: shuffleOnce(deck.cards.map((card) => ({
        id: nextId(`deck-card-${card.masterId}`),
        masterId: card.masterId,
        attributes: cloneAttributes(card.attributes),
        travel: card.travel,
      })), random),
    }));
    return [room.id, {
      id: room.id,
      name: room.name,
      background: room.background,
      light: room.light,
      discovered: room.id === definition.startRoomId,
      decks,
    }];
  }));

  return {
    masters,
    cards,
    phase: "opening",
    currentRoomId: definition.startRoomId,
    rooms,
    elapsedMinutes: 0,
    openingTakeLimit: start.takeLimit,
    openingEscapeRoomId: start.escapeRoomId,
    searchBack: definition.searchBack,
  };
}

function positionWithin(position: Position, bounds: Bounds): boolean {
  return position.x >= bounds.x && position.y >= bounds.y &&
    position.x + CARD_WIDTH <= bounds.x + bounds.width &&
    position.y + CARD_HEIGHT <= bounds.y + bounds.height;
}

export function nearestFreeRoomPosition(
  state: GameState,
  roomId: string,
  origin: Position,
  bounds: Bounds,
): Position | null {
  const roomCards = state.cards.filter((card) => card.zone === "room" && card.roomId === roomId);
  const roomDecks = state.rooms?.[roomId]?.decks ?? [];
  const legal = (position: Position) =>
    positionWithin(position, bounds) &&
    roomCards.every((card) => !rectanglesOverlap(position, card.position, CARD_GAP)) &&
    roomDecks.every((deck) => (
      position.x + CARD_WIDTH + CARD_GAP <= deck.position.x ||
      deck.position.x + SEARCH_DECK_WIDTH + CARD_GAP <= position.x ||
      position.y + CARD_HEIGHT + CARD_GAP <= deck.position.y ||
      deck.position.y + SEARCH_DECK_HEIGHT + CARD_GAP <= position.y
    ));
  const immediate = [
    { x: origin.x + SEARCH_DECK_WIDTH + CARD_GAP, y: origin.y },
    { x: origin.x, y: origin.y + SEARCH_DECK_HEIGHT + CARD_GAP },
    { x: origin.x - CARD_WIDTH - CARD_GAP, y: origin.y },
  ];
  for (const candidate of immediate) if (legal(candidate)) return candidate;
  const candidates: Position[] = [];
  for (let y = bounds.y; y + CARD_HEIGHT <= bounds.y + bounds.height; y += 12) {
    for (let x = bounds.x; x + CARD_WIDTH <= bounds.x + bounds.width; x += 12) {
      candidates.push({ x, y });
    }
  }
  candidates.sort((a, b) =>
    Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y),
  );
  return candidates.find(legal) ?? null;
}

export interface SearchResult {
  state: GameState;
  drawnCardId?: string;
  minutes?: number;
  reason?: "too-dark" | "no-deck" | "no-space";
}

export function searchRoom(state: GameState, deckId: string, bounds: Bounds): SearchResult {
  const roomId = state.currentRoomId;
  const room = roomId ? state.rooms?.[roomId] : undefined;
  const deck = room?.decks.find((candidate) => candidate.id === deckId);
  if (!roomId || !room || !deck || state.phase !== "main") return { state, reason: "no-deck" };
  const minutes = searchDuration(deck.baseMinutes, effectiveVision(state, roomId));
  if (minutes === null) return { state, reason: "too-dark" };
  const position = nearestFreeRoomPosition(state, roomId, deck.position, bounds);
  if (!position) return { state, reason: "no-space" };
  const result = drawFromDeck(deck);
  if (!result.drawn) return { state, reason: "no-deck" };
  const master = masterById(state.masters, result.drawn.masterId);
  const drawnCard: CardInstance = {
    id: result.drawn.id,
    masterId: master.id,
    title: master.title,
    image: master.image,
    description: master.description,
    attributes: cloneAttributes(result.drawn.attributes),
    zone: "room",
    homeZone: isAnchored(master) ? "room" : undefined,
    roomId,
    position,
    travel: result.drawn.travel,
    animation: "draw",
    drawOrigin: { ...deck.position },
  };
  const decks = room.decks
    .map((candidate) => candidate.id === deckId ? result.deck : candidate)
    .filter((candidate): candidate is SearchDeckState => Boolean(candidate));
  return {
    state: {
      ...state,
      elapsedMinutes: (state.elapsedMinutes ?? 0) + minutes,
      cards: [...state.cards, drawnCard],
      rooms: { ...state.rooms, [roomId]: { ...room, decks } },
    },
    drawnCardId: drawnCard.id,
    minutes,
  };
}

export function transitionRoom(state: GameState, destinationRoomId: string, baseMinutes: number): GameState {
  const destination = state.rooms?.[destinationRoomId];
  if (!destination) return state;
  const minutes = travelDuration(baseMinutes, effectiveVision(state));
  return {
    ...state,
    currentRoomId: destinationRoomId,
    elapsedMinutes: (state.elapsedMinutes ?? 0) + minutes,
    rooms: {
      ...state.rooms,
      [destinationRoomId]: { ...destination, discovered: true },
    },
  };
}

export function canTravelWith(source: CardInstance, target: CardInstance): boolean {
  return source.masterId === "body" && Boolean(target.travel);
}

export function equipCard(state: GameState, cardId: string, slot: EquipmentSlot): GameState {
  const card = state.cards.find((candidate) => candidate.id === cardId);
  const master = card && state.masters.find((candidate) => candidate.id === card.masterId);
  if (!card || !master || !canEquip(master, slot) || !canTakeOpeningCard(state, card)) return state;
  if (state.cards.some((candidate) => candidate.id !== cardId && candidate.equipmentSlot === slot)) return state;
  return {
    ...state,
    cards: state.cards.map((candidate) => candidate.id === cardId
      ? { ...candidate, zone: "inventory", roomId: undefined, equipmentSlot: slot }
      : candidate),
  };
}

export function escapeOpening(state: GameState): { state: GameState; reason?: "capacity" } {
  if (state.phase !== "opening" || !state.openingEscapeRoomId) return { state };
  const mainAllocation = allocateCarriedCapacity(state.cards, state.masters, "main");
  if (mainAllocation.unplacedIds.length) return { state, reason: "capacity" };
  const destination = state.rooms?.[state.openingEscapeRoomId];
  if (!destination) return { state };
  return {
    state: {
      ...state,
      phase: "main",
      currentRoomId: destination.id,
      rooms: { ...state.rooms, [destination.id]: { ...destination, discovered: true } },
    },
  };
}
