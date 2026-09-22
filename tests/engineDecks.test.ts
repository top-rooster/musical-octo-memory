import { describe, expect, it } from "vitest";
import { loadCardMasters } from "../src/data/jsonLoader";
import type { ActionDefinition, CardInstance, CardMaster, GameState } from "../src/domain/types";
import { advanceWorldTime, executeStandaloneAction } from "../src/game/actions";
import { createOwnedDeckStates, drawFromDeck } from "../src/game/decks";

function master(id: string, extra: Partial<CardMaster> = {}): CardMaster {
  return {
    id, title: id, image: "", attributes: [], references: {}, passives: [], actions: [], processes: [], decks: [],
    ...extra,
  };
}

function ownerCard(id = "owner"): CardInstance {
  return {
    id, masterId: "owner", title: "Owner", image: "", attributes: [], references: {},
    zone: "room", roomId: "elsewhere", position: { x: 0, y: 0 },
  };
}

function engineState(processes: CardMaster["processes"] = []): GameState {
  const masters = [master("owner", { processes }), master("a"), master("b")];
  return {
    masters,
    cards: [ownerCard()],
    phase: "main",
    currentRoomId: "active",
    elapsedMinutes: 0,
    nextEntitySerial: 10,
    decks: [{
      id: "owner-deck", definitionId: "contents", name: "Contents", baseMinutes: 15,
      owner: { kind: "card", id: "owner" },
      cards: [{ id: "existing", masterId: "a", attributes: [], references: {} }],
    }],
  };
}

const addRandom: ActionDefinition["effects"][number] = {
  kind: "add-random-card", count: 2, from: ["a", "b"], to: "self.deck",
};

describe("shared Room/card deck engine", () => {
  it("loads card-owned decks through the same authored deck schema", () => {
    const masters = loadCardMasters({
      owner: {
        name: "Owner", image: "owner.png",
        decks: { contents: { name: "Contents", time: "15m", cards: ["a", "b"] } },
      },
      a: { name: "A", image: "a.png" },
      b: { name: "B", image: "b.png" },
    });
    const owner = masters.find((candidate) => candidate.id === "owner")!;
    expect(owner.decks[0]).toMatchObject({ id: "contents", name: "Contents", baseMinutes: 15 });
    let serial = 0;
    const decks = createOwnedDeckStates(masters, owner.decks, { kind: "card", id: "owner-1" },
      (prefix) => `${prefix}-${++serial}`, () => 0.5);
    expect(decks).toHaveLength(1);
    expect(decks[0].owner).toEqual({ kind: "card", id: "owner-1" });
    expect(decks[0].cards.map((card) => card.masterId).sort()).toEqual(["a", "b"]);
  });

  it("retains deterministic order and association through draw and serialization", () => {
    const state = engineState();
    const restored = structuredClone(state);
    expect(restored.decks).toEqual(state.decks);
    const first = drawFromDeck(restored.decks![0]);
    expect(first.drawn?.id).toBe("existing");
    expect(first.deck).toBeNull();
  });

  it("adds independent with-replacement picks to self.deck in pick order", () => {
    const picks = [0, 0.999];
    const result = executeStandaloneAction(engineState(), {
      id: "refill", name: "Refill", effects: [addRandom],
    }, { selfId: "owner" }, { random: () => picks.shift()! });
    expect(result.success).toBe(true);
    expect(result.state.decks![0].cards.map((card) => card.masterId)).toEqual(["a", "a", "b"]);
    expect(new Set(result.state.decks![0].cards.map((card) => card.id)).size).toBe(3);
  });

  it("uses duplicate source IDs as natural weighting", () => {
    const result = executeStandaloneAction(engineState(), {
      id: "weighted", name: "Weighted", effects: [{
        kind: "add-random-card", count: 1, from: ["a", "a", "b"], to: "self.deck",
      }],
    }, { selfId: "owner" }, { random: () => 0.4 });
    expect(result.state.decks![0].cards.at(-1)?.masterId).toBe("a");
  });

  it("shares add-random-card implementation with conditional off-screen Processes", () => {
    const state = engineState([{
      condition: { kind: "and", conditions: [
        { kind: "time", operator: "=", operandMinutes: 15 },
        { kind: "deck-size", operator: "<=", operand: 3 },
      ] },
      effects: [addRandom],
    }]);
    const result = advanceWorldTime(state, 15, { random: () => 0 });
    expect(result.success).toBe(true);
    expect(result.state.decks![0].cards.map((card) => card.masterId)).toEqual(["a", "a", "a"]);
  });
});
