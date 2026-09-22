import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { GameState } from "../src/domain/types";
import { drawFromDeck } from "../src/game/decks";
import {
  createWorldGameState,
  equipCard,
  escapeOpening,
  searchRoom,
} from "../src/game/world";
import { applyInteraction, getValue, hasMarker, isCardAvailableInPhase, rectanglesOverlap } from "../src/game/rules";
import { CARD_HEIGHT, CARD_WIDTH } from "../src/game/constants";

function seeded(seed = 52) {
  return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000);
}
const bounds = { x: 0, y: 0, width: 1400, height: 800 };

function searchUntil(state: GameState, masterId: string): GameState {
  let current = state;
  while (!current.cards.some((card) => card.roomId === current.currentRoomId && card.masterId === masterId)) {
    const deck = current.decks!.find((candidate) =>
      candidate.owner.kind === "room" && candidate.owner.id === current.currentRoomId)!;
    const result = searchRoom(current, deck.id, bounds);
    if (result.reason) throw new Error(`Could not discover ${masterId}: ${result.reason}`);
    current = result.state;
  }
  return current;
}

function travelWith(state: GameState, routeMasterId: string): GameState {
  const body = state.cards.find((card) => card.masterId === "body")!;
  const route = state.cards.find((card) => card.masterId === routeMasterId)!;
  return applyInteraction(state, body.id, route.id);
}

describe("persistent world and Search decks", () => {
  let state: GameState;
  beforeEach(() => {
    state = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    state = escapeOpening(state).state;
  });

  it("keeps Nadir state hidden and unavailable during Opening, then activates it after Escape", () => {
    let opening = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    const nadir = opening.cards.filter((card) => card.nadirState);
    const body = nadir.find((card) => card.masterId === "body")!;
    const food = opening.cards.find((card) => card.masterId === "canned-food")!;

    expect(nadir.map((card) => card.masterId)).toEqual(["body", "mind", "spirit"]);
    expect(nadir.every((card) => !isCardAvailableInPhase(opening, card))).toBe(true);
    expect(isCardAvailableInPhase(opening, food)).toBe(true);

    opening = equipCard(opening, food.id, "left-hand");
    const main = escapeOpening(opening).state;
    expect(nadir.map((card) => main.cards.find((candidate) => candidate.id === card.id)!)
      .every((card) => isCardAvailableInPhase(main, card))).toBe(true);
    expect(main.cards.find((card) => card.id === body.id)).toBeDefined();
  });

  it("reflows newly visible Nadir state around carried cards on Escape", () => {
    let opening = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    const pocketKnife = opening.cards.find((card) => card.masterId === "pocket-knife")!;
    opening = {
      ...opening,
      cards: opening.cards.map((card) => card.id === pocketKnife.id
        ? { ...card, zone: "inventory", roomId: undefined, position: { x: 276, y: 0 } }
        : card),
    };
    const main = escapeOpening(opening, { x: 0, y: 0, width: 519, height: 392 }).state;
    const flat = main.cards.filter((card) => card.zone === "inventory" && !card.equipmentSlot);
    for (const [index, card] of flat.entries()) {
      expect(card.position.x).toBeGreaterThanOrEqual(0);
      expect(card.position.y).toBeGreaterThanOrEqual(0);
      expect(card.position.x + CARD_WIDTH).toBeLessThanOrEqual(519);
      expect(card.position.y + CARD_HEIGHT).toBeLessThanOrEqual(392);
      expect(flat.slice(index + 1).every((other) =>
        !rectanglesOverlap(card.position, other.position))).toBe(true);
    }
  });

  it("shuffles every deck once into deterministic fixed order with controlled RNG", () => {
    const first = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    const second = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    expect(first.decks!.map((deck) => deck.cards.map((card) => card.masterId)))
      .toEqual(second.decks!.map((deck) => deck.cards.map((card) => card.masterId)));
  });

  it("depletes a deck by exactly one and represents exhaustion as removal", () => {
    const deck = state.decks!.find((candidate) => candidate.owner.kind === "room" && candidate.owner.id === "tunnels")!;
    const first = drawFromDeck(deck);
    expect(first.deck!.cards).toHaveLength(deck.cards.length - 1);
    let current = state;
    for (let index = 0; index < deck.cards.length; index += 1) {
      const currentDeck = current.decks!.find((candidate) =>
        candidate.owner.kind === "room" && candidate.owner.id === "tunnels")!;
      const result = searchRoom(current, currentDeck.id, bounds);
      if (result.reason) throw new Error(`Search ${index} failed: ${result.reason}`);
      current = result.state;
    }
    expect(current.decks!.filter((candidate) => candidate.owner.kind === "room" && candidate.owner.id === "tunnels"))
      .toHaveLength(0);
  });

  it("discovers navigation cards by drawing them from the Tunnels deck", () => {
    expect(state.cards.some((card) => card.roomId === "tunnels" && hasMarker(card, "path"))).toBe(false);
    let current = state;
    while (!current.cards.some((card) => card.roomId === "tunnels" && hasMarker(card, "path"))) {
      const deck = current.decks!.find((candidate) =>
        candidate.owner.kind === "room" && candidate.owner.id === "tunnels")!;
      current = searchRoom(current, deck.id, bounds).state;
    }
    expect(current.cards.some((card) => card.roomId === "tunnels" && hasMarker(card, "path"))).toBe(true);
  });

  it("runs Search through centralized time and resolves its tick before one draw", () => {
    const beforeCount = state.cards.length;
    const deck = state.decks!.find((candidate) => candidate.owner.kind === "room" && candidate.owner.id === "tunnels")!;
    const result = searchRoom(state, deck.id, bounds);
    expect(result.reason).toBeUndefined();
    expect(result.minutes).toBe(15);
    expect(result.processTicks).toBe(1);
    expect(result.state.elapsedMinutes).toBe(15);
    expect(result.state.cards).toHaveLength(beforeCount + 1);
    expect(getValue(result.state.cards.find((card) => card.masterId === "body")!, "hydration")?.value).toBe(48);
    expect(getValue(result.state.cards.find((card) => card.masterId === "body")!, "satiation")?.value).toBe(49);
  });

  it("applies the Vision multiplier before Search spends time", () => {
    state = { ...state, currentRoomId: "deep-tunnels" };
    const deck = state.decks!.find((candidate) =>
      candidate.owner.kind === "room" && candidate.owner.id === "deep-tunnels")!;
    const result = searchRoom(state, deck.id, bounds);
    expect(result.minutes).toBe(45);
    expect(result.state.elapsedMinutes).toBe(45);
    expect(getValue(result.state.cards.find((card) => card.masterId === "body")!, "hydration")?.value).toBe(44);
  });

  it("preserves exact inactive-room card state across transitions", () => {
    const searched = searchUntil(state, "go-abandoned-office");
    const card = searched.cards.find((item) => item.roomId === "tunnels")!;
    const moved = {
      ...searched,
      cards: searched.cards.map((item) => item.id === card.id
        ? { ...item, position: { x: 777.25, y: 222.75 } }
        : item),
    };
    const away = travelWith(moved, "go-abandoned-office");
    const back = travelWith(away, "go-tunnels-from-office");
    expect(back.cards.find((item) => item.id === card.id)?.position)
      .toEqual({ x: 777.25, y: 222.75 });
  });

  it("transitions rooms, marks discovery, and advances central elapsed time", () => {
    state = searchUntil(state, "go-deep-tunnels");
    const beforeTravel = state.elapsedMinutes!;
    const next = travelWith(state, "go-deep-tunnels");
    expect(next.currentRoomId).toBe("deep-tunnels");
    expect(next.rooms!["deep-tunnels"].discovered).toBe(true);
    expect(next.elapsedMinutes! - beforeTravel).toBe(30);
    const hydrationAfterOutbound = getValue(findBody(next), "hydration")!.value;
    expect(hydrationAfterOutbound).toBe(getValue(findBody(state), "hydration")!.value - 4);
    const returning = travelWith(next, "go-tunnels-from-deep-tunnels");
    expect(returning.elapsedMinutes! - next.elapsedMinutes!).toBe(60);
    expect(getValue(findBody(returning), "hydration")!.value).toBe(hydrationAfterOutbound - 8);
  });
});

function findBody(state: GameState) {
  return state.cards.find((card) => card.masterId === "body")!;
}
