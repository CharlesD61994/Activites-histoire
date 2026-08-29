"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { correctClozeAnswer, historyClozeTokens, parseHistoryCloze } from "@/lib/history-cloze";
import { historyTextStyleToCss } from "@/lib/history-text-style";
import type { HistoryQuestion } from "@/types";

type Props = {
  question: HistoryQuestion;
  answers?: Record<string, string>;
  onAnswersChange?: (answers: Record<string, string>) => void;
  onInteraction?: () => void;
  onValidate?: () => void;
  lockedBlankIds?: string[];
  checkedCorrectBlankIds?: string[];
  checkedWrongBlankIds?: string[];
  awaitingRetry?: boolean;
  revealAnswers?: boolean;
  preview?: boolean;
  onPointerDown?: (event: React.PointerEvent) => void;
};

export function HistoryClozeInteraction({ question, answers = {}, onAnswersChange, onInteraction, onValidate, lockedBlankIds = [], checkedCorrectBlankIds = [], checkedWrongBlankIds = [], awaitingRetry = false, revealAnswers = false, preview = false, onPointerDown }: Props) {
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const parts = useMemo(() => parseHistoryCloze(question), [question]);
  const tokens = useMemo(() => historyClozeTokens(question), [question]);
  const tokenById = useMemo(() => new Map(tokens.map((token) => [token.id, token])), [tokens]);
  const usedTokenIds = new Set(Object.values(answers));
  const lockedBlanks = new Set(lockedBlankIds);
  const checkedCorrectBlanks = new Set(checkedCorrectBlankIds);
  const checkedWrongBlanks = new Set(checkedWrongBlankIds);

  function assignToken(blankId: string, tokenId: string) {
    if (preview || awaitingRetry || revealAnswers || lockedBlanks.has(blankId) || !tokenById.has(tokenId)) return;
    const next = Object.fromEntries(Object.entries(answers).filter(([id, value]) => id === blankId || value !== tokenId));
    next[blankId] = tokenId;
    onInteraction?.();
    onAnswersChange?.(next);
    setSelectedTokenId("");
  }

  function returnToBank(tokenId: string) {
    if (preview || awaitingRetry || revealAnswers) return;
    const next = Object.fromEntries(Object.entries(answers).filter(([, value]) => value !== tokenId));
    onInteraction?.();
    onAnswersChange?.(next);
    setSelectedTokenId("");
  }

  function reset() {
    if (preview) return;
    onInteraction?.();
    onAnswersChange?.({});
    setSelectedTokenId("");
  }

  return (
    <div className={`history-cloze-reader ${preview ? "is-preview" : ""}`} style={historyTextStyleToCss(question.clozeTextStyle)} onPointerDown={onPointerDown}>
      <div className="history-cloze-sentence">
        {parts.map((part, index) => {
          if (part.type === "text") return <span key={`text-${index}`} className="history-cloze-text">{part.value}</span>;
          const tokenId = answers[part.blank.id];
          const token = tokenById.get(tokenId);
          const locked = lockedBlanks.has(part.blank.id);
          const revealedAnswer = revealAnswers && !locked ? correctClozeAnswer(part.blank) : "";
          return (
            <button
              key={`blank-${part.blank.id}-${index}`}
              type="button"
              draggable={!preview && !locked && !awaitingRetry && !revealAnswers && Boolean(token)}
              className={`history-cloze-blank ${token || revealedAnswer ? "filled" : ""} ${selectedTokenId ? "ready" : ""} ${locked || checkedCorrectBlanks.has(part.blank.id) ? "earned" : ""} ${checkedWrongBlanks.has(part.blank.id) ? "wrong" : ""} ${revealedAnswer ? "revealed" : ""}`}
              aria-label={token ? `${token.text}, case ${part.blank.label}` : `Case vide ${part.blank.label}`}
              onClick={() => selectedTokenId ? assignToken(part.blank.id, selectedTokenId) : token && !locked && !revealAnswers && returnToBank(token.id)}
              onDragStart={(event) => {
                if (!token || locked || awaitingRetry || revealAnswers) return;
                event.dataTransfer.setData("text/history-cloze-token", token.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => { if (!preview) event.preventDefault(); }}
              onDrop={(event) => { event.preventDefault(); assignToken(part.blank.id, event.dataTransfer.getData("text/history-cloze-token")); }}
            >
              {revealedAnswer || token?.text || <span aria-hidden="true">&nbsp;</span>}
            </button>
          );
        })}
      </div>

      <div className="history-cloze-footer">
        <div
          className="history-cloze-bank"
          aria-label="Banque de mots"
          onDragOver={(event) => { if (!preview) event.preventDefault(); }}
          onDrop={(event) => { event.preventDefault(); returnToBank(event.dataTransfer.getData("text/history-cloze-token")); }}
        >
          {tokens.map((token) => {
            const used = usedTokenIds.has(token.id);
            const disabled = used || awaitingRetry || revealAnswers;
            return (
              <button
                key={token.id}
                type="button"
                draggable={!preview && !disabled}
                disabled={!preview && disabled}
                className={`${selectedTokenId === token.id ? "selected" : ""} ${used ? "used" : ""}`}
                onClick={() => !preview && !disabled && setSelectedTokenId((current) => current === token.id ? "" : token.id)}
                onDragStart={(event) => {
                  if (disabled) return;
                  event.dataTransfer.setData("text/history-cloze-token", token.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
              >
                <span aria-hidden="true" className="history-cloze-grip">⠿</span>{token.text}
              </button>
            );
          })}
        </div>
        <div className="history-cloze-actions">
          <button type="button" className="history-cloze-reset" onClick={reset} disabled={preview} aria-label="Réinitialiser" title="Réinitialiser"><RotateCcw size={20} /></button>
          <button type="button" className="history-cloze-validate" onClick={onValidate} disabled={preview}>{awaitingRetry ? "Réessayer" : "Valider"}</button>
        </div>
      </div>
    </div>
  );
}
