"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { CheckCircle2, FileText, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReaderChromePortal } from "@/components/presentation/reader-chrome";
import { historyActionLabels, historyOperationLabels } from "@/lib/history-activities";
import type { HistoryQuestion, HistorySourceDocument, Sentence } from "@/types";

type Props = {
  sentence: Sentence;
  onPoint: (pointId: string, points: number) => void;
  onCompleteChange?: (complete: boolean) => void;
};

type Validation = "idle" | "correct" | "incorrect";

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

function distancePercent(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeTextAnswer(value: string, caseSensitive?: boolean) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (caseSensitive) return normalized;
  return normalized.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-CA");
}

export function HistoryActivityReader({ sentence, onPoint, onCompleteChange }: Props) {
  const activity = sentence.historyActivity;
  const question = activity?.questions[0];
  const [selectedDocument, setSelectedDocument] = useState<HistorySourceDocument | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [classificationAnswers, setClassificationAnswers] = useState<Record<string, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [eventOrder, setEventOrder] = useState<string[]>(() => question?.timelineEvents?.slice().sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id).reverse() ?? []);
  const [hotspotAnswer, setHotspotAnswer] = useState<{ x: number; y: number } | null>(null);
  const [clozeAnswers, setClozeAnswers] = useState<Record<string, string>>({});
  const [shortTextAnswer, setShortTextAnswer] = useState("");
  const [validation, setValidation] = useState<Validation>("idle");
  const [awarded, setAwarded] = useState(false);

  const documents = activity?.documents ?? [];
  const linkedDocuments = question?.documentIds.length
    ? documents.filter((document) => question.documentIds.includes(document.id))
    : documents;
  const hotspotDocument = documents.find((document) => document.id === question?.hotspot?.documentId);

  const statusText = useMemo(() => {
    if (validation === "correct") return question?.feedbackCorrect || "Bonne réponse.";
    if (validation === "incorrect") return question?.feedbackIncorrect || "Pas encore. On ajuste ensemble, puis on réessaie.";
    return "";
  }, [question, validation]);

  if (!activity || !question) {
    return <Card><h2>Activité d’histoire incomplète</h2><p>Retourne dans l’éditeur pour ajouter une question.</p></Card>;
  }

  function toggleChoice(id: string) {
    if (!question) return;
    setValidation("idle");
    if (question.action === "choice_single") {
      setSelectedChoices([id]);
      return;
    }
    setSelectedChoices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function moveEvent(id: string, direction: -1 | 1) {
    setValidation("idle");
    setEventOrder((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function validate() {
    if (!question) return;
    let correct = false;
    if (question.action === "choice_single" || question.action === "choice_multiple") {
      correct = sameSet(selectedChoices, (question.choices ?? []).filter((choice) => choice.isCorrect).map((choice) => choice.id));
    } else if (question.action === "classification") {
      correct = (question.classificationItems ?? []).every((item) => classificationAnswers[item.id] === item.correctCategoryId);
    } else if (question.action === "matching") {
      correct = (question.matchingPrompts ?? []).every((prompt) => matchingAnswers[prompt.id] === prompt.correctTargetId);
    } else if (question.action === "chronological_order" || question.action === "timeline") {
      const expected = (question.timelineEvents ?? []).slice().sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id);
      correct = sameSet(eventOrder, expected) && eventOrder.every((id, index) => id === expected[index]);
    } else if (question.action === "document_hotspot") {
      correct = Boolean(question.hotspot && hotspotAnswer && distancePercent(hotspotAnswer, question.hotspot) <= question.hotspot.radius);
    } else if (question.action === "cloze_choice") {
      correct = (question.clozeBlanks ?? []).every((blank) => {
        const expected = blank.options.find((option) => option.isCorrect)?.id;
        return expected && clozeAnswers[blank.id] === expected;
      });
    } else if (question.action === "short_text") {
      const answer = normalizeTextAnswer(shortTextAnswer, question.textAnswerCaseSensitive);
      correct = Boolean(answer) && (question.acceptedTextAnswers ?? []).some((accepted) => normalizeTextAnswer(accepted, question.textAnswerCaseSensitive) === answer);
    }

    setValidation(correct ? "correct" : "incorrect");
    if (correct) {
      onCompleteChange?.(true);
      if (!awarded) {
        onPoint(`history-${question.id}`, question.points);
        setAwarded(true);
      }
    }
  }

  return (
    <div className="history-reader">
      <ReaderChromePortal slot="instruction">
        <span>{historyOperationLabels[activity.operation]} · {historyActionLabels[question.action]}</span>
      </ReaderChromePortal>

      <Card className="history-reader-main">
        <div className="history-reader-heading">
          <span className="activity-type-badge objective-history">{historyOperationLabels[activity.operation]}</span>
          <h1>{question.prompt}</h1>
        </div>

        <div className={`history-reader-workspace ${linkedDocuments.length ? "" : "without-documents"}`}>
          {linkedDocuments.length > 0 && (
            <aside className="history-reader-documents-panel">
              <span className="history-reader-panel-title">Documents</span>
              <div className="history-reader-documents">
                {linkedDocuments.map((document, index) => (
                  <button key={document.id} type="button" className="history-reader-document-card" onClick={() => setSelectedDocument(document)}>
                    <span className="history-reader-document-index">{index + 1}</span>
                    <span className="history-reader-document-media">
                      {document.src ? <img src={document.src} alt={document.title} /> : <FileText size={30} />}
                    </span>
                    <strong>{document.title}</strong>
                    {document.caption && <small>{document.caption}</small>}
                  </button>
                ))}
              </div>
            </aside>
          )}

          <div className="history-reader-task-panel">
            <HistoryQuestionInteraction
              question={question}
              selectedChoices={selectedChoices}
              toggleChoice={toggleChoice}
              classificationAnswers={classificationAnswers}
              setClassificationAnswers={setClassificationAnswers}
              matchingAnswers={matchingAnswers}
              setMatchingAnswers={setMatchingAnswers}
              eventOrder={eventOrder}
              moveEvent={moveEvent}
              hotspotDocument={hotspotDocument}
              hotspotAnswer={hotspotAnswer}
              setHotspotAnswer={setHotspotAnswer}
              clozeAnswers={clozeAnswers}
              setClozeAnswers={setClozeAnswers}
              shortTextAnswer={shortTextAnswer}
              setShortTextAnswer={setShortTextAnswer}
              resetValidation={() => setValidation("idle")}
            />

            {statusText && (
              <div className={`history-result ${validation}`}>
                {validation === "correct" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                <strong>{statusText}</strong>
              </div>
            )}

            <div className="history-reader-actions">
              <Button onClick={validate}>Valider</Button>
            </div>
          </div>
        </div>
      </Card>

      {selectedDocument && (
        <div className="history-document-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && setSelectedDocument(null)}>
          <div className="history-document-modal-content">
            <button type="button" className="icon-control" onClick={() => setSelectedDocument(null)} aria-label="Fermer"><X size={20} /></button>
            <div className="history-document-modal-header">
              <h2>{selectedDocument.title}</h2>
              {(selectedDocument.caption || selectedDocument.source) && <small>{[selectedDocument.caption, selectedDocument.source].filter(Boolean).join(" · ")}</small>}
            </div>
            <div className="history-document-modal-body">
              {selectedDocument.src ? <img src={selectedDocument.src} alt={selectedDocument.title} /> : <p>{selectedDocument.text}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryQuestionInteraction({
  question,
  selectedChoices,
  toggleChoice,
  classificationAnswers,
  setClassificationAnswers,
  matchingAnswers,
  setMatchingAnswers,
  eventOrder,
  moveEvent,
  hotspotDocument,
  hotspotAnswer,
  setHotspotAnswer,
  clozeAnswers,
  setClozeAnswers,
  shortTextAnswer,
  setShortTextAnswer,
  resetValidation
}: {
  question: HistoryQuestion;
  selectedChoices: string[];
  toggleChoice: (id: string) => void;
  classificationAnswers: Record<string, string>;
  setClassificationAnswers: (next: Record<string, string>) => void;
  matchingAnswers: Record<string, string>;
  setMatchingAnswers: (next: Record<string, string>) => void;
  eventOrder: string[];
  moveEvent: (id: string, direction: -1 | 1) => void;
  hotspotDocument?: HistorySourceDocument;
  hotspotAnswer: { x: number; y: number } | null;
  setHotspotAnswer: (answer: { x: number; y: number }) => void;
  clozeAnswers: Record<string, string>;
  setClozeAnswers: (next: Record<string, string>) => void;
  shortTextAnswer: string;
  setShortTextAnswer: (next: string) => void;
  resetValidation: () => void;
}) {
  if (question.action === "choice_single" || question.action === "choice_multiple") {
    return <div className="history-choice-grid">{(question.choices ?? []).map((choice) => <button key={choice.id} type="button" className={selectedChoices.includes(choice.id) ? "selected" : ""} onClick={() => toggleChoice(choice.id)}>{choice.text}</button>)}</div>;
  }

  if (question.action === "classification") {
    return <div className="history-answer-list">{(question.classificationItems ?? []).map((item) => <label key={item.id}>{item.text}<select value={classificationAnswers[item.id] ?? ""} onChange={(event) => { resetValidation(); setClassificationAnswers({ ...classificationAnswers, [item.id]: event.target.value }); }}><option value="">Choisir</option>{(question.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>)}</div>;
  }

  if (question.action === "matching") {
    return <div className="history-answer-list">{(question.matchingPrompts ?? []).map((prompt) => <label key={prompt.id}>{prompt.prompt}<select value={matchingAnswers[prompt.id] ?? ""} onChange={(event) => { resetValidation(); setMatchingAnswers({ ...matchingAnswers, [prompt.id]: event.target.value }); }}><option value="">Associer à...</option>{(question.matchingTargets ?? []).map((target) => <option key={target.id} value={target.id}>{target.text}</option>)}</select></label>)}</div>;
  }

  if (question.action === "chronological_order" || question.action === "timeline") {
    const eventsById = new Map((question.timelineEvents ?? []).map((event) => [event.id, event]));
    return <div className="history-order-list">{eventOrder.map((id) => { const event = eventsById.get(id); if (!event) return null; return <div key={id}><span>{event.dateLabel && <small>{event.dateLabel}</small>}{event.text}</span><button type="button" onClick={() => moveEvent(id, -1)}>Monter</button><button type="button" onClick={() => moveEvent(id, 1)}>Descendre</button></div>; })}</div>;
  }

  if (question.action === "document_hotspot") {
    return hotspotDocument?.src ? (
      <button type="button" className="history-hotspot-reader" onClick={(event) => {
        resetValidation();
        const rect = event.currentTarget.getBoundingClientRect();
        setHotspotAnswer({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
      }}>
        <img src={hotspotDocument.src} alt={hotspotDocument.title} />
        {hotspotAnswer && <span style={{ left: `${hotspotAnswer.x}%`, top: `${hotspotAnswer.y}%` }} />}
      </button>
    ) : <p>Cette action demande un document image ou une carte.</p>;
  }

  if (question.action === "short_text") {
    return (
      <div className="history-short-text-reader">
        <input
          value={shortTextAnswer}
          onChange={(event) => {
            resetValidation();
            setShortTextAnswer(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="Écrire un mot ou une courte phrase"
        />
      </div>
    );
  }

  return (
    <div className="history-cloze-reader">
      <p>{question.clozeText}</p>
      {(question.clozeBlanks ?? []).map((blank) => <label key={blank.id}>Blanc {blank.label}<select value={clozeAnswers[blank.id] ?? ""} onChange={(event) => { resetValidation(); setClozeAnswers({ ...clozeAnswers, [blank.id]: event.target.value }); }}><option value="">Choisir</option>{blank.options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}</select></label>)}
    </div>
  );
}
