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
  transitionRoom,
} from "../src/game/world";
import { isCardAvailableInPhase, rectanglesOverlap } from "../src/game/rules";
import { CARD_HEIGHT, CARD_WIDTH } from "../src/game/constants";

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
