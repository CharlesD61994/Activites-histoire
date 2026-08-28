import { describe, expect, it } from "vitest";
import { autoFullscreenFromStoredValue } from "./reader-preferences";

describe("reader preferences", () => {
  it("enables automatic fullscreen by default", () => {
    expect(autoFullscreenFromStoredValue(null)).toBe(true);
    expect(autoFullscreenFromStoredValue("true")).toBe(true);
    expect(autoFullscreenFromStoredValue("false")).toBe(false);
  });
});
