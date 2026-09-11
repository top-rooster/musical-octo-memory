import authoredAttributes from "../../data/attributes.txt?raw";
import { parseAttributeDescriptions } from "./attributeParser";

export const ATTRIBUTE_DESCRIPTION_SOURCE = "data/attributes.txt";
export const ATTRIBUTE_DESCRIPTIONS = parseAttributeDescriptions(authoredAttributes);
