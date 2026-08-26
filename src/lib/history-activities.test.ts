import { describe, expect, it } from "vitest";
import { getInitialHistoryAction } from "./history-activities";

describe("getInitialHistoryAction", () => {
  it("preserves a saved short-answer activity", () => {
    expect(getInitialHistoryAction("establish_facts", "short_text")).toBe("short_text");
  });

  it("falls back only when the saved action is not allowed", () => {
    expect(getInitialHistoryAction("causes_consequences", "short_text")).toBe("classification");
  });
});
