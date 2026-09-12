import { AUTHORED_DATA } from "./authoredData";

export const ATTRIBUTE_DESCRIPTION_SOURCE = "data/attributes.json";
export const ATTRIBUTE_METADATA = AUTHORED_DATA.attributes;
export const ATTRIBUTE_DESCRIPTIONS = Object.fromEntries(
  Object.entries(ATTRIBUTE_METADATA).map(([id, metadata]) => [id, metadata.description]),
);
