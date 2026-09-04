import { describe, expect, it } from "vitest";
import { resizeWorksheetText } from "./worksheet-text-resize";

describe("resizeWorksheetText", () => {
  const frame = { x: 200, y: 200, width: 300, height: 60 };
  it.each(["e", "w", "n", "s"] as const)("shrinks the %s side while keeping the opposite edge fixed", (handle) => {
    const result = resizeWorksheetText(frame, handle, handle === "w" ? 30 : -30, handle === "n" ? 10 : -10);
    if (handle === "e" || handle === "w") {
      expect(result.width).toBe(270);
      expect(result.height).toBe(60);
      expect(handle === "w" ? result.x + result.width : result.x).toBe(handle === "w" ? 500 : 200);
    } else {
      expect(result.height).toBe(50);
      expect(result.width).toBe(300);
      expect(handle === "n" ? result.y + result.height : result.y).toBe(handle === "n" ? 260 : 200);
    }
  });
  it.each(["ne", "nw", "se", "sw"] as const)("preserves proportions and the opposite corner from %s", (handle) => {
    const result = resizeWorksheetText(frame, handle, handle.includes("w") ? 60 : -60, handle.includes("n") ? 12 : -12);
    expect(result.width).toBeCloseTo(240);
    expect(result.height).toBeCloseTo(48);
    expect(result.width / result.height).toBeCloseTo(frame.width / frame.height);
    expect(handle.includes("w") ? result.x + result.width : result.x).toBe(handle.includes("w") ? 500 : 200);
    expect(handle.includes("n") ? result.y + result.height : result.y).toBe(handle.includes("n") ? 260 : 200);
  });
  it("keeps proportional resizing within the page and minimum dimensions", () => {
    const large = resizeWorksheetText(frame, "nw", -2000, -2000);
    expect(large.x).toBeGreaterThanOrEqual(0);
    expect(large.y).toBeGreaterThanOrEqual(0);
    expect(large.width / large.height).toBeCloseTo(5);
    const small = resizeWorksheetText(frame, "se", -2000, -2000);
    expect(small.width).toBeGreaterThanOrEqual(80);
    expect(small.height).toBeGreaterThanOrEqual(24);
    expect(small.width / small.height).toBeCloseTo(5);
  });
});
