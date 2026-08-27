import type { HistoryClozeBlank, HistoryQuestion } from "../types";

export type HistoryClozeToken = {
  id: string;
  text: string;
};

export type HistoryClozePart =
  | { type: "text"; value: string }
  | { type: "blank"; blank: HistoryClozeBlank };

export function correctClozeAnswer(blank: HistoryClozeBlank) {
  return blank.options.find((option) => option.isCorrect)?.text.trim() ?? "";
}

export function historyClozeTokens(question: HistoryQuestion): HistoryClozeToken[] {
  const answerTokens = (question.clozeBlanks ?? [])
    .map((blank) => ({ id: `answer:${blank.id}`, text: correctClozeAnswer(blank) }))
    .filter((token) => token.text);
  const distractorTokens = (question.clozeDistractors ?? [])
    .map((text, index) => ({ id: `distractor:${index}`, text: text.trim() }))
    .filter((token) => token.text);
  return [...answerTokens, ...distractorTokens];
}

export function parseHistoryCloze(question: HistoryQuestion): HistoryClozePart[] {
  const text = question.clozeText ?? "";
  const blanks = question.clozeBlanks ?? [];
  const parts: HistoryClozePart[] = [];
  const pattern = /\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g;
  let cursor = 0;
  let fallbackIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: "text", value: text.slice(cursor, index) });
    const label = (match[1] ?? match[2] ?? "").trim();
    const blank = blanks.find((item) => item.label === label) ?? blanks[fallbackIndex];
    if (blank) {
      parts.push({ type: "blank", blank });
      fallbackIndex += 1;
    } else {
      parts.push({ type: "text", value: match[0] });
    }
    cursor = index + match[0].length;
  }

  if (cursor < text.length) parts.push({ type: "text", value: text.slice(cursor) });
  if (!parts.length && text) parts.push({ type: "text", value: text });
  return parts;
}

export function clozeAnswerIsCorrect(question: HistoryQuestion, blank: HistoryClozeBlank, tokenId?: string) {
  if (!tokenId) return false;
  const token = historyClozeTokens(question).find((item) => item.id === tokenId);
  if (token) return token.text.localeCompare(correctClozeAnswer(blank), "fr-CA", { sensitivity: "base" }) === 0;
  return blank.options.some((option) => option.id === tokenId && option.isCorrect);
}
