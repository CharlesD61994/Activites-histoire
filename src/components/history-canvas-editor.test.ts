import { describe, expect, it } from "vitest";
import { normalizeHistoryCanvasLayout, resizeHistoryCanvasBlock } from "../lib/history-canvas";
import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryQuestion } from "../types";

const shortTextQuestion: HistoryQuestion = {
  id: "question-1",
  prompt: "Réponds à la question.",
  action: "short_text",
  documentIds: ["document-1"],
  points: 1,
  acceptedTextAnswers: ["réponse"]
};

describe("normalizeHistoryCanvasLayout", () => {
  it("preserves saved document and interaction dimensions in the current layout", () => {
    const canvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 5,
      blocks: [
        { id: "document", type: "document", x: 50, y: 80, width: 437, height: 612, aspectRatio: 437 / 612 },
        { id: "interaction", type: "interaction", x: 700, y: 400, width: 610, height: 120 }
      ]
    };

    expect(normalizeHistoryCanvasLayout(canvas, shortTextQuestion)).toBe(canvas);
  });

  it("migrates the oversized legacy interaction block once", () => {
    const canvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      blocks: [{ id: "interaction", type: "interaction", x: 900, y: 300, width: 520, height: 150 }]
    };

    const migrated = normalizeHistoryCanvasLayout(canvas, shortTextQuestion);

    expect(migrated.layoutVersion).toBe(5);
    expect(migrated.blocks[0]).toMatchObject({ width: 520, height: 103 });
  });

  it("restores the complete interaction ratio for an already resized block", () => {
    const canvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 2,
      blocks: [{ id: "interaction", type: "interaction", x: 700, y: 400, width: 390, height: 45 }]
    };

    const migrated = normalizeHistoryCanvasLayout(canvas, shortTextQuestion);

    expect(migrated.blocks[0]).toMatchObject({ width: 390, height: 77.25 });
  });
});

describe("resizeHistoryCanvasBlock", () => {
  const canvas = { width: 1600, height: 900 };
  const block: HistoryCanvasBlock = { id: "text", type: "text", x: 200, y: 100, width: 800, height: 200 };

  it("changes only the height from a horizontal edge", () => {
    const resized = resizeHistoryCanvasBlock(block, "n", 75, 50, canvas, shortTextQuestion);

    expect(resized).toMatchObject({ x: 200, y: 150, width: 800, height: 150 });
  });

  it("changes only the width from a vertical edge", () => {
    const resized = resizeHistoryCanvasBlock(block, "w", 100, 60, canvas, shortTextQuestion);

    expect(resized).toMatchObject({ x: 300, y: 100, width: 700, height: 200 });
  });

  it("keeps the current proportions from a corner", () => {
    const resized = resizeHistoryCanvasBlock(block, "se", 200, 50, canvas, shortTextQuestion);

    expect(resized.width / resized.height).toBeCloseTo(block.width / block.height);
    expect(resized).toMatchObject({ x: 200, y: 100, width: 1000, height: 250 });
  });

  it("keeps the opposite corner fixed and stays inside the canvas", () => {
    const nearEdge = { ...block, x: 100, y: 100 };
    const resized = resizeHistoryCanvasBlock(nearEdge, "nw", -500, -500, canvas, shortTextQuestion);

    expect(resized.x).toBe(0);
    expect(resized.y).toBeGreaterThanOrEqual(0);
    expect(resized.x + resized.width).toBe(nearEdge.x + nearEdge.width);
    expect(resized.y + resized.height).toBe(nearEdge.y + nearEdge.height);
    expect(resized.width / resized.height).toBeCloseTo(nearEdge.width / nearEdge.height);
  });

  it("enforces a minimum size without moving the anchored edges", () => {
    const resized = resizeHistoryCanvasBlock(block, "nw", 2000, 2000, canvas, shortTextQuestion);

    expect(resized).toMatchObject({ x: 640, y: 210, width: 360, height: 90 });
    expect(resized.x + resized.width).toBe(block.x + block.width);
    expect(resized.y + resized.height).toBe(block.y + block.height);
  });
});
