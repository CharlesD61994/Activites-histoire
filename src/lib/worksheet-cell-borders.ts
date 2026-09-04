import type { TreeAnalysisTable, TreeAnalysisTableCell } from "@/types";

export type WorksheetCellBorderSide = "top" | "right" | "bottom" | "left";

const borderKey: Record<WorksheetCellBorderSide, keyof Pick<TreeAnalysisTableCell, "borderTop" | "borderRight" | "borderBottom" | "borderLeft">> = {
  top: "borderTop",
  right: "borderRight",
  bottom: "borderBottom",
  left: "borderLeft"
};

function width(cell: TreeAnalysisTableCell, side: WorksheetCellBorderSide) {
  return cell[borderKey[side]] ?? cell.borderWidth ?? 1;
}

function neighborIndex(table: TreeAnalysisTable, index: number, side: WorksheetCellBorderSide) {
  const row = Math.floor(index / table.columns);
  const column = index % table.columns;
  if (side === "top") return row > 0 ? index - table.columns : undefined;
  if (side === "bottom") return row < table.rows - 1 ? index + table.columns : undefined;
  if (side === "left") return column > 0 ? index - 1 : undefined;
  return column < table.columns - 1 ? index + 1 : undefined;
}

export function worksheetCellBorderWidth(table: TreeAnalysisTable, index: number, side: WorksheetCellBorderSide) {
  const cell = table.cells[index];
  if (!cell) return 0;
  if (side === "top" || side === "left") return width(cell, side);
  const neighbor = neighborIndex(table, index, side);
  if (neighbor === undefined) return width(cell, side);
  return width(table.cells[neighbor], side === "right" ? "left" : "top");
}

export function worksheetCellBorderStyle(table: TreeAnalysisTable, index: number) {
  return {
    borderTopWidth: worksheetCellBorderWidth(table, index, "top"),
    borderRightWidth: worksheetCellBorderWidth(table, index, "right"),
    borderBottomWidth: worksheetCellBorderWidth(table, index, "bottom"),
    borderLeftWidth: worksheetCellBorderWidth(table, index, "left")
  };
}

export function setWorksheetCellBorder(table: TreeAnalysisTable, indexes: number[], side: WorksheetCellBorderSide, enabled: boolean) {
  const cells = table.cells.map((cell) => ({ ...cell }));
  for (const index of indexes) {
    const cell = cells[index];
    if (!cell) continue;
    const target = side === "bottom" || side === "right" ? neighborIndex(table, index, side) : undefined;
    const targetIndex = target ?? index;
    const targetSide: WorksheetCellBorderSide = side === "bottom" && target !== undefined ? "top" : side === "right" && target !== undefined ? "left" : side;
    const targetCell = cells[targetIndex];
    targetCell[borderKey[targetSide]] = enabled ? (targetCell.borderWidth ?? cell.borderWidth ?? 1) : 0;
  }
  return { ...table, cells };
}
