import { describe, expect, it } from "vitest";
import { historyTextStyleToCss } from "./history-text-style";

describe("historyTextStyleToCss", () => {
  it("maps saved history text formatting to reader styles", () => {
    expect(historyTextStyleToCss({
      fontSize: 44,
      color: "#a1262d",
      bold: true,
      italic: true,
      underline: true,
      align: "center"
    })).toEqual({
      fontSize: "44px",
      color: "#a1262d",
      fontWeight: 800,
      fontStyle: "italic",
      textDecoration: "underline",
      textAlign: "center"
    });
  });
});
