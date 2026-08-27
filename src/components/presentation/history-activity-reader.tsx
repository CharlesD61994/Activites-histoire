"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, RotateCcw, X, XCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HistoryDocumentContent } from "@/components/history-document-content";
import { HistoryClozeInteraction } from "@/components/history-cloze-interaction";
import { blockContentSize, blockScales } from "@/lib/history-canvas";
import { clozeAnswerIsCorrect } from "@/lib/history-cloze";
import { historyActionLabels, historyOperationLabels } from "@/lib/history-activities";
import { historyTextStyleToCss } from "@/lib/history-text-style";
import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryQuestion, HistorySourceDocument, Sentence } from "@/types";

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
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentNaturalSize, setDocumentNaturalSize] = useState({ width: 0, height: 0 });
  const [documentViewportSize, setDocumentViewportSize] = useState({ width: 0, height: 0 });
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
  const showDocumentPanel = linkedDocuments.length > 1;
  const primaryDocument = linkedDocuments.length === 1 && question?.action !== "document_hotspot" ? linkedDocuments[0] : null;

  const statusText = useMemo(() => {
    if (validation === "correct") return question?.feedbackCorrect || "Bonne réponse.";
    if (validation === "incorrect") return question?.feedbackIncorrect || "Pas encore. On ajuste ensemble, puis on réessaie.";
    return "";
  }, [question, validation]);

  useEffect(() => {
    if (!selectedDocument) return;
    function updateViewportSize() {
      setDocumentViewportSize({ width: window.innerWidth, height: window.innerHeight });
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedDocument(null);
      if (event.key === "+" || event.key === "=") setDocumentZoom((current) => Math.min(3, current + 0.25));
      if (event.key === "-") setDocumentZoom((current) => Math.max(0.5, current - 0.25));
    }
    updateViewportSize();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateViewportSize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateViewportSize);
    };
  }, [selectedDocument]);

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
      correct = (question.clozeBlanks ?? []).every((blank) => clozeAnswerIsCorrect(question, blank, clozeAnswers[blank.id]));
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

  function openDocument(document: HistorySourceDocument) {
    setSelectedDocument(document);
    setDocumentZoom(1);
    setDocumentNaturalSize({ width: 0, height: 0 });
    setDocumentViewportSize({ width: window.innerWidth, height: window.innerHeight });
  }

  function closeDocument() {
    setSelectedDocument(null);
    setDocumentZoom(1);
  }

  const fittedDocumentSize = selectedDocument?.src && documentNaturalSize.width > 0 && documentViewportSize.width > 0
    ? (() => {
        const availableWidth = Math.max(320, documentViewportSize.width - 150);
        const availableHeight = Math.max(240, documentViewportSize.height - 48);
        const fit = Math.min(availableWidth / documentNaturalSize.width, availableHeight / documentNaturalSize.height);
        return { width: documentNaturalSize.width * fit * documentZoom, height: documentNaturalSize.height * fit * documentZoom };
      })()
    : undefined;

  const documentModal = selectedDocument && (
    <div className="history-document-modal" role="dialog" aria-modal="true" aria-label={selectedDocument.title} onMouseDown={(event) => event.target === event.currentTarget && closeDocument()}>
      {(selectedDocument.showTitle || selectedDocument.showCaption || selectedDocument.showSource) && (
        <div className="history-document-modal-header">
          {selectedDocument.showTitle && <h2>{selectedDocument.displayTitle?.trim() || selectedDocument.title}</h2>}
          {(selectedDocument.showCaption || selectedDocument.showSource) && <small>{[selectedDocument.showCaption ? selectedDocument.caption : "", selectedDocument.showSource ? selectedDocument.source : ""].filter(Boolean).join(" · ")}</small>}
        </div>
      )}
      <div className="history-document-modal-workspace">
        <div className="history-document-modal-viewport">
          <div className="history-document-modal-cluster">
            <div className="history-document-modal-stage">
              {selectedDocument.src ? (
                <img
                  src={selectedDocument.src}
                  alt={selectedDocument.title}
                  className={fittedDocumentSize ? "is-zoom-ready" : undefined}
                  style={fittedDocumentSize ?? { maxWidth: "calc(100vw - 150px)", maxHeight: "calc(100dvh - 48px)" }}
                  onLoad={(event) => setDocumentNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                  onDoubleClick={() => setDocumentZoom((current) => current === 1 ? 2 : 1)}
                />
              ) : <p style={{ fontSize: `${1.2 * documentZoom}rem` }}>{selectedDocument.text}</p>}
            </div>
            <aside className="history-document-modal-sidebar" aria-label="Commandes du document">
              <button type="button" className="history-document-modal-close" onClick={closeDocument} aria-label="Fermer" title="Fermer"><X size={24} /></button>
              <div className="history-document-modal-controls" role="toolbar" aria-label="Zoom du document">
                <button type="button" onClick={() => setDocumentZoom((current) => Math.min(3, current + 0.25))} aria-label="Agrandir" title="Agrandir"><ZoomIn size={20} /></button>
                <span>{Math.round(documentZoom * 100)} %</span>
                <button type="button" onClick={() => setDocumentZoom((current) => Math.max(0.5, current - 0.25))} aria-label="Réduire" title="Réduire"><ZoomOut size={20} /></button>
                <button type="button" onClick={() => setDocumentZoom(1)} aria-label="Réinitialiser le zoom" title="Réinitialiser le zoom"><RotateCcw size={19} /></button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );

  if (activity.canvas?.blocks.length) {
    return (
      <div className="history-reader history-reader-canvas-mode">
        <HistoryCanvasStage
          canvas={activity.canvas}
          documents={documents}
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
          validation={validation}
          statusText={statusText}
          onValidate={validate}
          onOpenDocument={openDocument}
          resetValidation={() => setValidation("idle")}
        />
        {documentModal}
      </div>
    );
  }

  return (
    <div className="history-reader">
      <Card className="history-reader-main">
        <div className="history-reader-heading">
          <span className="activity-type-badge objective-history">{historyOperationLabels[activity.operation]}</span>
          <span className="history-reader-action-label">{historyActionLabels[question.action]}</span>
          <h1>{question.prompt}</h1>
        </div>

        <div
          className={[
            "history-reader-workspace",
            showDocumentPanel || primaryDocument ? "" : "without-documents",
            primaryDocument ? "with-primary-document" : "",
            question.action === "document_hotspot" ? "with-hotspot-document" : ""
          ].filter(Boolean).join(" ")}
        >
          {showDocumentPanel && (
            <aside className="history-reader-documents-panel">
              <span className="history-reader-panel-title">Documents</span>
              <div className="history-reader-documents">
                {linkedDocuments.map((document, index) => (
                  <button key={document.id} type="button" className="history-reader-document-card" onClick={() => openDocument(document)}>
                    <span className="history-reader-document-index">{index + 1}</span>
                    <span className="history-reader-document-media">
                      {document.src ? <img src={document.src} alt={document.title} /> : <FileText size={30} />}
                    </span>
                    {document.showTitle && <strong>{document.displayTitle?.trim() || document.title}</strong>}
                    {document.showCaption && document.caption && <small>{document.caption}</small>}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {primaryDocument && (
            <button type="button" className="history-reader-primary-document" onClick={() => openDocument(primaryDocument)}>
              {primaryDocument.showTitle && <span className="history-reader-panel-title">{primaryDocument.displayTitle?.trim() || primaryDocument.title}</span>}
              <span className="history-reader-primary-document-media">
                {primaryDocument.src ? <img src={primaryDocument.src} alt={primaryDocument.title} /> : <span>{primaryDocument.text}</span>}
              </span>
              {(primaryDocument.showCaption || primaryDocument.showSource) && <small>{[primaryDocument.showCaption ? primaryDocument.caption : "", primaryDocument.showSource ? primaryDocument.source : ""].filter(Boolean).join(" · ")}</small>}
            </button>
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
              onValidate={validate}
              resetValidation={() => setValidation("idle")}
            />

            {statusText && (
              <div className={`history-result ${validation}`}>
                {validation === "correct" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                <strong>{statusText}</strong>
              </div>
            )}

            {question.action !== "cloze_choice" && <div className="history-reader-actions"><Button onClick={validate}>Valider</Button></div>}
          </div>
        </div>
      </Card>

      {documentModal}
    </div>
  );
}

function HistoryCanvasStage({
  canvas,
  documents,
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
  validation,
  statusText,
  onValidate,
  onOpenDocument,
  resetValidation
}: {
  canvas: HistoryActivityCanvas;
  documents: HistorySourceDocument[];
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
  validation: Validation;
  statusText: string;
  onValidate: () => void;
  onOpenDocument: (document: HistorySourceDocument) => void;
  resetValidation: () => void;
}) {
  function renderBlock(block: HistoryCanvasBlock) {
    if (block.type === "document") {
      const document = documents.find((item) => item.id === block.documentId);
      return (
        <button type="button" className="history-canvas-reader-document" disabled={!document} onClick={() => document && onOpenDocument(document)}>
          <HistoryDocumentContent document={document} />
        </button>
      );
    }
    if (block.type === "interaction") {
      return (
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
          onValidate={onValidate}
          resetValidation={resetValidation}
        />
      );
    }
    if (block.type === "validation") return <Button style={historyTextStyleToCss(block.textStyle)} onClick={onValidate}>{block.text || "Valider"}</Button>;
    if (block.type === "feedback") {
      return statusText ? <div className={`history-result ${validation}`}>{validation === "correct" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}<strong>{statusText}</strong></div> : <span className="history-canvas-reader-muted" style={historyTextStyleToCss(block.textStyle)}>{block.text || "Feedback"}</span>;
    }
    return <p style={historyTextStyleToCss(block.textStyle)}>{block.text || question.prompt}</p>;
  }

  function renderScaledBlock(block: HistoryCanvasBlock) {
    if (block.type === "text" || (block.type === "interaction" && question.action === "cloze_choice")) return renderBlock(block);
    const scale = blockScales(block, question);
    const contentSize = blockContentSize(block, question);
    return (
      <div
        className={`history-canvas-scaled-content content-${block.type}`}
        style={{
          width: `${contentSize.width / block.width * 100}%`,
          height: `${contentSize.height / block.height * 100}%`,
          transform: `scale(${scale.x}, ${scale.y})`
        }}
      >
        {renderBlock(block)}
      </div>
    );
  }

  return (
    <div className="history-canvas-stage history-canvas-reader-stage" style={{ background: canvas.background || "#fff" }}>
      {canvas.blocks.filter((block) => question.action !== "cloze_choice" || block.type !== "validation").map((block) => {
        return (
          <div
          key={block.id}
          className={`history-canvas-reader-block block-${block.type}`}
          style={{
            left: `${block.x / canvas.width * 100}%`,
            top: `${block.y / canvas.height * 100}%`,
            width: `${block.width / canvas.width * 100}%`,
            height: `${block.height / canvas.height * 100}%`
          }}
        >
          {renderScaledBlock(block)}
          </div>
        );
      })}
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
  onValidate,
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
  onValidate?: () => void;
  resetValidation: () => void;
}) {
  if (question.action === "choice_single" || question.action === "choice_multiple") {
    return <div className="history-choice-grid">{(question.choices ?? []).map((choice) => <button key={choice.id} type="button" style={historyTextStyleToCss(choice.textStyle)} className={selectedChoices.includes(choice.id) ? "selected" : ""} onClick={() => toggleChoice(choice.id)}>{choice.text}</button>)}</div>;
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
    <HistoryClozeInteraction question={question} answers={clozeAnswers} onAnswersChange={setClozeAnswers} onInteraction={resetValidation} onValidate={onValidate} />
  );
}
