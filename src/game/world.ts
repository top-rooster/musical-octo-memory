import type {
  Bounds,
  CardAttribute,
  DeckState,
  CardInstance,
  CardMaster,
  EquipmentSlot,
  GameState,
  Position,
} from "../domain/types";
import type {
  CardInstanceDefinition,
  WorldDefinition,
} from "../data/worldDefinition";
import { CARD_GAP, CARD_HEIGHT, CARD_WIDTH, SEARCH_DECK_HEIGHT, SEARCH_DECK_WIDTH } from "./constants";
import { createOwnedDeckStates, decksOwnedBy, drawFromDeck, replaceDeck } from "./decks";
import { executeStandaloneAction } from "./actions";
import { allocateCarriedCapacity, canEquip, canTakeOpeningCard } from "./equipment";
import { generateRoomPlacements } from "./placement";
import { isAnchored } from "./cardState";
import { rectanglesOverlap } from "./rules";
import { effectiveVision, searchDuration } from "./vision";

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
  const decks: DeckState[] = [];
  const start = definition.rooms.find((room) => room.id === definition.startRoomId)!;

  const makeCard = (
    authored: CardInstanceDefinition,
    zone: "room" | "inventory",
    position: Position,
    options: Partial<CardInstance> = {},
  ): CardInstance => {
    const master = masterById(masters, authored.masterId);
    const card: CardInstance = {
      id: nextId(master.id),
      masterId: master.id,
      title: master.title,
      image: master.image,
      description: master.description,
      attributes: cloneAttributes(authored.attributes),
      references: { ...authored.references },
      zone,
      homeZone: isAnchored(master) ? zone : undefined,
      position: { ...position },
      ...options,
    };
    decks.push(...createOwnedDeckStates(
      masters, master.decks, { kind: "card", id: card.id }, nextId, random,
    ));
    return card;
  };

  start.nadir.forEach((authored, index) => {
    cards.push(makeCard(
      authored,
      "inventory",
      { x: 16 + index * (CARD_WIDTH + CARD_GAP), y: 0 },
      { nadirState: true },
    ));
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
    decks.push(...createOwnedDeckStates(
      masters,
      room.decks,
      { kind: "room", id: room.id },
      nextId,
      random,
      room.decks.map((_, index) => ({ x: 18 + index * (SEARCH_DECK_WIDTH + CARD_GAP), y: 66 })),
    ));
    return [room.id, {
      id: room.id,
      name: room.name,
      background: room.background,
      light: room.light,
      discovered: room.id === definition.startRoomId,
    }];
  }));

  return {
    masters,
    cards,
    phase: "opening",
    currentRoomId: definition.startRoomId,
    rooms,
    decks,
    elapsedMinutes: 0,
    nextEntitySerial: serial + 1,
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
  const roomDecks = decksOwnedBy(state, { kind: "room", id: roomId });
  const legal = (position: Position) =>
    positionWithin(position, bounds) &&
    roomCards.every((card) => !rectanglesOverlap(position, card.position, CARD_GAP)) &&
    roomDecks.every((deck) => deck.position && (
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
  processTicks?: number;
  reason?: "too-dark" | "no-deck" | "no-space" | "action-invalid";
}

export function searchRoom(state: GameState, deckId: string, bounds: Bounds): SearchResult {
  const roomId = state.currentRoomId;
  const room = roomId ? state.rooms?.[roomId] : undefined;
  const deck = (state.decks ?? []).find((candidate) =>
    candidate.id === deckId && candidate.owner.kind === "room" && candidate.owner.id === roomId);
  if (!roomId || !room || !deck || state.phase !== "main") return { state, reason: "no-deck" };
  if (!deck.position) return { state, reason: "no-deck" };
  const position = nearestFreeRoomPosition(state, roomId, deck.position, bounds);
  if (!position) return { state, reason: "no-space" };
  const result = drawFromDeck(deck);
  if (!result.drawn) return { state, reason: "no-deck" };
  const execution = executeStandaloneAction(state, {
    id: "search",
    name: "Search",
    effects: [{ kind: "spend-time", operand: deck.baseMinutes }],
  }, {}, {
    adjustSpendTime: (baseMinutes, current) => searchDuration(baseMinutes, effectiveVision(current)),
  });
  if (!execution.success) {
    return { state, reason: execution.reason === "too-dark" ? "too-dark" : "action-invalid" };
  }
  const master = masterById(state.masters, result.drawn.masterId);
  const drawnCard: CardInstance = {
    id: result.drawn.id,
    masterId: master.id,
    title: master.title,
    image: master.image,
    description: master.description,
    attributes: cloneAttributes(result.drawn.attributes),
    references: { ...result.drawn.references },
    zone: "room",
    homeZone: isAnchored(master) ? "room" : undefined,
    roomId,
    position,
    animation: "draw",
    drawOrigin: { ...deck.position },
  };
  const withDeck = replaceDeck(execution.state, deckId, result.deck);
  return {
    state: {
      ...withDeck,
      cards: [...withDeck.cards, drawnCard],
    },
    drawnCardId: drawnCard.id,
    minutes: execution.minutes,
    processTicks: execution.processTicks,
  };
}

export function equipCard(state: GameState, cardId: string, slot: EquipmentSlot): GameState {
  const card = state.cards.find((candidate) => candidate.id === cardId);
  if (!card || !canEquip(card, slot) || !canTakeOpeningCard(state, card)) return state;
  if (state.cards.some((candidate) => candidate.id !== cardId && candidate.equipmentSlot === slot)) return state;
  return {
    ...state,
    cards: state.cards.map((candidate) => candidate.id === cardId
      ? { ...candidate, zone: "inventory", roomId: undefined, equipmentSlot: slot, stackRootId: undefined }
      : candidate),
  };
}

function reflowFlatInventory(cards: CardInstance[], bounds: Bounds): CardInstance[] {
  const flat = cards.filter((card) => card.zone === "inventory" && !card.equipmentSlot);
  const columns = Math.max(1, Math.floor(bounds.width / CARD_WIDTH));
  const rows = Math.ceil(flat.length / columns);
  if (rows * CARD_HEIGHT > bounds.height) return cards;
  const usedColumns = Math.min(columns, flat.length);
  const horizontalGap = usedColumns > 1
    ? Math.min(CARD_GAP, (bounds.width - usedColumns * CARD_WIDTH) / (usedColumns - 1))
    : 0;
  const verticalGap = rows > 1
    ? Math.min(CARD_GAP, (bounds.height - rows * CARD_HEIGHT) / (rows - 1))
    : 0;
  const positions = new Map(flat.map((card, index) => [card.id, {
    x: (index % columns) * (CARD_WIDTH + horizontalGap),
    y: Math.floor(index / columns) * (CARD_HEIGHT + verticalGap),
  }]));
  return cards.map((card) => positions.has(card.id)
    ? { ...card, position: positions.get(card.id)! }
    : card);
}

export function escapeOpening(
  state: GameState,
  carriedBounds?: Bounds,
): { state: GameState; reason?: "capacity" } {
  if (state.phase !== "opening" || !state.openingEscapeRoomId) return { state };
  const mainAllocation = allocateCarriedCapacity(state.cards);
  if (mainAllocation.unplacedIds.length) return { state, reason: "capacity" };
  const destination = state.rooms?.[state.openingEscapeRoomId];
  if (!destination) return { state };
  return {
    state: {
      ...state,
      cards: carriedBounds ? reflowFlatInventory(state.cards, carriedBounds) : state.cards,
      phase: "main",
      currentRoomId: destination.id,
      rooms: { ...state.rooms, [destination.id]: { ...destination, discovered: true } },
    },
  };
}
