import authoredCards from "../../data/cards.txt?raw";
import { parseCardMasters } from "./cardParser";

export const CARD_MASTER_SOURCE = "data/cards.txt";
export const CARD_MASTERS = parseCardMasters(authoredCards);
