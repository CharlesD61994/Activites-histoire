import { describe, expect, it } from "vitest";
import type { TreeAnalysisTable, TreeAnalysisTextBox, WorksheetImage } from "@/types";
import { fitWorksheetDocumentImage, worksheetTextWrap } from "./worksheet-images";

const box: TreeAnalysisTextBox = {
  id: "text",
  pageId: "page",
  x: 100,
  y: 100,
  width: 500,
  height: 240,
  text: "Un texte",
  fontSize: 20,
  annotations: []
};

describe("fitWorksheetDocumentImage", () => {
  const image: WorksheetImage = { id: "image", pageId: "page", x: 0, y: 0, width: 100, height: 100, src: "test.png", alt: "", wrapText: false, documentTableId: "document" };
  const table: TreeAnalysisTable = { id: "document", pageId: "page", kind: "document", x: 150, y: 220, width: 300, rows: 3, columns: 1, rowHeights: [40, 180, 30], cells: [] };

  it("fits the image to the middle row in portrait page coordinates", () => {
    const frame = fitWorksheetDocumentImage(image, [table]);
    const pageWidth = 1056;
    const pageHeight = pageWidth * 11 / 8.5;
    expect(frame.x).toBe(table.x);
    expect(frame.width).toBe(table.width);
    expect((frame.y - table.y) / 816 * pageHeight).toBeCloseTo(40);
    expect(frame.height / 816 * pageHeight).toBeCloseTo(180);
  });

  it("follows a document after shrinking and moving it", () => {
    const small = fitWorksheetDocumentImage(image, [{ ...table, x: 180, y: 250, width: 140, rowHeights: [20, 90, 15] }]);
    const original = fitWorksheetDocumentImage(image, [table]);
    expect(small.x).toBe(180);
    expect(small.width).toBe(140);
    expect(small.height).toBeCloseTo(original.height / 2);
    expect(small.y - 250).toBeCloseTo((original.y - 220) / 2);
  });

  it("preserves standalone images and missing document links", () => {
    expect(fitWorksheetDocumentImage(image, [])).toBe(image);
    const standalone = { ...image, documentTableId: undefined };
    expect(fitWorksheetDocumentImage(standalone, [table])).toBe(standalone);
  });
});

describe("worksheetTextWrap", () => {
  it("reserves the left side up to the far edge of an image placed inside the text box", () => {
    const image: WorksheetImage = { id: "image", pageId: "page", x: 120, y: 130, width: 140, height: 100, src: "data:image/png;base64,x", alt: "", wrapText: true };
    expect(worksheetTextWrap(box, [image])).toEqual({ side: "left", width: 168, height: 136, marginTop: 30 });
  });

  it("reserves the right side up to the near edge of an image placed inside the text box", () => {
    const image: WorksheetImage = { id: "image", pageId: "page", x: 430, y: 130, width: 100, height: 100, src: "data:image/png;base64,x", alt: "", wrapText: true };
    expect(worksheetTextWrap(box, [image])).toEqual({ side: "right", width: 178, height: 136, marginTop: 30 });
  });

  it("ignores images on another page or with wrapping disabled", () => {
    const image: WorksheetImage = { id: "image", pageId: "other", x: 120, y: 130, width: 140, height: 100, src: "data:image/png;base64,x", alt: "", wrapText: true };
    expect(worksheetTextWrap(box, [image])).toBeUndefined();
    expect(worksheetTextWrap(box, [{ ...image, pageId: "page", wrapText: false }])).toBeUndefined();
  });

  it("uses the explicit layout mode for new worksheet images", () => {
    const image: WorksheetImage = { id: "image", pageId: "page", x: 120, y: 130, width: 140, height: 100, src: "data:image/png;base64,x", alt: "", wrapText: true, layoutMode: "front" };
    expect(worksheetTextWrap(box, [image])).toBeUndefined();
    expect(worksheetTextWrap(box, [{ ...image, layoutMode: "wrap" }])).toBeDefined();
  });
});
