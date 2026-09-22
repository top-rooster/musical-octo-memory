import { describe, expect, it } from "vitest";
import type { CardInstance, CardMaster, GameState } from "../src/domain/types";
import { getValue } from "../src/game/cardState";
import { effectiveCardValue } from "../src/game/passives";

function source(id: string, equipped: boolean): CardInstance {
  return {
    id,
    masterId: id,
    title: id,
    image: "",
    attributes: [],
    references: {},
    zone: "inventory",
    equipmentSlot: equipped ? "left-hand" : undefined,
    position: { x: 0, y: 0 },
  };
}

function passiveMaster(id: string): CardMaster {
  return {
    id, title: id, image: "", attributes: [], references: {}, actions: [], processes: [], decks: [],
    passives: [{
      condition: { kind: "literal", literal: "equipped" },
      effects: [{ target: "nadir", value: "vision", operator: "+=", operand: 1 }],
    }],
  };
}

describe("generic continuous passives", () => {
  it("applies equivalent authored passives without source master identity and never mutates the base Value", () => {
    const mind: CardInstance = {
      id: "mind", masterId: "mind", title: "Mind", image: "", nadirState: true,
      attributes: [{ kind: "value", id: "vision", value: 4, min: 0, max: 100 }],
      references: {}, zone: "inventory", position: { x: 0, y: 0 },
    };
    const first = source("first-device", true);
    const second = source("second-device", true);
    const state: GameState = {
      cards: [mind, first, second],
      masters: [passiveMaster(first.masterId), passiveMaster(second.masterId)],
    };
    expect(effectiveCardValue(state, mind, "vision")).toMatchObject({ base: 4, modifier: 2, value: 6 });
    expect(getValue(mind, "vision")?.value).toBe(4);
    const unequipped = {
      ...state,
      cards: state.cards.map((card) => card.id === first.id ? { ...card, equipmentSlot: undefined } : card),
    };
    expect(effectiveCardValue(unequipped, mind, "vision").value).toBe(5);
    expect(getValue(mind, "vision")?.value).toBe(4);
  });
});
