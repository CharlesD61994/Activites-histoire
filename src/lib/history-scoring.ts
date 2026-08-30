import type { HistoryQuestion } from "../types";
import { clozeAnswerIsCorrect } from "./history-cloze";

export type HistoryAnswerState = {
  selectedChoices: string[];
  classificationAnswers: Record<string, string>;
  matchingAnswers: Record<string, string>;
  eventOrder: string[];
  hotspotAnswer: { x: number; y: number } | null;
  clozeAnswers: Record<string, string>;
  shortTextAnswer: string;
};

export type HistoryScoreResult = {
  allItemIds: string[];
  correctItemIds: string[];
  wrongItemIds: string[];
};

function distancePercent(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalizeHistoryTextAnswer(value: string, caseSensitive?: boolean) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (caseSensitive) return normalized;
  return normalized.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-CA");
}

export function historyQuestionMaxPoints(question: HistoryQuestion) {
  if (question.action === "choice_multiple" || question.action === "image_selection") return Math.max(1, (question.choices ?? []).filter((choice) => choice.isCorrect).length);
  if (question.action === "classification" || question.action === "sort_categories") return Math.max(1, question.classificationItems?.length ?? 0);
  if (question.action === "matching" || question.action === "table_fill") return Math.max(1, question.matchingPrompts?.length ?? 0);
  if (question.action === "chronological_order" || question.action === "timeline" || question.action === "arrange_order") return Math.max(1, question.timelineEvents?.length ?? 0);
  if (question.action === "cloze_choice") return Math.max(1, question.clozeBlanks?.length ?? 0);
  return 1;
}

export function evaluateHistoryQuestion(question: HistoryQuestion, answers: HistoryAnswerState): HistoryScoreResult {
  const correctItemIds: string[] = [];
  let allItemIds: string[] = [];

  if (question.action === "choice_single" || question.action === "true_false" || question.action === "reference_point") {
    const correctChoice = (question.choices ?? []).find((choice) => choice.isCorrect);
    allItemIds = ["answer"];
    if (correctChoice && answers.selectedChoices.includes(correctChoice.id)) correctItemIds.push("answer");
  } else if (question.action === "choice_multiple" || question.action === "image_selection") {
    const correctChoiceIds = (question.choices ?? []).filter((choice) => choice.isCorrect).map((choice) => choice.id);
    const wrongSelectedChoiceIds = (question.choices ?? []).filter((choice) => !choice.isCorrect && answers.selectedChoices.includes(choice.id)).map((choice) => choice.id);
    allItemIds = [
      ...correctChoiceIds.map((id) => `choice:${id}`),
      ...wrongSelectedChoiceIds.map((id) => `choice-wrong:${id}`)
    ];
    correctChoiceIds.forEach((id) => {
      if (answers.selectedChoices.includes(id)) correctItemIds.push(`choice:${id}`);
    });
  } else if (question.action === "classification" || question.action === "sort_categories") {
    allItemIds = (question.classificationItems ?? []).map((item) => `classification:${item.id}`);
    (question.classificationItems ?? []).forEach((item) => {
      if (answers.classificationAnswers[item.id] === item.correctCategoryId) correctItemIds.push(`classification:${item.id}`);
    });
  } else if (question.action === "matching" || question.action === "table_fill") {
    allItemIds = (question.matchingPrompts ?? []).map((prompt) => `matching:${prompt.id}`);
    (question.matchingPrompts ?? []).forEach((prompt) => {
      if (answers.matchingAnswers[prompt.id] === prompt.correctTargetId) correctItemIds.push(`matching:${prompt.id}`);
    });
  } else if (question.action === "chronological_order" || question.action === "timeline" || question.action === "arrange_order") {
    const expected = (question.timelineEvents ?? []).slice().sort((a, b) => a.correctOrder - b.correctOrder);
    allItemIds = expected.map((event) => `timeline:${event.id}`);
    expected.forEach((event, index) => {
      if (answers.eventOrder[index] === event.id) correctItemIds.push(`timeline:${event.id}`);
    });
  } else if (question.action === "document_hotspot") {
    allItemIds = ["answer"];
    if (question.hotspot && answers.hotspotAnswer && distancePercent(answers.hotspotAnswer, question.hotspot) <= question.hotspot.radius) {
      correctItemIds.push("answer");
    }
  } else if (question.action === "cloze_choice") {
    allItemIds = (question.clozeBlanks ?? []).map((blank) => `cloze:${blank.id}`);
    (question.clozeBlanks ?? []).forEach((blank) => {
      if (clozeAnswerIsCorrect(question, blank, answers.clozeAnswers[blank.id])) correctItemIds.push(`cloze:${blank.id}`);
    });
  } else if (question.action === "short_text") {
    const answer = normalizeHistoryTextAnswer(answers.shortTextAnswer, question.textAnswerCaseSensitive);
    allItemIds = ["answer"];
    if (answer && (question.acceptedTextAnswers ?? []).some((accepted) => normalizeHistoryTextAnswer(accepted, question.textAnswerCaseSensitive) === answer)) {
      correctItemIds.push("answer");
    }
  }

  const correctSet = new Set(correctItemIds);
  return {
    allItemIds,
    correctItemIds,
    wrongItemIds: allItemIds.filter((id) => !correctSet.has(id))
  };
}
