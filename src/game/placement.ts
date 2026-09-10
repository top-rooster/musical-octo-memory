import type { Bounds, CardMaster, Position } from "../domain/types";
import { CARD_GAP, CARD_HEIGHT, CARD_WIDTH } from "./constants";
import { rectanglesOverlap } from "./rules";

export interface MasterPlacement {
  master: CardMaster;
  position: Position;
}

function randomPosition(bounds: Bounds, random: () => number): Position {
  return {
    x: bounds.x + random() * (bounds.width - CARD_WIDTH),
    y: bounds.y + random() * (bounds.height - CARD_HEIGHT),
  };
}

function firstGridOpening(bounds: Bounds, placed: Position[]): Position | null {
  for (
    let y = bounds.y;
    y + CARD_HEIGHT <= bounds.y + bounds.height;
    y += CARD_HEIGHT + CARD_GAP
  ) {
    for (
      let x = bounds.x;
      x + CARD_WIDTH <= bounds.x + bounds.width;
      x += CARD_WIDTH + CARD_GAP
    ) {
      const candidate = { x, y };
      if (placed.every((position) => !rectanglesOverlap(candidate, position, CARD_GAP))) {
        return candidate;
      }
    }
  }
  return null;
}

export function generateRoomPlacements(
  masters: CardMaster[],
  bounds: Bounds,
  random: () => number = Math.random,
  maxAttemptsPerCard = 400,
): MasterPlacement[] {
  if (bounds.width < CARD_WIDTH || bounds.height < CARD_HEIGHT) {
    throw new Error("Room is too small to place a card within its bounds");
  }

  const placements: MasterPlacement[] = [];
  for (const master of masters) {
    let position: Position | null = null;
    for (let attempt = 0; attempt < maxAttemptsPerCard; attempt += 1) {
      const candidate = randomPosition(bounds, random);
      if (
        placements.every((placed) =>
          !rectanglesOverlap(candidate, placed.position, CARD_GAP),
        )
      ) {
        position = candidate;
        break;
      }
    }

    position ??= firstGridOpening(
      bounds,
      placements.map((placement) => placement.position),
    );
    if (!position) {
      throw new Error(
        `Room placement exhausted after ${maxAttemptsPerCard} attempts for "${master.title}"; ` +
          "increase the Room size or reduce the generated card set.",
      );
    }
    placements.push({ master, position });
  }
  return placements;
}

export function generateGridPositions(count: number, bounds: Bounds): Position[] {
  const positions: Position[] = [];
  for (
    let y = bounds.y;
    y + CARD_HEIGHT <= bounds.y + bounds.height && positions.length < count;
    y += CARD_HEIGHT + CARD_GAP
  ) {
    for (
      let x = bounds.x;
      x + CARD_WIDTH <= bounds.x + bounds.width && positions.length < count;
      x += CARD_WIDTH + CARD_GAP
    ) {
      positions.push({ x, y });
    }
  }
  if (positions.length !== count) {
    throw new Error(`Zone is too small to place ${count} required cards`);
  }
  return positions;
}
