import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { CardInstance, GameState } from "../src/domain/types";
import { effectiveVision, LIGHT_MODIFIERS, searchDuration, travelDuration } from "../src/game/vision";
import { createWorldGameState, equipCard } from "../src/game/world";

function find(state: GameState, masterId: string): CardInstance {
  const card = state.cards.find((item) => item.masterId === masterId);
  if (!card) throw new Error(`Missing ${masterId}`);
  return card;
}

describe("Vision and lighting", () => {
  let state: GameState;
  beforeEach(() => {
    state = createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, { x: 0, y: 0, width: 1400, height: 800 }, () => .5,
    );
  });

  it("applies every authored room-light modifier", () => {
    expect(LIGHT_MODIFIERS).toEqual({ Bright: 0, Dim: -1, Twilight: -3, Darkness: -4 });
    expect(effectiveVision({ ...state, currentRoomId: "opening-room" })).toBe(4);
    expect(effectiveVision({ ...state, currentRoomId: "tunnels" })).toBe(3);
    expect(effectiveVision({ ...state, currentRoomId: "deep-tunnels" })).toBe(1);
  });

  it("adds Vision only while Glasses are equipped in Eyes", () => {
    const glasses = find(state, "glasses");
    state = { ...state, cards: state.cards.map((card) => card.id === glasses.id
      ? { ...card, zone: "inventory" as const, roomId: undefined }
      : card) };
    expect(effectiveVision(state)).toBe(4);
    state = equipCard(state, glasses.id, "left-hand");
    expect(effectiveVision(state)).toBe(4);
    state = { ...state, cards: state.cards.map((card) => card.id === glasses.id
      ? { ...card, equipmentSlot: undefined }
      : card) };
    state = equipCard(state, glasses.id, "eyes");
    expect(effectiveVision(state)).toBe(5);
  });

  it("activates a powered hand-held Flashlight but not a carried one", () => {
    const flashlight = find(state, "flashlight");
    state = { ...state, cards: state.cards.map((card) => card.id === flashlight.id
      ? { ...card, zone: "inventory" as const, roomId: undefined }
      : card) };
    expect(effectiveVision(state)).toBe(4);
    state = equipCard(state, flashlight.id, "left-hand");
    expect(effectiveVision(state)).toBe(5);
    state = { ...state, cards: state.cards.map((card) => card.id === flashlight.id
      ? { ...card, attributes: card.attributes.map((attribute) =>
          attribute.kind === "value" && attribute.id === "battery"
            ? { ...attribute, value: 0 } : attribute) }
      : card) };
    expect(effectiveVision(state)).toBe(4);
  });

  it("uses the decided Search and travel multipliers", () => {
    expect(searchDuration(15, 0)).toBeNull();
    expect(searchDuration(15, 1)).toBe(45);
    expect(searchDuration(15, 2)).toBe(30);
    expect(searchDuration(15, 3)).toBe(15);
    expect(travelDuration(15, 0)).toBe(45);
    expect(travelDuration(15, 1)).toBe(30);
    expect(travelDuration(15, 2)).toBe(15);
  });
});
