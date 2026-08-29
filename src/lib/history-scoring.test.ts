import { describe, expect, it } from "vitest";
import { getHistoryActivityPointTotal } from "./history-activities";
import { evaluateHistoryQuestion, historyQuestionMaxPoints } from "./history-scoring";
import type { HistoryQuestion, Sentence } from "../types";

const emptyAnswers = {
  selectedChoices: [],
  classificationAnswers: {},
  matchingAnswers: {},
  eventOrder: [],
  hotspotAnswer: null,
  clozeAnswers: {},
  shortTextAnswer: ""
};

describe("history scoring", () => {
  it("counts each cloze blank as one point", () => {
    const question: HistoryQuestion = {
      id: "q1",
      prompt: "Complète le texte.",
      action: "cloze_choice",
      documentIds: [],
      points: 1,
      clozeText: "La [[1]] et la [[2]].",
      clozeBlanks: [
        { id: "blank-1", label: "1", options: [{ id: "a", text: "sédentarisation", isCorrect: true }] },
        { id: "blank-2", label: "2", options: [{ id: "b", text: "culture", isCorrect: true }] }
      ]
    };

    expect(historyQuestionMaxPoints(question)).toBe(2);
    expect(evaluateHistoryQuestion(question, {
      ...emptyAnswers,
      clozeAnswers: { "blank-1": "answer:blank-1" }
    })).toMatchObject({
      correctItemIds: ["cloze:blank-1"],
      wrongItemIds: ["cloze:blank-2"]
    });
  });

  it("counts each correct choice in multiple choice", () => {
    const question: HistoryQuestion = {
      id: "q2",
      prompt: "Choisis les bonnes réponses.",
      action: "choice_multiple",
      documentIds: [],
      points: 1,
      choices: [
        { id: "a", text: "Bonne A", isCorrect: true },
        { id: "b", text: "Mauvaise", isCorrect: false },
        { id: "c", text: "Bonne C", isCorrect: true }
      ]
    };

    expect(historyQuestionMaxPoints(question)).toBe(2);
    expect(evaluateHistoryQuestion(question, {
      ...emptyAnswers,
      selectedChoices: ["a", "b"]
    })).toMatchObject({
      correctItemIds: ["choice:a"],
      wrongItemIds: ["choice:c"]
    });
  });

  it("uses automatic history totals instead of the legacy question point field", () => {
    const sentence: Sentence = {
      id: "history",
      title: "Activité",
      activityType: "history",
      levelId: "level",
      originalText: "",
      difficulty: "easy",
      tags: [],
      corrections: [],
      assignedGroupIds: [],
      createdAt: "2026-08-29T00:00:00.000Z",
      updatedAt: "2026-08-29T00:00:00.000Z",
      historyActivity: {
        operation: "establish_facts",
        aspects: [],
        documents: [],
        questions: [{
          id: "q3",
          prompt: "Classe.",
          action: "classification",
          documentIds: [],
          points: 1,
          categories: [],
          classificationItems: [
            { id: "one", text: "Un", correctCategoryId: "a" },
            { id: "two", text: "Deux", correctCategoryId: "b" },
            { id: "three", text: "Trois", correctCategoryId: "c" }
          ]
        }]
      }
    };

    expect(getHistoryActivityPointTotal(sentence)).toBe(3);
  });
});
