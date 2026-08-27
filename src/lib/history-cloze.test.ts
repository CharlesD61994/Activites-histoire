import { describe, expect, it } from "vitest";
import { clozeAnswerIsCorrect, historyClozeTokens, parseHistoryCloze } from "./history-cloze";
import type { HistoryQuestion } from "../types";

const question: HistoryQuestion = {
  id: "q1",
  prompt: "Complète le texte",
  action: "cloze_choice",
  documentIds: [],
  points: 1,
  clozeText: "La [[1]] précède la {{2}}.",
  clozeBlanks: [
    { id: "b1", label: "1", options: [{ id: "o1", text: "cause", isCorrect: true }] },
    { id: "b2", label: "2", options: [{ id: "o2", text: "conséquence", isCorrect: true }] }
  ],
  clozeDistractors: ["continuité"]
};

describe("history cloze", () => {
  it("places numbered blanks inside the text", () => {
    expect(parseHistoryCloze(question).filter((part) => part.type === "blank").map((part) => part.type === "blank" && part.blank.id)).toEqual(["b1", "b2"]);
  });

  it("builds draggable answer and distractor tokens", () => {
    expect(historyClozeTokens(question).map((token) => token.text)).toEqual(["cause", "conséquence", "continuité"]);
  });

  it("validates the word assigned to each blank", () => {
    expect(clozeAnswerIsCorrect(question, question.clozeBlanks![0], "answer:b1")).toBe(true);
    expect(clozeAnswerIsCorrect(question, question.clozeBlanks![0], "distractor:0")).toBe(false);
  });
});
