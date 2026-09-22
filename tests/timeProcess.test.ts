import { beforeEach, describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { WORLD_DEFINITION } from "../src/data/worldDefinition";
import type { ActionDefinition, CardInstance, GameState } from "../src/domain/types";
import {
  advanceWorldTime,
  crossedQuarterHourTicks,
  executeCardInteraction,
  executeStandaloneAction,
} from "../src/game/actions";
import { getValue } from "../src/game/cardState";
import { createWorldGameState, escapeOpening } from "../src/game/world";

const bounds = { x: 0, y: 0, width: 1400, height: 800 };

function find(state: GameState, masterId: string): CardInstance {
  const card = state.cards.find((candidate) => candidate.masterId === masterId);
  if (!card) throw new Error(`Missing ${masterId}`);
  return card;
}

function setValue(state: GameState, masterId: string, valueId: string, value: number): GameState {
  return {
    ...state,
    cards: state.cards.map((card) => card.masterId === masterId ? {
      ...card,
      attributes: card.attributes.map((attribute) =>
        attribute.kind === "value" && attribute.id === valueId ? { ...attribute, value } : attribute),
    } : card),
  };
}

describe("centralized world time and Processes", () => {
  let opening: GameState;
  let state: GameState;

  beforeEach(() => {
    opening = createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, bounds, () => 0.5);
    state = escapeOpening(opening).state;
  });

  it.each([
    [10, 14, 0],
    [10, 16, 1],
    [14, 31, 2],
    [44, 61, 2],
    [20, 20, 0],
  ])("counts quarter-hour boundaries from %s to %s", (from, to, ticks) => {
    expect(crossedQuarterHourTicks(from, to)).toBe(ticks);
  });

  it("applies Hydration -2 and Satiation -1 per crossed tick", () => {
    const result = advanceWorldTime(state, 31);
    expect(result.success).toBe(true);
    expect(result.processTicks).toBe(2);
    expect(getValue(find(result.state, "body"), "hydration")?.value).toBe(46);
    expect(getValue(find(result.state, "body"), "satiation")?.value).toBe(48);
  });

  it("does not run the survival Process in Opening", () => {
    const result = advanceWorldTime(opening, 30);
    expect(result.processTicks).toBe(2);
    expect(getValue(find(result.state, "body"), "hydration")?.value).toBe(50);
    expect(getValue(find(result.state, "body"), "satiation")?.value).toBe(50);
  });

  it("sets game over when Hydration reaches zero without inventing Satiation-zero behavior", () => {
    state = setValue(state, "body", "hydration", 2);
    let result = advanceWorldTime(state, 15);
    expect(getValue(find(result.state, "body"), "hydration")?.value).toBe(0);
    expect(result.state.gameOver).toBe(true);

    state = setValue(setValue({ ...state, gameOver: undefined }, "body", "hydration", 50), "body", "satiation", 1);
    result = advanceWorldTime(state, 15);
    expect(getValue(find(result.state, "body"), "satiation")?.value).toBe(0);
    expect(result.state.gameOver).not.toBe(true);
  });

  it("runs every active non-conflicting Process once per tick", () => {
    state = {
      ...state,
      masters: state.masters.map((master) => master.id === "mind" ? {
        ...master,
        processes: [{ effects: [
          { kind: "value", target: "self", value: "vision", operator: "-=", operand: 1 },
        ] }],
      } : master),
    };
    const result = advanceWorldTime(state, 15);
    expect(result.processTicks).toBe(1);
    expect(getValue(find(result.state, "body"), "hydration")?.value).toBe(48);
    expect(getValue(find(result.state, "mind"), "vision")?.value).toBe(3);
  });

  it("evaluates Process conditions and later Processes see earlier same-tick changes", () => {
    state = {
      ...state,
      masters: state.masters.map((master) => master.id === "mind" ? {
        ...master,
        processes: [
          { effects: [{ kind: "value", value: "vision", operator: "-=", operand: 1 }] },
          {
            condition: { kind: "value", value: "vision", operator: "=", operand: 3 },
            effects: [{ kind: "value", value: "vision", operator: "-=", operand: 1 }],
          },
        ],
      } : master),
    };
    const result = advanceWorldTime(state, 15);
    expect(result.success).toBe(true);
    expect(getValue(find(result.state, "mind"), "vision")?.value).toBe(2);
  });

  it("keeps globally active off-screen card Processes running", () => {
    const remote = find(state, "go-tunnels-from-office");
    state = {
      ...state,
      masters: state.masters.map((master) => master.id === remote.masterId ? {
        ...master,
        processes: [{ effects: [{ kind: "value", value: "travel-time", operator: "+=", operand: 5 }] }],
      } : master),
    };
    const result = advanceWorldTime(state, 15);
    expect(remote.roomId).not.toBe(state.currentRoomId);
    expect(getValue(result.state.cards.find((card) => card.id === remote.id)!, "travel-time")?.value).toBe(20);
  });

  it("resolves an exact-boundary Process before the next ordered Action effect", () => {
    const action: ActionDefinition = {
      id: "wait-then-eat",
      name: "Wait then eat",
      applicable: { direction: "receive", selector: { kind: "marker", target: "other", marker: "food" } },
      effects: [
        { kind: "spend-time", operand: 15 },
        { kind: "value", target: "self", value: "satiation", operator: "+=", operand: 10 },
      ],
    };
    state = {
      ...state,
      masters: state.masters.map((master) => master.id === "body" ? { ...master, actions: [action] } : master),
    };
    const result = executeCardInteraction(state, find(state, "canned-food"), find(state, "body"));
    expect(result.success).toBe(true);
    expect(result.processTicks).toBe(1);
    expect(result.minutes).toBe(15);
    expect(getValue(find(result.state, "body"), "satiation")?.value).toBe(59);
  });

  it("supports constant spend-time and a zero-minute Action through the same path", () => {
    const fifteen = executeStandaloneAction(state, {
      id: "wait",
      name: "Wait",
      effects: [{ kind: "spend-time", operand: 15 }],
    });
    expect(fifteen.success).toBe(true);
    expect(fifteen.state.elapsedMinutes).toBe(15);
    expect(fifteen.processTicks).toBe(1);

    const zero = executeStandaloneAction(state, {
      id: "wait",
      name: "Wait",
      effects: [{ kind: "spend-time", operand: 0 }],
    });
    expect(zero.state.elapsedMinutes).toBe(0);
    expect(zero.processTicks).toBe(0);
  });
});
