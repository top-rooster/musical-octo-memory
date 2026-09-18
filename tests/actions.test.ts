import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { ActionDefinition, ActionSelector, CardInstance, GameState } from "../src/domain/types";
import {
  evaluateSelector,
  executeCardInteraction,
  matchingActions,
} from "../src/game/actions";
import { getValue, hasMarker } from "../src/game/cardState";
import { createWorldGameState, escapeOpening } from "../src/game/world";

const bounds = { x: 0, y: 0, width: 1400, height: 800 };

function find(state: GameState, masterId: string): CardInstance {
  const card = state.cards.find((candidate) => candidate.masterId === masterId);
  if (!card) throw new Error(`Missing ${masterId}`);
  return card;
}

function replaceActions(state: GameState, masterId: string, actions: ActionDefinition[]): GameState {
  return {
    ...state,
    masters: state.masters.map((master) => master.id === masterId ? { ...master, actions } : master),
  };
}

function receivingAction(effects: ActionDefinition["effects"]): ActionDefinition {
  return {
    id: "test-action",
    name: "Test Action",
    applicable: { direction: "receive", selector: { kind: "marker", marker: "food" } },
    effects,
  };
}

describe("Action selectors", () => {
  const card: CardInstance = {
    id: "test-card",
    masterId: "test",
    title: "Test",
    image: "",
    attributes: [
      { kind: "marker", id: "food" },
      { kind: "value", id: "battery", value: 20, min: 0, max: 100 },
    ],
    references: {},
    zone: "room",
    position: { x: 0, y: 0 },
  };

  it("evaluates marker selectors", () => {
    expect(evaluateSelector({ kind: "marker", marker: "food" }, card)).toBe(true);
    expect(evaluateSelector({ kind: "marker", marker: "path" }, card)).toBe(false);
  });

  it.each([
    [">", 19, true], [">=", 20, true], ["<", 21, true], ["<=", 20, true],
    ["=", 20, true], ["<>", 19, true], ["=", 19, false],
  ] as const)("evaluates Value %s %s", (operator, operand, expected) => {
    expect(evaluateSelector({ kind: "value", value: "battery", operator, operand }, card)).toBe(expected);
  });

  it("evaluates nested and, or, and not", () => {
    const selector: ActionSelector = {
      kind: "and",
      selectors: [
        { kind: "marker", marker: "food" },
        {
          kind: "or",
          selectors: [
            { kind: "value", value: "battery", operator: "<", operand: 5 },
            { kind: "not", selector: { kind: "marker", marker: "path" } },
          ],
        },
      ],
    };
    expect(evaluateSelector(selector, card)).toBe(true);
  });
});

describe("Action matching and effects", () => {
  let state: GameState;

  beforeEach(() => {
    state = escapeOpening(createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, bounds, () => 0.5,
    )).state;
  });

  it("returns zero matches for an unrelated pair", () => {
    expect(matchingActions(state, find(state, "pocket-knife"), find(state, "body"))).toEqual([]);
  });

  it("maps receive Actions to self=received and other=accepted", () => {
    const food = find(state, "canned-food");
    const body = find(state, "body");
    expect(matchingActions(state, food, body)).toEqual([
      expect.objectContaining({ selfId: body.id, otherId: food.id, acceptedId: food.id, receivedId: body.id }),
    ]);
  });

  it("maps on Actions to self=accepted and other=received", () => {
    const body = find(state, "body");
    const route = find(state, "go-tunnels-from-office");
    expect(matchingActions(state, body, route)).toEqual([
      expect.objectContaining({ selfId: body.id, otherId: route.id, acceptedId: body.id, receivedId: route.id }),
    ]);
  });

  it("requires the path Marker for Travel", () => {
    const body = find(state, "body");
    const route = find(state, "go-tunnels-from-office");
    const withoutPath = {
      ...route,
      attributes: route.attributes.filter((attribute) => !(attribute.kind === "marker" && attribute.id === "path")),
    };
    expect(matchingActions(state, body, withoutPath)).toEqual([]);
  });

  it("resolves spend-time from the route Value and set-room from its Reference", () => {
    state = { ...state, currentRoomId: "abandoned-office" };
    const body = find(state, "body");
    const route = find(state, "go-tunnels-from-office");
    const result = executeCardInteraction(state, body, route);
    expect(result.success).toBe(true);
    expect(result.minutes).toBe(15);
    expect(result.processTicks).toBe(1);
    expect(result.state.currentRoomId).toBe("tunnels");
    expect(result.state.elapsedMinutes).toBe(15);
  });

  it("rejects multiple runtime matches without choosing one", () => {
    const food = find(state, "canned-food");
    const body = find(state, "body");
    const foodMaster = state.masters.find((master) => master.id === food.masterId)!;
    state = replaceActions(state, food.masterId, [{
      id: "offer-food",
      name: "Offer Food",
      applicable: { direction: "on", selector: { kind: "marker", marker: "anchored" } },
      effects: [],
    }, ...foodMaster.actions]);
    const result = executeCardInteraction(state, food, body);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("ambiguous");
    expect(result.state).toBe(state);
  });

  it("applies add/remove Marker and constant Value operations in order", () => {
    const body = find(state, "body");
    const food = find(state, "canned-food");
    state = replaceActions(state, "body", [receivingAction([
      { kind: "add-marker", target: "self", marker: "dressed" },
      { kind: "remove-marker", target: "other", marker: "food" },
      { kind: "value", target: "self", value: "hydration", operator: "=", operand: 40 },
      { kind: "value", target: "self", value: "hydration", operator: "+=", operand: 5 },
      { kind: "value", target: "self", value: "hydration", operator: "-=", operand: 3 },
    ])]);
    const result = executeCardInteraction(state, food, body);
    expect(result.success).toBe(true);
    expect(hasMarker(find(result.state, "body"), "dressed")).toBe(true);
    expect(hasMarker(find(result.state, "canned-food"), "food")).toBe(false);
    expect(getValue(find(result.state, "body"), "hydration")?.value).toBe(42);
  });

  it("resolves Value RHS operands from self and other before mutation", () => {
    const body = find(state, "body");
    const food = find(state, "canned-food");
    state = replaceActions(state, "body", [receivingAction([
      {
        kind: "value", target: "self", value: "satiation", operator: "+=",
        operand: { target: "other", value: "food-value" },
      },
      {
        kind: "value", target: "self", value: "hydration", operator: "-=",
        operand: { target: "self", value: "satiation" },
      },
    ])]);
    const result = executeCardInteraction(state, food, body);
    expect(getValue(find(result.state, "body"), "satiation")?.value).toBe(75);
    expect(getValue(find(result.state, "body"), "hydration")?.value).toBe(0);
  });

  it("discards the authored target exactly once", () => {
    const food = find(state, "canned-food");
    const body = find(state, "body");
    const result = executeCardInteraction(state, food, body);
    expect(result.success).toBe(true);
    expect(result.discardedCardIds).toEqual([food.id]);
    expect(result.state.cards.filter((card) => card.id === food.id)).toHaveLength(0);
  });

  it("leaves all state unchanged for an unresolved Value", () => {
    const food = find(state, "canned-food");
    const body = find(state, "body");
    state = replaceActions(state, "body", [receivingAction([
      { kind: "value", target: "self", value: "missing", operator: "+=", operand: 10 },
      { kind: "discard", target: "other" },
    ])]);
    const result = executeCardInteraction(state, food, body);
    expect(result.success).toBe(false);
    expect(result.state).toBe(state);
    expect(result.state.cards.some((card) => card.id === food.id)).toBe(true);
  });

  it("leaves all state unchanged for an unsupported runtime effect", () => {
    const food = find(state, "canned-food");
    const body = find(state, "body");
    state = replaceActions(state, "body", [receivingAction([
      { kind: "unsupported", target: "self" } as never,
    ])]);
    const result = executeCardInteraction(state, food, body);
    expect(result.success).toBe(false);
    expect(result.state).toBe(state);
  });

  it("leaves time and Room unchanged for an unresolved Reference", () => {
    const body = find(state, "body");
    const route = find(state, "go-tunnels-from-office");
    state = {
      ...state,
      cards: state.cards.map((card) => card.id === route.id ? { ...card, references: {} } : card),
    };
    const result = executeCardInteraction(state, body, find(state, "go-tunnels-from-office"));
    expect(result.success).toBe(false);
    expect(result.state).toBe(state);
    expect(result.state.elapsedMinutes).toBe(0);
    expect(result.state.currentRoomId).toBe("tunnels");
  });
});
