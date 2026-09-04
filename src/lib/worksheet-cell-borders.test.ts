import { describe, expect, it } from "vitest";
import type { TreeAnalysisTable } from "@/types";
import { setWorksheetCellBorder, worksheetCellBorderStyle } from "./worksheet-cell-borders";

const table = (): TreeAnalysisTable => ({
  id: "table", x: 0, y: 0, rows: 2, columns: 2,
  cells: Array.from({ length: 4 }, () => ({ text: "", isCorrect: false, borderWidth: 1 }))
});

describe("worksheet cell borders", () => {
  it("removes a shared right border through the cell on its right", () => {
    const updated = setWorksheetCellBorder(table(), [0], "right", false);
    expect(worksheetCellBorderStyle(updated, 0).borderRightWidth).toBe(0);
    expect(worksheetCellBorderStyle(updated, 1).borderLeftWidth).toBe(0);
  });

  it("keeps the outer bottom border independently editable", () => {
    const updated = setWorksheetCellBorder(table(), [2], "bottom", false);
    expect(worksheetCellBorderStyle(updated, 2).borderBottomWidth).toBe(0);
    expect(worksheetCellBorderStyle(updated, 2).borderTopWidth).toBe(1);
  });

  it("draws an interior edge once and restores a previously borderless cell", () => {
    const original = table();
    expect(worksheetCellBorderStyle(original, 0).borderRightWidth + worksheetCellBorderStyle(original, 1).borderLeftWidth).toBe(1);
    original.cells[1].borderWidth = 0;
    const restored = setWorksheetCellBorder(original, [0], "right", true);
    expect(worksheetCellBorderStyle(restored, 1).borderLeftWidth).toBe(1);
  });
});
