import type {
  Bounds,
  CardAttribute,
  CardInstance,
  CardMaster,
  GameState,
  Position,
  Zone,
} from "../domain/types";
import { isAnchored } from "./rules";
import { generateGridPositions, generateRoomPlacements } from "./placement";

const STARTING_INVENTORY_TITLES = ["Body", "Mind", "Spirit"] as const;

function cloneAttributes(attributes: CardAttribute[]): CardAttribute[] {
  return attributes.map((attribute) => ({ ...attribute }));
}

function createInstance(
  master: CardMaster,
  zone: Zone,
  position: Position,
): CardInstance {
  return {
    id: `${master.id}-1`,
    masterId: master.id,
    title: master.title,
    image: master.image,
    attributes: cloneAttributes(master.attributes),
    zone,
    homeZone: isAnchored(master) ? zone : undefined,
    position: { ...position },
  };
}

function insetBounds(bounds: Bounds, horizontal: number, top: number, bottom: number): Bounds {
  return {
    x: bounds.x + horizontal,
    y: bounds.y + top,
    width: bounds.width - horizontal * 2,
    height: bounds.height - top - bottom,
  };
}

export function createInitialGameState(
  masters: CardMaster[],
  roomBounds: Bounds,
  inventoryBounds: Bounds,
  random: () => number = Math.random,
): GameState {
  const generatedMasters = masters.filter((master) => !isAnchored(master));
  const roomPlacements = generateRoomPlacements(
    generatedMasters,
    insetBounds(roomBounds, 16, 54, 16),
    random,
  );

  const inventoryMasters = STARTING_INVENTORY_TITLES.map((title) => {
    const master = masters.find((candidate) => candidate.title === title);
    if (!master) throw new Error(`Missing required card master: ${title}`);
    if (!isAnchored(master)) throw new Error(`${title} must carry the Anchored marker`);
    return master;
  });
  const inventoryPositions = generateGridPositions(
    inventoryMasters.length,
    insetBounds(inventoryBounds, 16, 52, 14),
  );

  const roomCards = roomPlacements.map(({ master, position }) =>
    createInstance(master, "room", position),
  );
  const inventoryCards = inventoryMasters.map((master, index) =>
    createInstance(master, "inventory", inventoryPositions[index]),
  );

  return { masters, cards: [...roomCards, ...inventoryCards] };
}
