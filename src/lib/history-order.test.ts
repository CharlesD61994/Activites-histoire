import { describe, expect, it } from "vitest";
import { reorderHistoryEvents } from "./history-order";

describe("chronological card ordering", () => {
  it("inserts a card at its destination in either direction", () => {
    expect(reorderHistoryEvents(["a", "b", "c"], "a", "c", new Set())).toEqual(["b", "c", "a"]);
    expect(reorderHistoryEvents(["a", "b", "c"], "c", "a", new Set())).toEqual(["c", "a", "b"]);
  });
  it("keeps earned cards in their exact positions when crossing them", () => {
    expect(reorderHistoryEvents(["a", "b", "c", "d"], "d", "a", new Set(["b"]))).toEqual(["d", "b", "a", "c"]);
  });
  it("rejects a locked source, locked destination, or unknown card", () => {
    const order = ["a", "b", "c"];
    for (const [from, to] of [["b", "a"], ["a", "b"], ["missing", "c"]]) {
      expect(reorderHistoryEvents(order, from, to, new Set(["b"]))).toBe(order);
    }
  });
});
