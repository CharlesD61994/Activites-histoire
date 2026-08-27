"use client";

import { useEffect, useRef, useState } from "react";
import { EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { correctClozeAnswer, parseHistoryCloze } from "@/lib/history-cloze";
import type { HistoryChoiceOption, HistoryQuestion } from "@/types";

type Props = {
  question: HistoryQuestion;
  onChange: (patch: Partial<HistoryQuestion>) => void;
};

function makeAnswer(text: string): HistoryChoiceOption {
  return { id: crypto.randomUUID(), text, isCorrect: true };
}

function nextLabel(question: HistoryQuestion) {
  const highest = Math.max(0, ...(question.clozeBlanks ?? []).map((blank) => Number.parseInt(blank.label, 10)).filter(Number.isFinite));
  return String(highest + 1);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeMarker(text: string, label: string) {
  const escaped = escapeRegExp(label);
  return text.replace(new RegExp(`\\s*(?:\\[\\[${escaped}\\]\\]|\\{\\{${escaped}\\}\\})`), "");
}

function serializeEditor(root: HTMLElement) {
  function serialize(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const label = node.dataset.clozeLabel;
    if (label) return `[[${label}]]`;
    if (node.tagName === "BR") return "\n";
    const value = Array.from(node.childNodes).map(serialize).join("");
    return node.tagName === "DIV" || node.tagName === "P" ? `${value}\n` : value;
  }

  return Array.from(root.childNodes).map(serialize).join("").replace(/\n+$/, "");
}

export function HistoryClozeAuthoringEditor({ question, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [message, setMessage] = useState("");
  const [focusBlankId, setFocusBlankId] = useState("");
  const parts = parseHistoryCloze(question);
  const orderedBlanks = [
    ...parts.filter((part) => part.type === "blank").map((part) => part.type === "blank" ? part.blank : null).filter((blank): blank is NonNullable<typeof blank> => Boolean(blank)),
    ...(question.clozeBlanks ?? []).filter((blank) => !parts.some((part) => part.type === "blank" && part.blank.id === blank.id))
  ];
  const editorKey = `${question.clozeText ?? ""}|${(question.clozeBlanks ?? []).map((blank) => `${blank.id}:${blank.label}`).join("|")}`;

  useEffect(() => {
    if (!focusBlankId) return;
    const frame = requestAnimationFrame(() => {
      const input = editorRef.current?.querySelector<HTMLInputElement>(`[data-blank-input="${focusBlankId}"]`);
      input?.focus();
      input?.select();
      setFocusBlankId("");
    });
    return () => cancelAnimationFrame(frame);
  }, [focusBlankId, question.clozeBlanks]);

  function rememberSelection() {
    const selection = window.getSelection();
    const root = editorRef.current;
    if (!root || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (root.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange();
  }

  function hideSelectedWord() {
    const root = editorRef.current;
    if (!root) return;
    const liveSelection = window.getSelection();
    let range = liveSelection?.rangeCount ? liveSelection.getRangeAt(0).cloneRange() : savedRangeRef.current?.cloneRange();
    if (!range || !root.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);
    }
    if (range.cloneContents().querySelector?.("[data-cloze-label]")) {
      setMessage("Sélectionne seulement du texte, sans inclure une boîte existante.");
      return;
    }

    const rawSelection = range.toString();
    const answer = rawSelection.trim();
    const leadingSpace = rawSelection.match(/^\s*/)?.[0] ?? "";
    const trailingSpace = rawSelection.match(/\s*$/)?.[0] ?? "";
    const label = nextLabel(question);
    const blankId = crypto.randomUUID();
    range.deleteContents();
    range.insertNode(document.createTextNode(`${leadingSpace}[[${label}]]${trailingSpace}`));
    const nextText = serializeEditor(root);
    onChange({
      clozeText: nextText,
      clozeBlanks: [...(question.clozeBlanks ?? []), { id: blankId, label, options: [makeAnswer(answer)] }]
    });
    setMessage("");
    if (!answer) setFocusBlankId(blankId);
  }

  function updateAnswer(blankId: string, text: string) {
    onChange({
      clozeBlanks: (question.clozeBlanks ?? []).map((blank) => blank.id === blankId
        ? { ...blank, options: [{ ...(blank.options.find((option) => option.isCorrect) ?? makeAnswer("")), text, isCorrect: true }] }
        : blank)
    });
  }

  function deleteBlank(blankId: string, label: string) {
    onChange({
      clozeText: removeMarker(question.clozeText ?? "", label),
      clozeBlanks: (question.clozeBlanks ?? []).filter((blank) => blank.id !== blankId)
    });
  }

  return (
    <div className="history-cloze-authoring">
      <div className="history-cloze-authoring-toolbar">
        <Button type="button" variant="secondary" onMouseDown={(event) => event.preventDefault()} onClick={hideSelectedWord}><EyeOff size={17} /> Mot caché</Button>
        <label>Taille de police<input type="number" min={14} max={56} value={question.clozeTextStyle?.fontSize ?? 26} onChange={(event) => onChange({ clozeTextStyle: { ...question.clozeTextStyle, fontSize: Math.min(56, Math.max(14, Number(event.target.value) || 26)) } })} /></label>
      </div>
      <div
        key={editorKey}
        ref={editorRef}
        className="history-cloze-authoring-surface"
        contentEditable
        suppressContentEditableWarning
        style={{ fontSize: `${question.clozeTextStyle?.fontSize ?? 26}px` }}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return;
          const text = serializeEditor(event.currentTarget);
          if (text !== (question.clozeText ?? "")) onChange({ clozeText: text });
        }}
      >
        {parts.map((part, index) => part.type === "text" ? part.value : (
          <span key={`${part.blank.id}-${index}`} className="history-cloze-authoring-blank" data-cloze-label={part.blank.label} contentEditable={false}>
            <input
              data-blank-input={part.blank.id}
              value={correctClozeAnswer(part.blank)}
              style={{ width: `${Math.max(8, correctClozeAnswer(part.blank).length + 1)}ch` }}
              onChange={(event) => updateAnswer(part.blank.id, event.target.value)}
              placeholder="Mot caché"
              aria-label={`Mot caché ${part.blank.label}`}
            />
          </span>
        ))}
      </div>
      {message && <p className="history-cloze-authoring-message">{message}</p>}

      <div className="history-cloze-hidden-list">
        <strong>Mots cachés</strong>
        {orderedBlanks.length ? orderedBlanks.map((blank, index) => (
          <div key={blank.id}>
            <span>{index + 1}</span>
            <input value={correctClozeAnswer(blank)} onChange={(event) => updateAnswer(blank.id, event.target.value)} aria-label={`Réponse du mot caché ${index + 1}`} />
            <button type="button" onClick={() => deleteBlank(blank.id, blank.label)} aria-label={`Supprimer le mot caché ${index + 1}`}><Trash2 size={16} /></button>
          </div>
        )) : <small>Aucun mot caché pour le moment.</small>}
      </div>
    </div>
  );
}
