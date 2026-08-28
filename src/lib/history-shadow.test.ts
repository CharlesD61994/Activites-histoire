import { describe, expect, it } from "vitest";
import { historyBoxShadow, historyDropShadow, historyShadowColor } from "./history-shadow";

describe("history shadows", () => {
  it("creates a crisp lower-right shadow with color and opacity", () => {
    expect(historyShadowColor("#123f59", 0.8)).toBe("#123f59cc");
    expect(historyDropShadow("#123f59", 9, 0.8)).toBe("drop-shadow(9px 9px 0 #123f59cc)");
    expect(historyBoxShadow("#123f59", 9, 0.8)).toBe("9px 9px 0 #123f59cc");
  });
});
