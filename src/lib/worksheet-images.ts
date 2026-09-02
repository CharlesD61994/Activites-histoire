import type { TreeAnalysisTable, TreeAnalysisTextBox, WorksheetImage } from "@/types";
import { normalizedRowHeights, worksheetTableWidth } from "./worksheet-tables";

// Rows use width-based units; page positions retain the legacy 1056 x 816 grid.
export const WORKSHEET_ROW_TO_PAGE_Y = 816 / 1056 * 8.5 / 11;

export function fitWorksheetDocumentImage(image: WorksheetImage, tables: TreeAnalysisTable[]): WorksheetImage {
  const table = tables.find((item) => item.id === image.documentTableId && item.kind === "document");
  if (!table) return image;
  const rows = normalizedRowHeights(table);
  return {
    ...image,
    x: table.x,
    y: table.y + (rows[0] ?? 42) * WORKSHEET_ROW_TO_PAGE_Y,
    width: worksheetTableWidth(table),
    height: (rows[1] ?? 120) * WORKSHEET_ROW_TO_PAGE_Y
  };
}

export type WorksheetTextWrap = {
  side: "left" | "right";
  width: number;
  height: number;
  marginTop: number;
};

export function worksheetTextWrap(
  box: TreeAnalysisTextBox,
  images: WorksheetImage[]
): WorksheetTextWrap | undefined {
  const image = images.find((candidate) => {
    const mode = candidate.layoutMode ?? (candidate.wrapText ? "wrap" : "front");
    if (mode !== "wrap" || candidate.pageId !== box.pageId) return false;
    return candidate.x < box.x + box.width &&
      candidate.x + candidate.width > box.x &&
      candidate.y < box.y + box.height &&
      candidate.y + candidate.height > box.y;
  });
  if (!image) return undefined;

  const side = image.x + image.width / 2 <= box.x + box.width / 2 ? "left" : "right";
  const overlapTop = Math.max(box.y, image.y);
  const overlapBottom = Math.min(box.y + box.height, image.y + image.height);
  // The editor renders the image as a draggable page element, then inserts a
  // float spacer inside the text box. A float can only reserve one side of the
  // line, so we reserve the side occupied by the image up to its far edge. This
  // keeps text from running under the image without creating a full-width blank
  // band when the image sits in the middle of a paragraph.
  const reservedWidth = side === "left"
    ? image.x + image.width - box.x
    : box.x + box.width - image.x;

  return {
    side,
    width: Math.max(0, Math.min(box.width, reservedWidth)) + 8,
    height: Math.max(0, image.y - box.y) + Math.max(0, overlapBottom - overlapTop) + 6,
    marginTop: Math.max(0, image.y - box.y)
  };
}
