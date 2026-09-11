import authoredRooms from "../../data/rooms.txt?raw";
import { CARD_MASTERS } from "./cardMasters";
import { parseRooms } from "./roomParser";

export const ROOM_SOURCE = "data/rooms.txt";
export const WORLD_DEFINITION = parseRooms(authoredRooms, CARD_MASTERS);
