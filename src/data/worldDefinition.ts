import type { CardAttribute, DeckDefinition, EquipmentSlot, LightLevel } from "../domain/types";
import { AUTHORED_DATA } from "./authoredData";

export interface CardInstanceDefinition {
  masterId: string;
  attributes: CardAttribute[];
  references: Record<string, string>;
}
export interface EquippedDefinition extends CardInstanceDefinition { slot: EquipmentSlot; }
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

export const ROOM_SOURCE = "data/rooms.json";
export const WORLD_DEFINITION = AUTHORED_DATA.world;
