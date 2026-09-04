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
  const rowSpan = Math.max(1, table.cells[index]?.rowSpan ?? 1);
  const columnSpan = Math.max(1, table.cells[index]?.columnSpan ?? 1);
  if (side === "top") return row > 0 ? index - table.columns : undefined;
  if (side === "bottom") return row + rowSpan < table.rows ? index + table.columns * rowSpan : undefined;
  if (side === "left") return column > 0 ? index - 1 : undefined;
  return column + columnSpan < table.columns ? index + columnSpan : undefined;
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
  const cell = table.cells[index];
  const lastRow = Math.floor(index / table.columns) + (cell?.rowSpan ?? 1) >= table.rows;
  const lastColumn = index % table.columns + (cell?.columnSpan ?? 1) >= table.columns;
  return {
    borderStyle: "solid" as const,
    borderTopWidth: worksheetCellBorderWidth(table, index, "top"),
    borderRightWidth: lastColumn ? worksheetCellBorderWidth(table, index, "right") : 0,
    borderBottomWidth: lastRow ? worksheetCellBorderWidth(table, index, "bottom") : 0,
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
    targetCell[borderKey[targetSide]] = enabled ? Math.max(1, targetCell.borderWidth ?? cell.borderWidth ?? 1) as 1 | 2 | 3 : 0;
  }
  return { ...table, cells };
}
