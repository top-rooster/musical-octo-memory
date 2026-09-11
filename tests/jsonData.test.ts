import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateAuthoredData } from "../src/data/jsonValidation";

function load(path: string): unknown {
  return JSON.parse(readFileSync(new URL(`../data/${path}`, import.meta.url), "utf8"));
}

describe("JSON authored data migration", () => {
  const cards = load("cards.json");
  const rooms = load("rooms.json");
  const attributes = load("attributes.json");

  it("parses and passes cross-file schema validation", () => {
    expect(() => validateAuthoredData(cards, rooms, attributes)).not.toThrow();
  });

  it("allows duplicate display names while IDs remain distinct", () => {
    const masters = cards as Record<string, { name: string }>;
    expect(masters["go-tunnels-from-office"].name).toBe("Go to tunnels");
    expect(masters["go-tunnels-from-deep-tunnels"].name).toBe("Go to tunnels");
    expect(Object.keys(masters)).toHaveLength(new Set(Object.keys(masters)).size);
  });

  it("rejects unknown instance cards and invalid Value overrides", () => {
    const invalidCard = structuredClone(rooms) as any;
    invalidCard.rooms.tunnels.cards = ["missing-card"];
    expect(() => validateAuthoredData(cards, invalidCard, attributes)).toThrow(/unknown ID/);

    const invalidValue = structuredClone(rooms) as any;
    invalidValue.rooms["deep-tunnels"].decks.search.cards[0].values.fuel = 10;
    expect(() => validateAuthoredData(cards, invalidValue, attributes)).toThrow(/does not exist on master/);
  });

  it("rejects unknown Marker and room references", () => {
    const invalidMarker = structuredClone(rooms) as any;
    invalidMarker.rooms.tunnels.decks.explore.cards[0] = { card: "scrap-metal", markers: ["unknown"] };
    expect(() => validateAuthoredData(cards, invalidMarker, attributes)).toThrow(/unknown ID/);

    const invalidRoom = structuredClone(rooms) as any;
    invalidRoom.start = "missing-room";
    expect(() => validateAuthoredData(cards, invalidRoom, attributes)).toThrow(/unknown ID/);
  });
});
