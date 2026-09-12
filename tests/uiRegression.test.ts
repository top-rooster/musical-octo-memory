import { describe, expect, it } from "vitest";
import { CARD_HEIGHT, CARD_WIDTH } from "../src/game/constants";
import { clientBoxFromMetrics } from "../src/game/geometry";
import { CARD_MASTERS } from "../src/data/cardMasters";
import { ATTRIBUTE_DESCRIPTIONS, ATTRIBUTE_DESCRIPTION_SOURCE } from "../src/data/attributeDescriptions";
import { MISSING_DESCRIPTION } from "../src/components/InspectionTooltip";

describe("issues #2–#5 regression coverage", () => {
  it("uses the client box rather than the border box for zone coordinates", () => {
    expect(clientBoxFromMetrics({
      rectLeft: 100, rectTop: 200, clientLeft: 3, clientTop: 4,
      clientWidth: 600, clientHeight: 300,
    })).toEqual({ x: 103, y: 204, width: 600, height: 300 });
  });

  it("keeps card width and exposes a square artwork area through increased height", () => {
    expect(CARD_WIDTH).toBe(120);
    expect(CARD_HEIGHT).toBe(196);
  });

  it("loads authored card descriptions", () => {
    expect(CARD_MASTERS.find((master) => master.id === "body")?.description)
      .toBe("Nadir's physical condition and basic survival needs.");
  });

  it("loads shared attribute descriptions and uses the exact missing fallback", () => {
    expect(ATTRIBUTE_DESCRIPTION_SOURCE).toBe("data/attributes.json");
    expect(ATTRIBUTE_DESCRIPTIONS.satiation).toMatch(/well fed/i);
    expect(MISSING_DESCRIPTION).toBe("missing description");
  });
});
