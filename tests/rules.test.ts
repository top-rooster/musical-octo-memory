import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { CardInstance, GameState } from "../src/domain/types";
import { createInitialGameState } from "../src/game/initialState";
import {
  applyInteraction,
  calculateInteractionOutcome,
  canCrossZoneBoundaryDuringDrag,
  canInteract,
  canRestInZone,
  canStackCards,
  cardTargetKind,
  getValue,
  hasMarker,
  stackCards,
} from "../src/game/rules";

function seededRandom(seed = 123456): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
}

function card(state: GameState, masterId: string): CardInstance {
  const found = state.cards.find((candidate) => candidate.masterId === masterId);
  if (!found) throw new Error(`Test card not found: ${masterId}`);
  return found;
}

describe("Milestone 1 rules", () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialGameState(
      CARD_MASTERS,
      WORLD_DEFINITION.rooms.find((room) => room.id === WORLD_DEFINITION.startRoomId)!.nadir.map((card) => card.masterId),
      { x: 0, y: 0, width: 1400, height: 800 },
      { x: 0, y: 0, width: 900, height: 320 },
      seededRandom(),
    );
  });

  it("allows both authored foods, but not Rat Skin, to interact with Body", () => {
    const body = card(state, "body");
    expect(canInteract(state, card(state, "rat-meat"), body)).toBe(true);
    expect(canInteract(state, card(state, "canned-food"), body)).toBe(true);
    expect(canInteract(state, card(state, "rat-skin"), body)).toBe(false);
  });

  it("applies Rat Meat Satiation +15 and consumes the source", () => {
    const body = card(state, "body");
    const ratMeat = card(state, "rat-meat");
    const next = applyInteraction(state, ratMeat.id, body.id);
    expect(getValue(card(next, "body"), "satiation")?.value).toBe(65);
    expect(next.cards.some((candidate) => candidate.id === ratMeat.id)).toBe(false);
  });

  it("applies Canned Food Satiation +25", () => {
    const body = card(state, "body");
    const cannedFood = card(state, "canned-food");
    const next = applyInteraction(state, cannedFood.id, body.id);
    expect(getValue(card(next, "body"), "satiation")?.value).toBe(75);
  });

  it("clamps preview and committed Satiation at 100 using the same outcome", () => {
    state = {
      ...state,
      cards: state.cards.map((candidate) =>
        candidate.masterId === "body"
          ? {
              ...candidate,
              attributes: candidate.attributes.map((attribute) =>
                attribute.kind === "value" && attribute.id === "satiation"
                  ? { ...attribute, value: 90 }
                  : attribute,
              ),
            }
          : candidate,
      ),
    };
    const body = card(state, "body");
    const cannedFood = card(state, "canned-food");
    expect(calculateInteractionOutcome(state, cannedFood, body)?.valueChanges[0]).toMatchObject({
      before: 90,
      after: 100,
    });
    const next = applyInteraction(state, cannedFood.id, body.id);
    expect(getValue(card(next, "body"), "satiation")?.value).toBe(100);
  });

  it("leaves state unchanged for an invalid interaction", () => {
    const next = applyInteraction(state, card(state, "rat-skin").id, card(state, "body").id);
    expect(next).toBe(state);
  });

  it("restores an invalid card-on-card drop to the exact drag origin", () => {
    const ratSkin = card(state, "rat-skin");
    const origin = { zone: ratSkin.zone, position: { ...ratSkin.position } };
    const next = applyInteraction(state, ratSkin.id, card(state, "body").id);
    expect(next).toBe(state);
    expect(card(next, "rat-skin")).toMatchObject(origin);
  });

  it("prevents Anchored cards from resting outside home but allows cross-zone dragging", () => {
    const body = card(state, "body");
    expect(canCrossZoneBoundaryDuringDrag(body)).toBe(true);
    expect(canRestInZone(body, "room")).toEqual({
      legal: false,
      reason: "anchored",
    });
    expect(canRestInZone(body, "inventory")).toEqual({ legal: true });
  });

  it("classifies identical Room cards as Stack targets without a Stack Marker", () => {
    const source = { ...card(state, "canned-food"), roomId: "test-room" };
    const target = {
      ...source,
      id: "canned-food-copy",
      position: { x: source.position.x + 240, y: source.position.y },
      attributes: source.attributes.map((attribute) => ({ ...attribute })),
    };
    state = {
      ...state,
      cards: [
        ...state.cards.filter((candidate) => candidate.id !== source.id),
        source,
        target,
      ],
    };

    expect(hasMarker(source, "stack")).toBe(false);
    expect(canStackCards(source, target)).toBe(true);
    expect(cardTargetKind(state, source, target)).toBe("stack");

    const stacked = stackCards(state, source.id, target.id);
    const stackedSource = stacked.cards.find((candidate) => candidate.id === source.id)!;
    expect(stacked.cards).toHaveLength(state.cards.length);
    expect(stacked.cards.some((candidate) => candidate.id === target.id)).toBe(true);
    expect(stackedSource.stackRootId).toBe(target.id);
    expect(stackedSource.roomId).toBe(target.roomId);
  });

  it("rejects Stack targets with different current visible state or outside Room", () => {
    const source = { ...card(state, "flashlight"), roomId: "test-room" };
    const changed = {
      ...source,
      id: "changed-flashlight",
      attributes: source.attributes.map((attribute) =>
        attribute.kind === "value" && attribute.id === "battery"
          ? { ...attribute, value: attribute.value - 1 }
          : { ...attribute },
      ),
    };
    expect(canStackCards(source, changed)).toBe(false);
    expect(canStackCards(
      { ...source, zone: "inventory", roomId: undefined },
      { ...source, id: "carried-copy", zone: "inventory", roomId: undefined },
    )).toBe(false);
  });
});
