import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { CardInstance, GameState } from "../src/domain/types";
import { createInitialGameState } from "../src/game/initialState";
import { createWorldGameState } from "../src/game/world";
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
    expect(calculateInteractionOutcome(state, ratMeat, body)?.valueChanges).toContainEqual({
      cardId: body.id, attribute: "satiation", before: 50, after: 65,
    });
    const next = applyInteraction(state, ratMeat.id, body.id);
    expect(getValue(card(next, "body"), "satiation")?.value).toBe(65);
    expect(next.cards.some((candidate) => candidate.id === ratMeat.id)).toBe(false);
  });

  it("applies Canned Food Satiation +25", () => {
    const body = card(state, "body");
    const cannedFood = card(state, "canned-food");
    const next = applyInteraction(state, cannedFood.id, body.id);
    expect(getValue(card(next, "body"), "satiation")?.value).toBe(75);
    expect(next.cards.some((candidate) => candidate.id === cannedFood.id)).toBe(false);
  });

  it("does not partially execute Drink while remove Marker is unsupported", () => {
    state = {
      ...state,
      cards: state.cards.map((candidate) => candidate.masterId === "plastic-bottle"
        ? { ...candidate, attributes: [...candidate.attributes, { kind: "marker" as const, id: "contains-water" }] }
        : candidate),
    };
    const bottle = card(state, "plastic-bottle");
    const body = card(state, "body");
    const beforeHydration = getValue(body, "hydration")?.value;

    expect(canInteract(state, bottle, body)).toBe(false);
    expect(calculateInteractionOutcome(state, bottle, body)).toBeNull();
    expect(applyInteraction(state, bottle.id, body.id)).toBe(state);
    expect(getValue(card(state, "body"), "hydration")?.value).toBe(beforeHydration);
    expect(hasMarker(card(state, "plastic-bottle"), "contains-water")).toBe(true);
  });

  it("does not partially execute Skin while draw effects are unsupported", () => {
    const knife = card(state, "pocket-knife");
    const deadRat = card(state, "dead-rat");
    const beforeRatSkin = state.cards.filter((candidate) => candidate.masterId === "rat-skin").length;
    const beforeRatMeat = state.cards.filter((candidate) => candidate.masterId === "rat-meat").length;

    expect(canInteract(state, knife, deadRat)).toBe(false);
    expect(calculateInteractionOutcome(state, knife, deadRat)).toBeNull();
    expect(applyInteraction(state, knife.id, deadRat.id)).toBe(state);
    expect(state.cards.some((candidate) => candidate.id === deadRat.id)).toBe(true);
    expect(state.cards.filter((candidate) => candidate.masterId === "rat-skin")).toHaveLength(beforeRatSkin);
    expect(state.cards.filter((candidate) => candidate.masterId === "rat-meat")).toHaveLength(beforeRatMeat);
  });

  it("blocks an entire otherwise-supported Action when one effect is unsupported", () => {
    const body = card(state, "body");
    const cannedFood = card(state, "canned-food");
    state = {
      ...state,
      masters: state.masters.map((master) => master.id === "body" ? {
        ...master,
        accept: master.accept.map((acceptance) => acceptance.card === "canned-food" ? {
          ...acceptance,
          action: { ...acceptance.action, effects: [...acceptance.action.effects, { draw: "fever" }] },
        } : acceptance),
      } : master),
    };

    expect(canInteract(state, cannedFood, body)).toBe(false);
    expect(calculateInteractionOutcome(state, cannedFood, body)).toBeNull();
    expect(applyInteraction(state, cannedFood.id, body.id)).toBe(state);
    expect(getValue(card(state, "body"), "satiation")?.value).toBe(50);
    expect(state.cards.some((candidate) => candidate.id === cannedFood.id)).toBe(true);
  });

  it("keeps card-authored travel available through the compatibility adapter", () => {
    const world = createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, { x: 0, y: 0, width: 1400, height: 800 }, () => 0.5,
    );
    const body = card(world, "body");
    const route = card(world, "go-tunnels-from-office");
    expect(canInteract(world, body, route)).toBe(true);
    expect(route.travel).toEqual({
      acceptedCardId: "body", destinationRoomId: "tunnels", baseMinutes: 15,
    });
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
