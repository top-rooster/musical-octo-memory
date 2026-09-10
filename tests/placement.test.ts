import { describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { CARD_HEIGHT, CARD_WIDTH } from "../src/game/constants";
import { createInitialGameState } from "../src/game/initialState";
import { generateRoomPlacements } from "../src/game/placement";
import { isAnchored, rectanglesOverlap } from "../src/game/rules";

function seededRandom(seed = 98765): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };
}

describe("initial Room generation", () => {
  const roomBounds = { x: 0, y: 0, width: 1400, height: 800 };

  it("creates exactly one Room instance of every non-Anchored master", () => {
    const state = createInitialGameState(
      CARD_MASTERS,
      roomBounds,
      { x: 0, y: 0, width: 900, height: 320 },
      seededRandom(),
    );
    const expected = CARD_MASTERS.filter((master) => !isAnchored(master))
      .map((master) => master.id)
      .sort();
    const actual = state.cards
      .filter((card) => card.zone === "room")
      .map((card) => card.masterId)
      .sort();
    expect(actual).toEqual(expected);
  });

  it("keeps randomized placements inside Room bounds without overlap", () => {
    const nonAnchored = CARD_MASTERS.filter((master) => !isAnchored(master));
    const placements = generateRoomPlacements(nonAnchored, roomBounds, seededRandom());

    for (const placement of placements) {
      expect(placement.position.x).toBeGreaterThanOrEqual(roomBounds.x);
      expect(placement.position.y).toBeGreaterThanOrEqual(roomBounds.y);
      expect(placement.position.x + CARD_WIDTH).toBeLessThanOrEqual(roomBounds.width);
      expect(placement.position.y + CARD_HEIGHT).toBeLessThanOrEqual(roomBounds.height);
    }
    for (let first = 0; first < placements.length; first += 1) {
      for (let second = first + 1; second < placements.length; second += 1) {
        expect(rectanglesOverlap(placements[first].position, placements[second].position)).toBe(false);
      }
    }
  });

  it("uses a bounded fallback instead of looping forever with a hostile random source", () => {
    const nonAnchored = CARD_MASTERS.filter((master) => !isAnchored(master)).slice(0, 3);
    expect(() => generateRoomPlacements(nonAnchored, roomBounds, () => 0, 2)).not.toThrow();
  });
});
