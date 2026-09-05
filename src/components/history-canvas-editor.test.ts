import { describe, expect, it } from "vitest";
import { blockScales, interactionBlockSize, normalizeHistoryCanvasLayout, reorderHistoryCanvasBlock, resizeHistoryCanvasBlock } from "../lib/history-canvas";
import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryInteractiveAction, HistoryQuestion } from "../types";

const shortTextQuestion: HistoryQuestion = {
  id: "question-1",
  prompt: "Réponds à la question.",
  action: "short_text",
  documentIds: ["document-1"],
  points: 1,
  acceptedTextAnswers: ["réponse"]
};
const resizeCanvas = { width: 1600, height: 900 };
const trueFalseQuestion: HistoryQuestion = {
  ...shortTextQuestion,
  action: "true_false",
  choices: [
    { id: "true", text: "Vrai", isCorrect: true },
    { id: "false", text: "Faux", isCorrect: false }
  ]
};

function interactionQuestion(action: HistoryInteractiveAction): HistoryQuestion {
  return {
    ...shortTextQuestion,
    action,
    choices: trueFalseQuestion.choices,
    classificationItems: [{ id: "item-1", text: "Élément", correctCategoryId: "category-1" }],
    matchingPrompts: [{ id: "prompt-1", prompt: "Élément", correctTargetId: "target-1" }],
    timelineEvents: [
      { id: "event-1", text: "Événement 1", correctOrder: 1 },
      { id: "event-2", text: "Événement 2", correctOrder: 2 }
    ]
  };
}

describe("interactionBlockSize", () => {
  it.each([
    ["short_text", 520, 128],
    ["true_false", 360, 120],
    ["choice_single", 680, 120],
    ["choice_multiple", 680, 120],
    ["reference_point", 680, 132],
    ["image_selection", 732, 344],
    ["classification", 720, 126],
    ["sort_categories", 720, 126],
    ["matching", 720, 126],
    ["table_fill", 720, 126],
    ["chronological_order", 760, 198],
    ["timeline", 760, 198],
    ["arrange_order", 760, 198],
    ["document_hotspot", 760, 500],
    ["cloze_choice", 920, 300]
  ] as const)("uses the expected default dimensions for %s", (action, width, height) => {
    expect(interactionBlockSize(interactionQuestion(action))).toEqual({ width, height });
  });
});

describe("normalizeHistoryCanvasLayout", () => {
  it("preserves saved document dimensions and protects old interactions from becoming too small", () => {
    const resizeCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 6,
      blocks: [
        { id: "document", type: "document", x: 50, y: 80, width: 437, height: 612, contentWidth: 437, contentHeight: 612, aspectRatio: 437 / 612 },
        { id: "interaction", type: "interaction", x: 700, y: 400, width: 610, height: 120, contentWidth: 520, contentHeight: 103 }
      ]
    };

    const migrated = normalizeHistoryCanvasLayout(resizeCanvas, shortTextQuestion);

    expect(migrated.layoutVersion).toBe(11);
    expect(migrated.blocks[0]).toMatchObject({ width: 437, height: 612 });
    expect(migrated.blocks[1]).toMatchObject({ width: 610, height: 120, contentWidth: 520, contentHeight: 103 });
  });

  it("migrates the oversized legacy interaction block once", () => {
    const resizeCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      blocks: [{ id: "interaction", type: "interaction", x: 900, y: 300, width: 520, height: 150 }]
    };

    const migrated = normalizeHistoryCanvasLayout(resizeCanvas, shortTextQuestion);

    expect(migrated.layoutVersion).toBe(11);
    expect(migrated.blocks[0]).toMatchObject({ width: 520, height: 128 });
  });

  it("shrinks old default true-false blocks to the compact reader size", () => {
    const resizeCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 7,
      blocks: [{ id: "interaction", type: "interaction", x: 900, y: 300, width: 680, height: 230, contentWidth: 680, contentHeight: 230 }]
    };

    const migrated = normalizeHistoryCanvasLayout(resizeCanvas, trueFalseQuestion);

    expect(interactionBlockSize(trueFalseQuestion)).toEqual({ width: 360, height: 120 });
    expect(migrated.blocks[0]).toMatchObject({ width: 360, height: 120, contentWidth: 360, contentHeight: 120 });
  });

  it("migrates the previous large true-false default", () => {
    const previousCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 10,
      blocks: [{ id: "interaction", type: "interaction", x: 900, y: 300, width: 420, height: 144, contentWidth: 420, contentHeight: 144 }]
    };

    const migrated = normalizeHistoryCanvasLayout(previousCanvas, trueFalseQuestion);

    expect(migrated.blocks[0]).toMatchObject({ width: 360, height: 120, contentWidth: 360, contentHeight: 120 });
  });

  it("compacts legacy default choice blocks", () => {
    const choiceQuestion = {
      ...interactionQuestion("choice_single"),
      choices: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: false },
        { id: "c", text: "C", isCorrect: false }
      ]
    };
    const legacyCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 8,
      blocks: [{ id: "interaction", type: "interaction", x: 800, y: 300, width: 680, height: 345, contentWidth: 680, contentHeight: 345 }]
    };

    const migrated = normalizeHistoryCanvasLayout(legacyCanvas, choiceQuestion);

    expect(migrated.blocks[0]).toMatchObject({ width: 680, height: 196, contentWidth: 680, contentHeight: 196 });
  });

  it("restores the complete interaction ratio for an already resized block", () => {
    const resizeCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 2,
      blocks: [{ id: "interaction", type: "interaction", x: 700, y: 400, width: 390, height: 45 }]
    };

    const migrated = normalizeHistoryCanvasLayout(resizeCanvas, shortTextQuestion);

    expect(migrated.blocks[0]).toMatchObject({ width: 390, height: 96 });
  });

  it("freezes current version 5 dimensions as the document composition", () => {
    const resizeCanvas: HistoryActivityCanvas = {
      width: 1600,
      height: 900,
      layoutVersion: 5,
      blocks: [{ id: "document", type: "document", x: 50, y: 80, width: 437, height: 612 }]
    };

    const migrated = normalizeHistoryCanvasLayout(resizeCanvas, shortTextQuestion);

    expect(migrated.blocks[0]).toMatchObject({
      x: 50,
      y: 80,
      width: 437,
      height: 612,
      contentWidth: 437,
      contentHeight: 612
    });
  });
});

describe("resizeHistoryCanvasBlock", () => {
  const block: HistoryCanvasBlock = { id: "text", type: "text", x: 200, y: 100, width: 800, height: 200 };

  it("resizes visual elements independently from their edges", () => {
    const visual: HistoryCanvasBlock = { id: "visual", type: "visual", x: 300, y: 200, width: 200, height: 200 };
    const widened = resizeHistoryCanvasBlock(visual, "e", 160, 0, resizeCanvas, shortTextQuestion);
    const heightened = resizeHistoryCanvasBlock(visual, "s", 0, 120, resizeCanvas, shortTextQuestion);

    expect(widened.width).toBe(360);
    expect(widened.height).toBe(200);
    expect(heightened.width).toBe(200);
    expect(heightened.height).toBe(320);
  });

  it("changes only the height from a horizontal edge", () => {
    const resized = resizeHistoryCanvasBlock(block, "n", 75, 50, resizeCanvas, shortTextQuestion);

    expect(resized).toMatchObject({ x: 200, y: 150, width: 800, height: 150 });
  });

  it("changes only the width from a vertical edge", () => {
    const resized = resizeHistoryCanvasBlock(block, "w", 100, 60, resizeCanvas, shortTextQuestion);

    expect(resized).toMatchObject({ x: 300, y: 100, width: 700, height: 200 });
  });

  it("can resize exactly to every canvas edge", () => {
    const toLeft = resizeHistoryCanvasBlock(block, "w", -resizeCanvas.width, 0, resizeCanvas, shortTextQuestion);
    const toTop = resizeHistoryCanvasBlock(block, "n", 0, -resizeCanvas.height, resizeCanvas, shortTextQuestion);
    const toRight = resizeHistoryCanvasBlock(block, "e", resizeCanvas.width, 0, resizeCanvas, shortTextQuestion);
    const toBottom = resizeHistoryCanvasBlock(block, "s", 0, resizeCanvas.height, resizeCanvas, shortTextQuestion);

    expect(toLeft.x).toBe(0);
    expect(toTop.y).toBe(0);
    expect(toRight.x + toRight.width).toBe(resizeCanvas.width);
    expect(toBottom.y + toBottom.height).toBe(resizeCanvas.height);
  });

  it("keeps the current proportions from a corner", () => {
    const resized = resizeHistoryCanvasBlock(block, "se", 200, 50, resizeCanvas, shortTextQuestion);

    expect(resized.width / resized.height).toBeCloseTo(block.width / block.height);
    expect(resized).toMatchObject({ x: 200, y: 100, width: 1000, height: 250 });
  });

  it("keeps the opposite corner fixed and stays inside the canvas", () => {
    const nearEdge = { ...block, x: 100, y: 100 };
    const resized = resizeHistoryCanvasBlock(nearEdge, "nw", -500, -500, resizeCanvas, shortTextQuestion);

    expect(resized.x).toBe(0);
    expect(resized.y).toBeGreaterThanOrEqual(0);
    expect(resized.x + resized.width).toBe(nearEdge.x + nearEdge.width);
    expect(resized.y + resized.height).toBe(nearEdge.y + nearEdge.height);
    expect(resized.width / resized.height).toBeCloseTo(nearEdge.width / nearEdge.height);
  });

  it("enforces a minimum size without moving the anchored edges", () => {
    const resized = resizeHistoryCanvasBlock(block, "nw", 2000, 2000, resizeCanvas, shortTextQuestion);

    expect(resized).toMatchObject({ x: 640, y: 210, width: 360, height: 90 });
    expect(resized.x + resized.width).toBe(block.x + block.width);
    expect(resized.y + resized.height).toBe(block.y + block.height);
  });
});

describe("blockScales", () => {
  it("uses both axes of a frozen document composition", () => {
    const block: HistoryCanvasBlock = {
      id: "document",
      type: "document",
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      contentWidth: 800,
      contentHeight: 200
    };

    expect(blockScales(block, shortTextQuestion)).toEqual({ x: 0.5, y: 1.5 });
  });

  it("recalculates an interaction composition when its choices change", () => {
    const block: HistoryCanvasBlock = {
      id: "interaction",
      type: "interaction",
      x: 0,
      y: 0,
      width: 680,
      height: 270,
      contentWidth: 680,
      contentHeight: 270
    };
    const question = {
      ...shortTextQuestion,
      action: "choice_single" as const,
      choices: Array.from({ length: 5 }, (_, index) => ({ id: String(index), text: String(index), isCorrect: index === 0 }))
    };

    expect(blockScales(block, question)).toEqual({ x: 1, y: 270 / 272 });
  });

  it("keeps short-text interactions tall enough for the answer field and action buttons", () => {
    const interaction: HistoryCanvasBlock = { id: "interaction", type: "interaction", x: 100, y: 100, width: 520, height: 165 };
    const resized = resizeHistoryCanvasBlock(interaction, "s", 0, -120, resizeCanvas, shortTextQuestion);

    expect(resized.height).toBe(90);
  });
});

describe("reorderHistoryCanvasBlock", () => {
  const blocks: HistoryCanvasBlock[] = [
    { id: "back", type: "shape", x: 0, y: 0, width: 100, height: 100 },
    { id: "middle", type: "text", x: 0, y: 0, width: 100, height: 100 },
    { id: "front", type: "document", x: 0, y: 0, width: 100, height: 100 }
  ];

  it("moves an object one plan forward", () => {
    expect(reorderHistoryCanvasBlock(blocks, "middle", "move_front").map((block) => block.id))
      .toEqual(["back", "front", "middle"]);
  });

  it("sends an object completely behind", () => {
    expect(reorderHistoryCanvasBlock(blocks, "front", "send_back").map((block) => block.id))
      .toEqual(["front", "back", "middle"]);
  });

  it("preserves the array when the object is already at the requested edge", () => {
    expect(reorderHistoryCanvasBlock(blocks, "back", "move_back")).toBe(blocks);
  });
});
