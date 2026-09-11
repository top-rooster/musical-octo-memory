import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { GameState } from "../src/domain/types";
import { drawFromDeck } from "../src/game/decks";
import {
  createWorldGameState,
  escapeOpening,
  searchRoom,
  transitionRoom,
} from "../src/game/world";

function seeded(seed = 52) {
  return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000);
}
const bounds = { x: 0, y: 0, width: 1400, height: 800 };

describe("persistent world and Search decks", () => {
  let state: GameState;
  beforeEach(() => {
    state = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    state = escapeOpening(state).state;
  });

  it("shuffles every deck once into deterministic fixed order with controlled RNG", () => {
    const first = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    const second = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, seeded());
    expect(Object.values(first.rooms!).map((room) => room.decks.map((deck) => deck.cards.map((card) => card.masterId))))
      .toEqual(Object.values(second.rooms!).map((room) => room.decks.map((deck) => deck.cards.map((card) => card.masterId))));
  });

  it("depletes a deck by exactly one and represents exhaustion as removal", () => {
    const deck = state.rooms!.tunnels.decks[0];
    const first = drawFromDeck(deck);
    expect(first.deck!.cards).toHaveLength(deck.cards.length - 1);
    let current = state;
    for (let index = 0; index < deck.cards.length; index += 1) {
      const result = searchRoom(current, current.rooms!.tunnels.decks[0].id, bounds);
      if (result.reason) throw new Error(`Search ${index} failed: ${result.reason}`);
      current = result.state;
    }
    expect(current.rooms!.tunnels.decks).toHaveLength(0);
  });

  it("discovers navigation cards by drawing them from the Tunnels deck", () => {
    expect(state.cards.some((card) => card.roomId === "tunnels" && card.travel)).toBe(false);
    let current = state;
    while (!current.cards.some((card) => card.roomId === "tunnels" && card.travel)) {
      current = searchRoom(current, current.rooms!.tunnels.decks[0].id, bounds).state;
    }
    expect(current.cards.some((card) => card.roomId === "tunnels" && card.travel)).toBe(true);
  });

  it("preserves exact inactive-room card state across transitions", () => {
    const searched = searchRoom(state, state.rooms!.tunnels.decks[0].id, bounds).state;
    const card = searched.cards.find((item) => item.roomId === "tunnels")!;
    const moved = {
      ...searched,
      cards: searched.cards.map((item) => item.id === card.id
        ? { ...item, position: { x: 777.25, y: 222.75 } }
        : item),
    };
    const away = transitionRoom(moved, "abandoned-office", 15);
    const back = transitionRoom(away, "tunnels", 15);
    expect(back.cards.find((item) => item.id === card.id)?.position)
      .toEqual({ x: 777.25, y: 222.75 });
  });

  it("transitions rooms, marks discovery, and advances central elapsed time", () => {
    const next = transitionRoom(state, "deep-tunnels", 30);
    expect(next.currentRoomId).toBe("deep-tunnels");
    expect(next.rooms!["deep-tunnels"].discovered).toBe(true);
    expect(next.elapsedMinutes).toBe(30);
    const returning = transitionRoom(next, "tunnels", 30);
    expect(returning.elapsedMinutes).toBe(90);
  });
});
