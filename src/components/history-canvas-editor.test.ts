import { describe, expect, it } from "vitest";
import { normalizeHistoryCanvasLayout } from "../lib/history-canvas";
import type { HistoryActivityCanvas, HistoryQuestion } from "../types";

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
      layoutVersion: 3,
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

    expect(migrated.layoutVersion).toBe(3);
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

    expect(migrated.blocks[0]).toMatchObject({ width: 390, height: 77.25, scale: 0.75 });
  });
});
