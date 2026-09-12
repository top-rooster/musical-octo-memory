import authoredAttributes from "../../data/attributes.json";
import authoredCards from "../../data/cards.json";
import authoredRooms from "../../data/rooms.json";
import { loadAuthoredData } from "./jsonLoader";

export const AUTHORED_DATA = loadAuthoredData(authoredCards, authoredRooms, authoredAttributes);
