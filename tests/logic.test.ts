import { describe, expect, it } from "vitest";
import type { CardInstance, GameState, LogicCondition } from "../src/domain/types";
import { evaluateCondition } from "../src/game/logic";

function card(id: string, options: Partial<CardInstance> = {}): CardInstance {
  return {
    id,
    masterId: id,
    title: id,
    image: "",
    attributes: [],
    references: {},
    zone: "inventory",
    position: { x: 0, y: 0 },
    ...options,
  };
}

function evaluate(condition: LogicCondition, state: GameState, self: CardInstance, other?: CardInstance) {
  return evaluateCondition(condition, { state, self, other });
}

describe("shared condition evaluator", () => {
  const self = card("self", {
    attributes: [
      { kind: "marker", id: "food" },
      { kind: "value", id: "battery", value: 20, min: 0, max: 100 },
    ],
  });
  const other = card("other", {
    zone: "room",
    roomId: "active",
    attributes: [{ kind: "marker", id: "path" }],
  });
  const state: GameState = {
    masters: [],
    cards: [self, other],
    currentRoomId: "active",
    elapsedMinutes: 22 * 60,
    decks: [{
      id: "owned", definitionId: "contents", name: "Contents", baseMinutes: 15,
      owner: { kind: "card", id: self.id }, cards: [
        { id: "one", masterId: "one", attributes: [], references: {} },
        { id: "two", masterId: "two", attributes: [], references: {} },
      ],
    }],
  };

  it("uses self by default and explicit other without feature-specific matching", () => {
    expect(evaluate({ kind: "marker", marker: "food" }, state, self, other)).toMatchObject({ valid: true, value: true });
    expect(evaluate({ kind: "marker", target: "other", marker: "path" }, state, self, other).value).toBe(true);
    expect(evaluate({ kind: "marker", target: "other", marker: "path" }, state, self)).toMatchObject({ valid: false, value: false });
  });

  it("evaluates placement literals and nested boolean expressions", () => {
    const condition: LogicCondition = {
      kind: "and",
      conditions: [
        { kind: "literal", literal: "in-inventory" },
        { kind: "not", condition: { kind: "literal", literal: "equipped" } },
        { kind: "or", conditions: [
          { kind: "literal", target: "other", literal: "in-room" },
          { kind: "marker", marker: "missing" },
        ] },
      ],
    };
    expect(evaluate(condition, state, self, other).value).toBe(true);
    expect(evaluate({ kind: "literal", literal: "equipped" }, state, { ...self, equipmentSlot: "left-hand" }).value)
      .toBe(true);
  });

  it.each([
    [">", 1, true], [">=", 2, true], ["<", 3, true], ["<=", 2, true],
    ["=", 2, true], ["<>", 3, true],
  ] as const)("evaluates deck_size %s %s", (operator, operand, expected) => {
    expect(evaluate({ kind: "deck-size", operator, operand }, state, self).value).toBe(expected);
  });

  it("computes missing decks as zero and current deck contents without a cached counter", () => {
    expect(evaluate({ kind: "deck-size", operator: "=", operand: 0 }, state, other).value).toBe(true);
    const depleted = { ...state, decks: [{ ...state.decks![0], cards: state.decks![0].cards.slice(1) }] };
    expect(evaluate({ kind: "deck-size", operator: "=", operand: 1 }, depleted, self).value).toBe(true);
  });

  it("counts matching cards through the same nested condition language", () => {
    const starving = [
      card("a", { attributes: [{ kind: "marker", id: "starving" }] }),
      card("b", { attributes: [{ kind: "marker", id: "starving" }] }),
      card("c", { zone: "room", roomId: "active", attributes: [{ kind: "marker", id: "starving" }] }),
    ];
    const countState = { ...state, cards: starving };
    expect(evaluate({
      kind: "count",
      condition: { kind: "and", conditions: [
        { kind: "marker", marker: "starving" },
        { kind: "literal", literal: "in-inventory" },
      ] },
      operator: ">=",
      operand: 2,
    }, countState, starving[0]).value).toBe(true);
  });

  it("evaluates exact and cross-midnight world-clock conditions modulo a day", () => {
    expect(evaluate({ kind: "time", operator: "=", operandMinutes: 22 * 60 }, state, self).value).toBe(true);
    const night: LogicCondition = { kind: "or", conditions: [
      { kind: "time", operator: ">=", operandMinutes: 22 * 60 },
      { kind: "time", operator: "<", operandMinutes: 6 * 60 },
    ] };
    expect(evaluate(night, { ...state, elapsedMinutes: 23 * 60 }, self).value).toBe(true);
    expect(evaluate(night, { ...state, elapsedMinutes: 24 * 60 + 5 * 60 }, self).value).toBe(true);
    expect(evaluate(night, { ...state, elapsedMinutes: 12 * 60 }, self).value).toBe(false);
  });
});
