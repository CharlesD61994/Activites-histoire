import { describe, expect, it } from "vitest";
import { initialHistoryEventOrder, placeHistoryDocument, reorderHistoryEvents } from "./history-order";
import { evaluateHistoryQuestion } from "./history-scoring";
import type { HistoryQuestion } from "../types";

const chronology: HistoryQuestion = {
  id: "chronology", action: "chronological_order", prompt: "Classe les documents", documentIds: [], points: 3,
  timelineEvents: [
    { id: "a", text: "Document 4", documentNumber: 4, correctOrder: 2 },
    { id: "b", text: "Document 5", documentNumber: 5, correctOrder: 1 },
    { id: "c", text: "Document 6", documentNumber: 6, correctOrder: 3 }
  ]
};

describe("numbered chronology documents", () => {
  it("starts with empty circles while card ordering starts with all cards", () => {
    expect(initialHistoryEventOrder(chronology)).toEqual(["", "", ""]);
    expect(initialHistoryEventOrder({ ...chronology, action: "arrange_order" })).toEqual(["c", "a", "b"]);
  });
  it("moves documents without duplication and sends displaced documents to the bank", () => {
    expect(placeHistoryDocument(["a", "", "b"], "a", 2, new Set())).toEqual(["", "", "a"]);
    expect(placeHistoryDocument(["a", "", "b"], "b", -1, new Set())).toEqual(["a", "", ""]);
  });
  it("protects correct documents and their slots", () => {
    const order = ["b", "a", ""];
    expect(placeHistoryDocument(order, "b", 2, new Set(["b"]))).toBe(order);
    expect(placeHistoryDocument(order, "a", 0, new Set(["b"]))).toBe(order);
  });
  it("scores positions using the configured order, independent of document numbers", () => {
    const result = evaluateHistoryQuestion(chronology, { eventOrder: ["b", "", "a"], selectedChoices: [], classificationAnswers: {}, matchingAnswers: {}, clozeAnswers: {}, shortTextAnswer: "", hotspotAnswer: null });
    expect(result.correctItemIds).toEqual(["timeline:b"]);
    expect(result.wrongItemIds).toEqual(["timeline:a", "timeline:c"]);
  });
});

describe("chronological card ordering", () => {
  it("inserts a card at its destination in either direction", () => {
    expect(reorderHistoryEvents(["a", "b", "c"], "a", "c", new Set())).toEqual(["b", "c", "a"]);
    expect(reorderHistoryEvents(["a", "b", "c"], "c", "a", new Set())).toEqual(["c", "a", "b"]);
  });
  it("keeps earned cards in their exact positions when crossing them", () => {
    expect(reorderHistoryEvents(["a", "b", "c", "d"], "d", "a", new Set(["b"]))).toEqual(["d", "b", "a", "c"]);
  });
  it("rejects a locked source, locked destination, or unknown card", () => {
    const order = ["a", "b", "c"];
    for (const [from, to] of [["b", "a"], ["a", "b"], ["missing", "c"]]) {
      expect(reorderHistoryEvents(order, from, to, new Set(["b"]))).toBe(order);
    }
  });
});
