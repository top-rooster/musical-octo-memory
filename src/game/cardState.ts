import type { CardInstance, CardMaster, ValueAttribute } from "../domain/types";

export function hasMarker(
  card: Pick<CardInstance | CardMaster, "attributes">,
  id: string,
): boolean {
  return card.attributes.some(
    (attribute) => attribute.kind === "marker" && attribute.id === id,
  );
}

export function isAnchored(
  card: Pick<CardInstance | CardMaster, "attributes">,
): boolean {
  return hasMarker(card, "anchored");
}

export function getValue(
  card: Pick<CardInstance, "attributes">,
  id: string,
): ValueAttribute | undefined {
  return card.attributes.find(
    (attribute): attribute is ValueAttribute =>
      attribute.kind === "value" && attribute.id === id,
  );
}

export function clampValue(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}
