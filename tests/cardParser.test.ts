import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CARD_MASTERS, CARD_MASTER_SOURCE } from "../src/data/cardMasters";
import { parseCardMasters } from "../src/data/cardParser";

describe("authored card data", () => {
  it("loads the runtime card masters from data/cards.txt", () => {
    const authoredText = readFileSync(new URL("../data/cards.txt", import.meta.url), "utf8");
    expect(CARD_MASTER_SOURCE).toBe("data/cards.txt");
    expect(CARD_MASTERS).toEqual(parseCardMasters(authoredText));
    expect(CARD_MASTERS.length).toBeGreaterThan(0);
  });

  it("recognizes Rat Meat eating Body from authored data", () => {
    const ratMeat = CARD_MASTERS.find((master) => master.title === "Rat Meat");
    expect(ratMeat?.interactions).toEqual([
      {
        kind: "eat",
        targetTitle: "Body",
        effects: [
          { kind: "change-value", attribute: "Satiation", amount: 15, recipient: "target" },
          { kind: "consume-source" },
        ],
      },
    ]);
  });

  it("recognizes Canned Food eating Body from authored data", () => {
    const cannedFood = CARD_MASTERS.find((master) => master.title === "Canned Food");
    expect(cannedFood?.interactions[0]?.targetTitle).toBe("Body");
    expect(cannedFood?.interactions[0]?.effects).toContainEqual({
      kind: "change-value",
      attribute: "Satiation",
      amount: 25,
      recipient: "target",
    });
  });

  it("does not give a movable non-food card a Body interaction", () => {
    const ratSkin = CARD_MASTERS.find((master) => master.title === "Rat Skin");
    expect(ratSkin?.interactions).toEqual([]);
  });

  it("fails clearly on malformed supported eating syntax", () => {
    expect(() =>
      parseCardMasters("Food\nimages/food.png\neat Body\nSatiation plenty target\nconsume self"),
    ).toThrow(/signed integer/);
  });
});
