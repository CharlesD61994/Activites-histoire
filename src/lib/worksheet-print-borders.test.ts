import { describe, expect, it } from "vitest";
import { worksheetPrintBorderStyles } from "./worksheet-print-borders";

describe("worksheet print borders", () => {
  it("prints four equally thick sides inside the original border box", () => {
    expect(worksheetPrintBorderStyles({ top: 1, right: 1, bottom: 1, left: 1 })).toEqual([
      { top: "-1px", left: "-1px", right: "-1px", height: "1px" },
      { top: "-1px", right: "-1px", bottom: "-1px", width: "1px" },
      { bottom: "-1px", left: "-1px", right: "-1px", height: "1px" },
      { top: "-1px", left: "-1px", bottom: "-1px", width: "1px" }
    ]);
  });

  it("does not restore removed sides or duplicate a shared edge", () => {
    expect(worksheetPrintBorderStyles({ top: 0, right: 0, bottom: 1, left: 0 })).toEqual([
      { bottom: "-1px", left: "0px", right: "0px", height: "1px" }
    ]);
    expect(worksheetPrintBorderStyles({ top: 0, right: 0, bottom: 0, left: 0 })).toEqual([]);
  });

  it("preserves intentionally different border weights", () => {
    expect(worksheetPrintBorderStyles({ top: 2, right: 3, bottom: 0, left: 1 })[1]).toEqual({
      top: "-2px", right: "-3px", bottom: "0px", width: "3px"
    });
  });
});
