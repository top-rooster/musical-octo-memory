import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATTRIBUTE_DESCRIPTION_SOURCE, ATTRIBUTE_METADATA } from "../src/data/attributeDescriptions";
import { CARD_MASTERS, CARD_MASTER_SOURCE } from "../src/data/cardMasters";
import { validateAuthoredData } from "../src/data/jsonValidation";
import { ROOM_SOURCE, WORLD_DEFINITION } from "../src/data/worldDefinition";
import { createWorldGameState } from "../src/game/world";

function load(path: string): any {
  return JSON.parse(readFileSync(new URL(`../data/${path}`, import.meta.url), "utf8"));
}

describe("JSON authored Action data", () => {
  const cards = load("cards.json");
  const rooms = load("rooms.json");
  const attributes = load("attributes.json");

  it("parses and passes cross-file schema validation", () => {
    expect(() => validateAuthoredData(cards, rooms, attributes)).not.toThrow();
  });

  it("loads typed runtime data exclusively from JSON with stable IDs", () => {
    expect(CARD_MASTER_SOURCE).toBe("data/cards.json");
    expect(ROOM_SOURCE).toBe("data/rooms.json");
    expect(ATTRIBUTE_DESCRIPTION_SOURCE).toBe("data/attributes.json");
    expect(CARD_MASTERS.find((master) => master.id === "body")?.title).toBe("Body");
    expect(CARD_MASTERS.find((master) => master.id === "body")?.attributes)
      .toContainEqual(expect.objectContaining({ kind: "value", id: "hydration", value: 50 }));
    expect(ATTRIBUTE_METADATA.hydration.name).toBe("Hydration");
    expect(WORLD_DEFINITION.rooms.find((room) => room.id === "deep-tunnels")?.name).toBe("Deep Tunnels");
  });

  it("creates independent overrides, decks, equipment, and References", () => {
    const state = createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, { x: 0, y: 0, width: 1400, height: 800 }, () => 0.5,
    );
    const openingLight = state.cards.find((card) => card.masterId === "flashlight" && card.offered)!;
    const deepLight = state.rooms!["deep-tunnels"].decks[0].cards
      .find((card) => card.masterId === "flashlight")!;
    expect(openingLight.attributes).toContainEqual(expect.objectContaining({ id: "battery", value: 20 }));
    expect(deepLight.attributes).toContainEqual(expect.objectContaining({ id: "battery", value: 0 }));
    expect(state.cards.find((card) => card.masterId === "plastic-bottle" && card.offered)?.attributes)
      .toContainEqual({ kind: "marker", id: "contains-water" });
    expect(state.rooms!.tunnels.decks[0].cards.find((card) => card.masterId === "service-cabinet")?.attributes)
      .toContainEqual({ kind: "marker", id: "locked" });
    const route = state.cards.find((card) => card.masterId === "go-tunnels-from-office")!;
    expect(route.references).toEqual({ destination: "tunnels" });
    expect(route.attributes).toEqual(expect.arrayContaining([
      { kind: "marker", id: "path" },
      expect.objectContaining({ kind: "value", id: "travel-time", value: 15 }),
    ]));
    expect(state.rooms!.tunnels.decks[0].definitionId).toBe("explore");
    expect(CARD_MASTERS.find((master) => master.id === "pants")?.storage)
      .toEqual({ size: "Small", count: 2, phase: undefined });
  });

  it("loads Body's generic Actions and global-tick Process", () => {
    const body = CARD_MASTERS.find((master) => master.id === "body")!;
    expect(body.actions.map((action) => action.id)).toEqual(["travel", "eat", "drink"]);
    expect(body.actions.find((action) => action.id === "travel")).toMatchObject({
      applicable: { direction: "on", selector: { kind: "marker", marker: "path" } },
      effects: [
        { kind: "spend-time", operand: { target: "other", value: "travel-time" } },
        { kind: "set-room", target: "other", reference: "destination" },
      ],
    });
    expect(body.processes).toEqual([{
      effects: [
        { kind: "value", target: "self", value: "hydration", operator: "-=", operand: 2 },
        { kind: "value", target: "self", value: "satiation", operator: "-=", operand: 1 },
      ],
    }]);
  });

  it("migrates food, hydration, and path to Markers, Values, and References", () => {
    expect(cards["rat-meat"]).toMatchObject({ markers: ["food"], values: { "food-value": 15 } });
    expect(cards["canned-food"]).toMatchObject({ markers: ["food"], values: { "food-value": 25 } });
    expect(cards["plastic-bottle"]).toMatchObject({
      markers: ["container", "hydration"], values: { "hydration-value": 25 },
    });
    expect(cards["go-deep-tunnels"]).toMatchObject({
      markers: ["anchored", "path"],
      values: { "travel-time": 30 },
      references: { destination: "deep-tunnels" },
    });
  });

  it("removes legacy Action, duration, threshold, and interval representations", () => {
    const text = JSON.stringify(cards);
    expect(text).not.toContain('"accept"');
    expect(text).not.toContain('"when"');
    expect(text).not.toContain('"interval"');
    expect(text).not.toContain('"gameOver"');
    expect(text).not.toContain('"target":"source"');
    expect(text).not.toContain('"target":"receiver"');
  });

  it("has no legacy TXT authored-data path", () => {
    for (const file of ["cards.txt", "rooms.txt", "attributes.txt"]) {
      expect(existsSync(new URL(`../data/${file}`, import.meta.url))).toBe(false);
    }
  });

  it("allows duplicate display names while IDs remain distinct", () => {
    expect(cards["go-tunnels-from-office"].name).toBe("Go to tunnels");
    expect(cards["go-tunnels-from-deep-tunnels"].name).toBe("Go to tunnels");
    expect(Object.keys(cards)).toHaveLength(new Set(Object.keys(cards)).size);
  });

  it("rejects malformed and ambiguous Value selectors", () => {
    const invalid = structuredClone(cards);
    invalid.body.actions[0].applicable.on = { value: "travel-time", ">": 0, "<": 100 };
    expect(() => validateAuthoredData(invalid, rooms, attributes)).toThrow(/exactly one comparison/);
  });

  it("rejects card-ID selectors and invalid applicability direction", () => {
    const cardSelector = structuredClone(cards);
    cardSelector.body.actions[0].applicable.on = { card: "go-deep-tunnels" };
    expect(() => validateAuthoredData(cardSelector, rooms, attributes)).toThrow(/card-ID matching is unsupported/);

    const bothDirections = structuredClone(cards);
    bothDirections.body.actions[0].applicable.receive = { marker: "path" };
    expect(() => validateAuthoredData(bothDirections, rooms, attributes)).toThrow(/exactly one of on or receive/);
  });

  it("rejects legacy accept and accepted/received effect targets", () => {
    const legacy = structuredClone(cards);
    legacy.body.accept = [];
    expect(() => validateAuthoredData(legacy, rooms, attributes)).toThrow(/removed legacy/);

    const oldTarget = structuredClone(cards);
    oldTarget.body.actions[1].effects[1].target = "received";
    expect(() => validateAuthoredData(oldTarget, rooms, attributes)).toThrow(/self.*other/);
  });

  it("rejects duplicate Action IDs and readily detectable overlapping selectors", () => {
    const duplicateId = structuredClone(cards);
    duplicateId.body.actions[1].id = "travel";
    expect(() => validateAuthoredData(duplicateId, rooms, attributes)).toThrow(/duplicates Action ID/);

    const overlap = structuredClone(cards);
    overlap.body.actions.push(structuredClone(overlap.body.actions[1]));
    overlap.body.actions.at(-1).id = "eat-again";
    expect(() => validateAuthoredData(overlap, rooms, attributes)).toThrow(/overlapping selector/);
  });

  it("rejects unknown instance cards, Value overrides, Markers, and Room References", () => {
    const invalidCard = structuredClone(rooms);
    invalidCard.rooms.tunnels.cards = ["missing-card"];
    expect(() => validateAuthoredData(cards, invalidCard, attributes)).toThrow(/unknown ID/);

    const invalidValue = structuredClone(rooms);
    invalidValue.rooms["deep-tunnels"].decks.search.cards[0].values.fuel = 10;
    expect(() => validateAuthoredData(cards, invalidValue, attributes)).toThrow(/does not exist on master/);

    const invalidMarker = structuredClone(rooms);
    invalidMarker.rooms.tunnels.decks.explore.cards[0] = { card: "scrap-metal", markers: ["unknown"] };
    expect(() => validateAuthoredData(cards, invalidMarker, attributes)).toThrow(/unknown ID/);

    const invalidReference = structuredClone(cards);
    invalidReference["go-deep-tunnels"].references.destination = "missing-room";
    expect(() => validateAuthoredData(invalidReference, rooms, attributes)).toThrow(/unknown ID/);
  });
});
