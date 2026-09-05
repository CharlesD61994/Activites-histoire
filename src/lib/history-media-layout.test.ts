import { describe, expect, it } from "vitest";
import { fitHistoryMedia, normalizeHistoryChoiceLabels } from "./history-media-layout";
import { blockContentSize, imageChoiceSize } from "./history-canvas";
import type { HistoryQuestion } from "../types";

const base: HistoryQuestion = { id: "q", action: "choice_multiple", prompt: "Question", points: 1, documentIds: [], choices: [{ id: "a", text: "Vrai", isCorrect: false, documentId: "portrait" }, { id: "b", text: "Faux", isCorrect: true }] };
describe("history media layout", () => {
  it("repairs saved binary placeholders without losing answers, IDs or documents", () => {
    for (const action of ["choice_single", "choice_multiple", "image_selection"] as const) {
      const result = normalizeHistoryChoiceLabels({ ...base, action });
      expect(result.choices).toEqual(base.choices!.map((choice, i) => ({ ...choice, text: `Choix #${i + 1}` })));
    }
    const binary = { ...base, action: "true_false" as const };
    expect(normalizeHistoryChoiceLabels(binary)).toBe(binary);
    const custom = { ...base, choices: [{ ...base.choices![0], text: "Vraiment différent" }] };
    expect(normalizeHistoryChoiceLabels(custom)).toBe(custom);
  });
  it("uses the document ratio and respects individual card dimensions", () => {
    const result = fitHistoryMedia({ ...base, action: "image_selection" }, { portrait: 0.5 });
    expect(imageChoiceSize(result.choices![0])).toEqual({ width: 360, height: 736 });
    expect(imageChoiceSize({ ...result.choices![0], imageWidth: 280, imageHeight: 320 })).toEqual({ width: 280, height: 320 });
  });
  it("fits a saved hotspot frame to the visible image once and preserves its center", () => {
    const question: HistoryQuestion = { ...base, action: "document_hotspot", hotspot: { documentId: "portrait", x: 30, y: 40, radius: 10 }, canvas: { width: 1600, height: 900, blocks: [{ id: "i", type: "interaction", x: 20, y: 30, width: 760, height: 500 }] } };
    const result = fitHistoryMedia(question, { portrait: 0.5 });
    const block = result.canvas!.blocks[0];
    expect(block.width).toBe(222);
    expect(block.x + block.width / 2).toBe(400);
    expect(blockContentSize(block, result)).toEqual({ width: 222, height: 500 });
    expect(result.hotspot).toEqual(question.hotspot);
    expect(fitHistoryMedia(result, { portrait: 0.5 })).toBe(result);
  });
});
