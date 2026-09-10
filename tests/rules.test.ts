import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import type { CardInstance, GameState } from "../src/domain/types";
import { createInitialGameState } from "../src/game/initialState";
import {
  applyInteraction,
  calculateInteractionOutcome,
  canCrossZoneBoundaryDuringDrag,
  canInteract,
  canPlaceInZone,
  countInventoryCards,
  getValue,
  resolveDrop,
} from "../src/game/rules";

function seededRandom(seed = 123456): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
}

function card(state: GameState, title: string): CardInstance {
  const found = state.cards.find((candidate) => candidate.title === title);
  if (!found) throw new Error(`Test card not found: ${title}`);
  return found;
}

describe("Milestone 1 rules", () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialGameState(
      CARD_MASTERS,
      { x: 0, y: 0, width: 1400, height: 800 },
      { x: 0, y: 0, width: 900, height: 320 },
      seededRandom(),
    );
  });

  it("allows both authored foods, but not Rat Skin, to interact with Body", () => {
    const body = card(state, "Body");
    expect(canInteract(state, card(state, "Rat Meat"), body)).toBe(true);
    expect(canInteract(state, card(state, "Canned Food"), body)).toBe(true);
    expect(canInteract(state, card(state, "Rat Skin"), body)).toBe(false);
  });

  it("applies Rat Meat Satiation +15 and consumes the source", () => {
    const body = card(state, "Body");
    const ratMeat = card(state, "Rat Meat");
    const next = applyInteraction(state, ratMeat.id, body.id);
    expect(getValue(card(next, "Body"), "Satiation")?.value).toBe(65);
    expect(next.cards.some((candidate) => candidate.id === ratMeat.id)).toBe(false);
  });

  it("applies Canned Food Satiation +25", () => {
    const body = card(state, "Body");
    const cannedFood = card(state, "Canned Food");
    const next = applyInteraction(state, cannedFood.id, body.id);
    expect(getValue(card(next, "Body"), "Satiation")?.value).toBe(75);
  });

  it("clamps preview and committed Satiation at 100 using the same outcome", () => {
    state = {
      ...state,
      cards: state.cards.map((candidate) =>
        candidate.title === "Body"
          ? {
              ...candidate,
              attributes: candidate.attributes.map((attribute) =>
                attribute.kind === "value" && attribute.name === "Satiation"
                  ? { ...attribute, value: 90 }
                  : attribute,
              ),
            }
          : candidate,
      ),
    };
    const body = card(state, "Body");
    const cannedFood = card(state, "Canned Food");
    expect(calculateInteractionOutcome(state, cannedFood, body)?.valueChanges[0]).toMatchObject({
      before: 90,
      after: 100,
    });
    const next = applyInteraction(state, cannedFood.id, body.id);
    expect(getValue(card(next, "Body"), "Satiation")?.value).toBe(100);
  });

  it("leaves state unchanged for an invalid interaction", () => {
    const next = applyInteraction(state, card(state, "Rat Skin").id, card(state, "Body").id);
    expect(next).toBe(state);
  });

  it("restores an invalid card-on-card drop to the exact drag origin", () => {
    const ratSkin = card(state, "Rat Skin");
    const origin = { zone: ratSkin.zone, position: { ...ratSkin.position } };
    const transient: GameState = {
      ...state,
      cards: state.cards.map((candidate) =>
        candidate.id === ratSkin.id
          ? { ...candidate, zone: "inventory", position: { x: 501.25, y: 91.75 } }
          : candidate,
      ),
    };
    const next = resolveDrop(transient, ratSkin.id, origin, {
      kind: "card",
      targetId: card(state, "Body").id,
    });
    expect(card(next, "Rat Skin")).toMatchObject(origin);
  });

  it("prevents Anchored cards from resting outside home but allows cross-zone dragging", () => {
    const body = card(state, "Body");
    expect(canCrossZoneBoundaryDuringDrag(body)).toBe(true);
    expect(canPlaceInZone(body, "room", state.cards)).toEqual({
      legal: false,
      reason: "anchored",
    });
    const next = resolveDrop(state, body.id, { zone: body.zone, position: body.position }, {
      kind: "zone",
      zone: "room",
      position: { x: 100, y: 100 },
      bounds: { x: 0, y: 0, width: 1400, height: 800 },
    });
    expect(card(next, "Body").zone).toBe("inventory");
  });

  it("rejects a sixth non-Anchored Inventory card", () => {
    const movable = state.cards.filter((candidate) => candidate.zone === "room").slice(0, 6);
    state = {
      ...state,
      cards: state.cards.map((candidate) => {
        const index = movable.slice(0, 5).findIndex((item) => item.id === candidate.id);
        return index >= 0
          ? { ...candidate, zone: "inventory", position: { x: index * 125, y: 160 } }
          : candidate;
      }),
    };
    expect(countInventoryCards(state.cards)).toBe(5);
    expect(canPlaceInZone(card(state, movable[5].title), "inventory", state.cards)).toEqual({
      legal: false,
      reason: "capacity",
    });
  });

  it("does not count Anchored cards against Inventory capacity", () => {
    expect(state.cards.filter((candidate) => candidate.zone === "inventory")).toHaveLength(3);
    expect(countInventoryCards(state.cards)).toBe(0);
  });
});
