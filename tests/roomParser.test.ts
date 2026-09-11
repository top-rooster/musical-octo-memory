import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { parseRooms } from "../src/data/roomParser";
import { ROOM_SOURCE, WORLD_DEFINITION } from "../src/data/worldDefinition";

describe("authored room data", () => {
  it("loads the runtime world from data/rooms.txt", () => {
    const source = readFileSync(new URL("../data/rooms.txt", import.meta.url), "utf8");
    expect(ROOM_SOURCE).toBe("data/rooms.txt");
    expect(WORLD_DEFINITION).toEqual(parseRooms(source, CARD_MASTERS));
    expect(WORLD_DEFINITION.startRoomId).toBe("opening-room");
    expect(WORLD_DEFINITION.rooms.map((room) => room.name)).toEqual([
      "Opening Room", "Tunnels", "Abandoned Office", "Deep Tunnels",
    ]);
  });

  it("parses authored instance Marker, Value, travel, and Search duration overrides", () => {
    const opening = WORLD_DEFINITION.rooms[0];
    expect(opening.offered.find((card) => card.masterId === "flashlight")?.attributes)
      .toContainEqual(expect.objectContaining({ kind: "value", name: "Battery", value: 20 }));
    expect(opening.offered.find((card) => card.masterId === "plastic-bottle")?.attributes)
      .toContainEqual({ kind: "marker", name: "Contains-Water" });
    const tunnels = WORLD_DEFINITION.rooms.find((room) => room.id === "tunnels")!;
    expect(tunnels.decks[0].baseMinutes).toBe(15);
    expect(tunnels.decks[0].cards.find((card) => card.masterId === "go-to-deep-tunnels")?.travel)
      .toEqual({ destinationRoomId: "deep-tunnels", baseMinutes: 30 });
  });

  it("fails clearly on malformed supported room syntax", () => {
    expect(() => parseRooms(
      "start Room\nsearch-back images/back.png\nroom Room\nbackground images/r.png\nlight Bright\ndeck Search\nBody",
      CARD_MASTERS,
    )).toThrow(/rooms\.txt line 6.*deck <name> <duration>/);
    expect(() => parseRooms(
      "start Room\nsearch-back images/back.png\nroom Room\nbackground images/r.png\nlight Murky",
      CARD_MASTERS,
    )).toThrow(/Unknown light level/);
  });
});
