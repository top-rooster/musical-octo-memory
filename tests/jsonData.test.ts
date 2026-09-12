import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATTRIBUTE_DESCRIPTION_SOURCE, ATTRIBUTE_METADATA } from "../src/data/attributeDescriptions";
import { CARD_MASTERS, CARD_MASTER_SOURCE } from "../src/data/cardMasters";
import { validateAuthoredData } from "../src/data/jsonValidation";
import { ROOM_SOURCE, WORLD_DEFINITION } from "../src/data/worldDefinition";
import { createWorldGameState } from "../src/game/world";

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

  it("creates independent overrides, decks, equipment, and card-authored travel", () => {
    const state = createWorldGameState(
      CARD_MASTERS, WORLD_DEFINITION, { x: 0, y: 0, width: 1400, height: 800 }, () => 0.5,
    );
    const openingLight = state.cards.find((card) => card.masterId === "flashlight" && card.offered)!;
    const deepLight = state.rooms!["deep-tunnels"].decks[0].cards
      .find((card) => card.masterId === "flashlight")!;
    expect(openingLight.attributes).toContainEqual(expect.objectContaining({ id: "battery", value: 20 }));
    expect(deepLight.attributes).toContainEqual(expect.objectContaining({ id: "battery", value: 0 }));
    expect(CARD_MASTERS.find((master) => master.id === "flashlight")?.attributes)
      .toContainEqual(expect.objectContaining({ id: "battery", value: 100 }));
    expect(state.cards.find((card) => card.masterId === "plastic-bottle" && card.offered)?.attributes)
      .toContainEqual({ kind: "marker", id: "contains-water" });
    expect(state.rooms!.tunnels.decks[0].cards.find((card) => card.masterId === "service-cabinet")?.attributes)
      .toContainEqual({ kind: "marker", id: "locked" });
    expect(state.cards.find((card) => card.masterId === "go-tunnels-from-office")?.travel)
      .toEqual({ acceptedCardId: "body", destinationRoomId: "tunnels", baseMinutes: 15 });
    expect(CARD_MASTERS.find((master) => master.id === "go-tunnels-from-deep-tunnels")?.accept[0])
      .toMatchObject({ card: "body", action: { baseMinutes: 30, effects: [{ go: "tunnels" }] } });
    expect(WORLD_DEFINITION.rooms.find((room) => room.id === "tunnels")?.decks[0].id).toBe("explore");
    expect(state.rooms!.tunnels.decks[0].definitionId).toBe("explore");
    expect(CARD_MASTERS.find((master) => master.id === "pants")?.storage).toEqual({ size: "Small", count: 2, phase: undefined });
    expect(state.cards.find((card) => card.masterId === "pants")?.equipmentSlot).toBe("legs");
    expect(CARD_MASTERS.find((master) => master.id === "body")?.processes[0])
      .toMatchObject({ interval: "15m", intervalMinutes: 15, effects: [{ change: "hydration", amount: -2 }] });
    expect(CARD_MASTERS.find((master) => master.id === "body")?.when.map((condition) => condition.value))
      .toEqual(["hydration", "satiation"]);
    expect(CARD_MASTERS.find((master) => master.id === "puddle-of-water")?.attributes)
      .toContainEqual(expect.objectContaining({ kind: "value", id: "water", value: 3 }));
  });

  it("has no legacy TXT authored-data path", () => {
    for (const file of ["cards.txt", "rooms.txt", "attributes.txt"]) {
      expect(existsSync(new URL(`../data/${file}`, import.meta.url))).toBe(false);
    }
  });

  it("allows duplicate display names while IDs remain distinct", () => {
    const masters = cards as Record<string, { name: string }>;
    expect(masters["go-tunnels-from-office"].name).toBe("Go to tunnels");
    expect(masters["go-tunnels-from-deep-tunnels"].name).toBe("Go to tunnels");
    expect(Object.keys(masters)).toHaveLength(new Set(Object.keys(masters)).size);
  });

  it("authors ingestion on Body as the receiver", () => {
    const masters = cards as Record<string, any>;
    expect(masters["rat-meat"].accept).toBeUndefined();
    expect(masters["canned-food"].accept).toBeUndefined();
    expect(masters["rotten-meat"].accept).toBeUndefined();
    expect(masters["plastic-bottle"].accept).toBeUndefined();

    expect(masters.body.accept).toEqual(expect.arrayContaining([
      expect.objectContaining({
        card: "rat-meat",
        action: expect.objectContaining({
          name: "Eat",
          effects: expect.arrayContaining([
            { change: "satiation", target: "receiver", amount: 15 },
            { discard: "source" },
          ]),
        }),
      }),
      expect.objectContaining({
        card: "plastic-bottle",
        markers: ["contains-water"],
        action: expect.objectContaining({ name: "Drink" }),
      }),
    ]));
  });

  it("rejects self-process and threshold Values missing from their card", () => {
    const invalidProcess = structuredClone(cards) as any;
    invalidProcess.body.processes[0].effects[0].change = "vision";
    expect(() => validateAuthoredData(invalidProcess, rooms, attributes)).toThrow(/not present on this card/);

    const invalidThreshold = structuredClone(cards) as any;
    invalidThreshold.body.when[0].value = "vision";
    expect(() => validateAuthoredData(invalidThreshold, rooms, attributes)).toThrow(/not present on this card/);
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

    const invalidNadir = structuredClone(rooms) as any;
    invalidNadir.nadir[0] = "missing-card";
    expect(() => validateAuthoredData(cards, invalidNadir, attributes)).toThrow(/unknown ID/);
  });

  it("rejects unsupported discard targets", () => {
    const invalidDiscard = structuredClone(cards) as any;
    invalidDiscard.body.accept[0].action.effects[1].discard = "self";
    expect(() => validateAuthoredData(invalidDiscard, rooms, attributes)).toThrow(/source.*receiver/);
  });
});
