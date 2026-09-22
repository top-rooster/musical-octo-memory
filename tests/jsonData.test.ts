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
    const deepLight = state.decks!.find((deck) => deck.owner.kind === "room" && deck.owner.id === "deep-tunnels")!.cards
      .find((card) => card.masterId === "flashlight")!;
    expect(openingLight.attributes).toContainEqual(expect.objectContaining({ id: "battery", value: 20 }));
    expect(deepLight.attributes).toContainEqual(expect.objectContaining({ id: "battery", value: 0 }));
    expect(state.cards.find((card) => card.masterId === "plastic-bottle" && card.offered)?.attributes)
      .toContainEqual({ kind: "marker", id: "contains-water" });
    expect(state.decks!.find((deck) => deck.owner.kind === "room" && deck.owner.id === "tunnels")!.cards
      .find((card) => card.masterId === "service-cabinet")?.attributes)
      .toContainEqual({ kind: "marker", id: "locked" });
    const route = state.cards.find((card) => card.masterId === "go-tunnels-from-office")!;
    expect(route.references).toEqual({ destination: "tunnels" });
    expect(route.attributes).toEqual(expect.arrayContaining([
      { kind: "marker", id: "path" },
      expect.objectContaining({ kind: "value", id: "travel-time", value: 15 }),
    ]));
    expect(state.decks!.find((deck) => deck.owner.kind === "room" && deck.owner.id === "tunnels")?.definitionId)
      .toBe("explore");
    const pants = CARD_MASTERS.find((master) => master.id === "pants")!;
    expect(pants.attributes).toEqual(expect.arrayContaining([
      { kind: "marker", id: "medium" },
      expect.objectContaining({ kind: "value", id: "storage-small", value: 2 }),
    ]));
    expect(pants.references).toEqual({ equip: "legs" });
  });

  it("loads Body's generic Actions and global-tick Process", () => {
    const body = CARD_MASTERS.find((master) => master.id === "body")!;
    expect(body.actions.map((action) => action.id)).toEqual(["travel", "eat", "drink"]);
    expect(body.actions.find((action) => action.id === "travel")).toMatchObject({
      applicable: { direction: "on", selector: { kind: "marker", target: "other", marker: "path" } },
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
    expect(cards["rat-meat"]).toMatchObject({ values: { "food-value": 15 } });
    expect(cards["rat-meat"].markers).toEqual(expect.arrayContaining(["small", "food"]));
    expect(cards["canned-food"]).toMatchObject({ values: { "food-value": 25 } });
    expect(cards["canned-food"].markers).toEqual(expect.arrayContaining(["medium", "food"]));
    expect(cards["plastic-bottle"]).toMatchObject({
      values: { "hydration-value": 25 },
    });
    expect(cards["plastic-bottle"].markers).toEqual(expect.arrayContaining(["medium", "container", "hydration"]));
    expect(cards["go-deep-tunnels"]).toMatchObject({
      markers: ["anchored", "path"],
      values: { "travel-time": 30 },
      references: { destination: "deep-tunnels" },
    });
  });

  it("migrates size, storage, and non-Hand equipment compatibility to attributes", () => {
    expect(cards.pants).toMatchObject({
      markers: ["medium"], values: { "storage-small": 2 }, references: { equip: "legs" },
    });
    expect(cards["t-shirt"]).toMatchObject({ markers: ["medium"], references: { equip: "chest" } });
    expect(cards["simple-backpack"]).toMatchObject({
      markers: ["medium"], values: { "storage-medium": 5 }, references: { equip: "back" },
    });
    expect(cards.glasses).toMatchObject({ markers: ["small"], references: { equip: "eyes" } });
    expect(cards.flashlight.markers).toContain("small");
    expect(cards["canned-food"].markers).toContain("medium");
    const text = JSON.stringify(cards);
    expect(text).not.toContain('"size":');
    expect(text).not.toContain('"storage":');
    expect(text).not.toContain('"equip":[');
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

  it("parses approved deck-size and time conditions through the shared model", () => {
    const authored = structuredClone(cards);
    authored["service-cabinet"].decks = {
      contents: { name: "Contents", time: "15m", cards: ["scrap-metal"] },
    };
    authored["service-cabinet"].processes = [{
      if: {
        and: [
          { time: { "=": "12:00" } },
          { deck_size: { "<=": 3 } },
        ],
      },
      effects: [{
        "add-random-card": { count: 2, from: ["scrap-metal", "pipe"], to: "self.deck" },
      }],
    }];
    expect(() => validateAuthoredData(authored, rooms, attributes)).not.toThrow();
  });

  it("rejects malformed supported time and add-random-card syntax", () => {
    const invalidTime = structuredClone(cards);
    invalidTime.body.actions[0].applicable.on = { time: { ">=": "24:00" } };
    expect(() => validateAuthoredData(invalidTime, rooms, attributes)).toThrow(/24-hour HH:MM/);

    const noDeck = structuredClone(cards);
    noDeck.body.actions[0].effects = [{
      "add-random-card": { count: 2, from: ["scrap-metal"], to: "self.deck" },
    }];
    expect(() => validateAuthoredData(noDeck, rooms, attributes)).toThrow(/exactly one deck/);

    const invalidCount = structuredClone(cards);
    invalidCount.body.actions[0].effects = [{
      "add-random-card": { count: 0, from: ["scrap-metal"], to: "self.deck" },
    }];
    expect(() => validateAuthoredData(invalidCount, rooms, attributes)).toThrow(/positive integer/);
  });

  it("uses passives and rejects the removed whileEquipped compatibility field", () => {
    expect(cards.glasses.passives).toEqual(expect.any(Array));
    expect(cards.flashlight.passives).toEqual(expect.any(Array));
    const legacy = structuredClone(cards);
    legacy.glasses.whileEquipped = [{ attribute: "vision", amount: 1 }];
    expect(() => validateAuthoredData(legacy, rooms, attributes)).toThrow(/removed legacy representation/);
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

  it("rejects legacy size, storage, and equipment representations", () => {
    for (const [field, value] of [
      ["size", "Small"],
      ["storage", { size: "Small", count: 2 }],
      ["equip", ["legs"]],
    ] as const) {
      const legacy = structuredClone(cards);
      legacy.pants[field] = value;
      expect(() => validateAuthoredData(legacy, rooms, attributes)).toThrow(/removed legacy representation/);
    }
  });

  it("rejects ambiguous size Markers and invalid equipment References", () => {
    const multipleSizes = structuredClone(cards);
    multipleSizes.flashlight.markers.push("medium");
    expect(() => validateAuthoredData(multipleSizes, rooms, attributes)).toThrow(/multiple size Markers/);

    const unknownSlot = structuredClone(cards);
    unknownSlot.pants.references.equip = "waist";
    expect(() => validateAuthoredData(unknownSlot, rooms, attributes)).toThrow(/unknown ID/);

    const handReference = structuredClone(cards);
    handReference.flashlight.references = { equip: "left-hand" };
    expect(() => validateAuthoredData(handReference, rooms, attributes)).toThrow(/non-Hand equipment slot/);
  });

  it("rejects invalid storage Values and incompatible authored starting equipment", () => {
    const invalidStorageId = structuredClone(cards);
    invalidStorageId.pants.values["storage-pocket"] = 2;
    expect(() => validateAuthoredData(invalidStorageId, rooms, attributes)).toThrow(/unknown ID/);

    const invalidStorageAmount = structuredClone(cards);
    invalidStorageAmount.pants.values["storage-small"] = -1;
    expect(() => validateAuthoredData(invalidStorageAmount, rooms, attributes)).toThrow(/non-negative integer/);

    const wrongStartingSlot = structuredClone(cards);
    wrongStartingSlot.pants.references.equip = "chest";
    expect(() => validateAuthoredData(wrongStartingSlot, rooms, attributes))
      .toThrow(/requires references\.equip = "legs"/);
  });

  it("rejects missing size data when a movable world instance needs carried legality", () => {
    const missing = structuredClone(cards);
    missing.flashlight.markers = [];
    expect(() => validateAuthoredData(missing, rooms, attributes)).toThrow(/exactly one authored size Marker/);
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
