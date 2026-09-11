import type {
  CardAttribute,
  CardMaster,
  EquipmentSlot,
  LightLevel,
  TravelDefinition,
} from "../domain/types";
import { slugify } from "./cardParser";

interface SourceLine { number: number; text: string; }
export interface CardInstanceDefinition {
  masterId: string;
  attributes: CardAttribute[];
  travel?: TravelDefinition;
}
export interface EquippedDefinition extends CardInstanceDefinition { slot: EquipmentSlot; }
export interface DeckDefinition {
  name: string;
  baseMinutes: number;
  cards: CardInstanceDefinition[];
}
export interface RoomDefinition {
  id: string;
  name: string;
  background: string;
  light: LightLevel;
  takeLimit?: number;
  escapeRoomId?: string;
  nadir: CardInstanceDefinition[];
  equipped: EquippedDefinition[];
  offered: CardInstanceDefinition[];
  cards: CardInstanceDefinition[];
  decks: DeckDefinition[];
}
export interface WorldDefinition {
  startRoomId: string;
  searchBack: string;
  rooms: RoomDefinition[];
}

const LIGHTS: LightLevel[] = ["Bright", "Dim", "Twilight", "Darkness"];
const SLOTS: EquipmentSlot[] = [
  "Left Hand", "Right Hand", "Head", "Eyes", "Neck", "Chest", "Back", "Legs", "Feet",
];
type Section = "nadir" | "equipped" | "offered" | "cards" | "deck";

function error(line: SourceLine, message: string): Error {
  return new Error(`rooms.txt line ${line.number}: ${message} ("${line.text}")`);
}
function parseMinutes(token: string, line: SourceLine): number {
  const match = token.match(/^(\d+)(m|h)$/);
  if (!match) throw error(line, "Expected an explicit duration such as 15m or 1h");
  return Number.parseInt(match[1], 10) * (match[2] === "h" ? 60 : 1);
}
function cloneAttributes(attributes: CardAttribute[]): CardAttribute[] {
  return attributes.map((attribute) => ({ ...attribute }));
}

function parseInstance(line: SourceLine, masters: CardMaster[]): CardInstanceDefinition {
  const master = [...masters]
    .sort((a, b) => b.title.length - a.title.length)
    .find((candidate) =>
      line.text === candidate.title || line.text.startsWith(`${candidate.title} `),
    );
  if (!master) throw error(line, "Card instance does not begin with a known card-master title");
  const attributes = cloneAttributes(master.attributes);
  let remainder = line.text.slice(master.title.length).trim();
  let travel: TravelDefinition | undefined;
  while (remainder) {
    if (remainder.startsWith("+")) {
      const match = remainder.match(/^\+(\S+)(?:\s+|$)/);
      if (!match) throw error(line, "Malformed +Marker instance override");
      if (!attributes.some((attribute) => attribute.kind === "marker" && attribute.name === match[1])) {
        attributes.push({ kind: "marker", name: match[1] });
      }
      remainder = remainder.slice(match[0].length).trim();
      continue;
    }
    if (remainder.startsWith("->")) {
      const match = remainder.match(/^->\s+(.+?)\s+(\d+(?:m|h))$/);
      if (!match) throw error(line, "Expected '-> <destination room> <duration>'");
      travel = { destinationRoomId: slugify(match[1]), baseMinutes: parseMinutes(match[2], line) };
      remainder = "";
      continue;
    }
    const valueMatch = remainder.match(/^(.+?)\s+(-?\d+)(?:\s+|$)/);
    if (!valueMatch) throw error(line, "Malformed supported card-instance override");
    const existing = attributes.find(
      (attribute) => attribute.kind === "value" && attribute.name === valueMatch[1],
    );
    if (!existing || existing.kind !== "value") {
      throw error(line, `Cannot override unknown Value "${valueMatch[1]}"`);
    }
    existing.value = Number.parseInt(valueMatch[2], 10);
    remainder = remainder.slice(valueMatch[0].length).trim();
  }
  return { masterId: master.id, attributes, travel };
}

export function parseRooms(source: string, masters: CardMaster[]): WorldDefinition {
  const lines: SourceLine[] = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const text = raw.trim();
    if (text && !text.startsWith("#")) lines.push({ number: index + 1, text });
  });
  if (!lines.length) throw new Error("rooms.txt contains no world data");

  const rooms: RoomDefinition[] = [];
  let startRoomId = "";
  let searchBack = "";
  let room: RoomDefinition | undefined;
  let section: Section | undefined;
  let deck: DeckDefinition | undefined;

  for (const line of lines) {
    if (line.text.startsWith("start ")) {
      if (startRoomId) throw error(line, "Duplicate start room");
      startRoomId = slugify(line.text.slice(6).trim());
      continue;
    }
    if (line.text.startsWith("search-back ")) {
      if (searchBack) throw error(line, "Duplicate Search-back image");
      searchBack = line.text.slice(12).trim();
      continue;
    }
    if (line.text.startsWith("room ")) {
      const name = line.text.slice(5).trim();
      if (!name) throw error(line, "Room name is required");
      room = {
        id: slugify(name), name, background: "", light: "Bright",
        nadir: [], equipped: [], offered: [], cards: [], decks: [],
      };
      if (rooms.some((candidate) => candidate.id === room!.id)) throw error(line, "Duplicate room");
      rooms.push(room);
      section = undefined;
      deck = undefined;
      continue;
    }
    if (!room) throw error(line, "Expected 'room <name>' before room properties");
    if (line.text.startsWith("background ")) {
      room.background = line.text.slice(11).trim();
      section = undefined;
      continue;
    }
    if (line.text.startsWith("light ")) {
      const light = line.text.slice(6).trim();
      if (!LIGHTS.includes(light as LightLevel)) throw error(line, "Unknown light level");
      room.light = light as LightLevel;
      section = undefined;
      continue;
    }
    if (line.text.startsWith("take ")) {
      const count = Number(line.text.slice(5));
      if (!Number.isInteger(count) || count < 0) throw error(line, "Take limit must be a non-negative integer");
      room.takeLimit = count;
      section = undefined;
      continue;
    }
    if (line.text.startsWith("escape ")) {
      room.escapeRoomId = slugify(line.text.slice(7).trim());
      section = undefined;
      continue;
    }
    if (["nadir", "equipped", "offered", "cards"].includes(line.text)) {
      section = line.text as Section;
      deck = undefined;
      continue;
    }
    if (line.text.startsWith("deck")) {
      const match = line.text.match(/^deck\s+(.+?)\s+(\d+(?:m|h))$/);
      if (!match) throw error(line, "Expected 'deck <name> <duration>'");
      deck = { name: match[1], baseMinutes: parseMinutes(match[2], line), cards: [] };
      room.decks.push(deck);
      section = "deck";
      continue;
    }
    if (!section) throw error(line, "Unexpected room property or missing list section");
    if (section === "equipped") {
      const slot = [...SLOTS].sort((a, b) => b.length - a.length)
        .find((candidate) => line.text.startsWith(`${candidate} `));
      if (!slot) throw error(line, "Equipped entry must begin with a known slot");
      const instanceLine = { ...line, text: line.text.slice(slot.length).trim() };
      room.equipped.push({ ...parseInstance(instanceLine, masters), slot });
    } else {
      const instance = parseInstance(line, masters);
      if (section === "nadir") room.nadir.push(instance);
      else if (section === "offered") room.offered.push(instance);
      else if (section === "cards") room.cards.push(instance);
      else deck!.cards.push(instance);
    }
  }

  if (!startRoomId) throw new Error("rooms.txt: missing 'start <room>'");
  if (!searchBack) throw new Error("rooms.txt: missing 'search-back <image path>'");
  for (const candidate of rooms) {
    if (!candidate.background) throw new Error(`rooms.txt: room "${candidate.name}" is missing a background`);
  }
  const ids = new Set(rooms.map((candidate) => candidate.id));
  if (!ids.has(startRoomId)) throw new Error(`rooms.txt: unknown start room "${startRoomId}"`);
  for (const candidate of rooms) {
    const destinations = [
      candidate.escapeRoomId,
      ...candidate.cards.map((card) => card.travel?.destinationRoomId),
      ...candidate.decks.flatMap((item) => item.cards.map((card) => card.travel?.destinationRoomId)),
    ].filter(Boolean) as string[];
    for (const destination of destinations) {
      if (!ids.has(destination)) throw new Error(`rooms.txt: room "${candidate.name}" references unknown destination "${destination}"`);
    }
  }
  return { startRoomId, searchBack, rooms };
}
