"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, RotateCcw, X, XCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HistoryCanvasShape } from "@/components/history-canvas-shape";
import { HistoryCanvasVisual } from "@/components/history-canvas-visual";
import { historyCanvasBackgroundStyle } from "@/components/history-canvas-background";
import { historyBoxShadow } from "@/lib/history-shadow";
import { HistoryDocumentContent } from "@/components/history-document-content";
import { HistoryClozeInteraction } from "@/components/history-cloze-interaction";
import { blockContentSize, blockScales, historyInteractionActionAreaHeight, interactionBlockSize, normalizeHistoryCanvasLayout } from "@/lib/history-canvas";
import { evaluateHistoryQuestion } from "@/lib/history-scoring";
import { historyActionLabels, historyOperationLabels, historyOperationStyle } from "@/lib/history-activities";
import { historyTextStyleToCss } from "@/lib/history-text-style";
import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryQuestion, HistorySourceDocument, Sentence } from "@/types";

type Props = {
  sentence: Sentence;
  onPoint: (pointId: string, points: number) => void;
  onCompleteChange?: (complete: boolean) => void;
};

type Validation = "idle" | "correct" | "incorrect";

export function HistoryActivityReader({ sentence, onPoint, onCompleteChange }: Props) {
  const activity = sentence.historyActivity;
  const questions = activity?.questions ?? [];
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const question = questions[activeQuestionIndex] ?? questions[0];
  const [selectedDocument, setSelectedDocument] = useState<HistorySourceDocument | null>(null);
  const [documentZoom, setDocumentZoom] = useState(1);
  const [documentNaturalSize, setDocumentNaturalSize] = useState({ width: 0, height: 0 });
  const [documentViewportSize, setDocumentViewportSize] = useState({ width: 0, height: 0 });
  const [documentControlsPosition, setDocumentControlsPosition] = useState({ left: 0, top: 0 });
  const documentViewportRef = useRef<HTMLDivElement | null>(null);
  const documentStageRef = useRef<HTMLDivElement | null>(null);
  const documentControlsRef = useRef<HTMLElement | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [classificationAnswers, setClassificationAnswers] = useState<Record<string, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [eventOrder, setEventOrder] = useState<string[]>(() => question?.timelineEvents?.slice().sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id).reverse() ?? []);
  const [hotspotAnswer, setHotspotAnswer] = useState<{ x: number; y: number } | null>(null);
  const [clozeAnswers, setClozeAnswers] = useState<Record<string, string>>({});
  const [shortTextAnswer, setShortTextAnswer] = useState("");
  const [validation, setValidation] = useState<Validation>("idle");
  const [attemptCount, setAttemptCount] = useState(0);
  const [earnedItemIds, setEarnedItemIds] = useState<string[]>([]);
  const [checkedCorrectItemIds, setCheckedCorrectItemIds] = useState<string[]>([]);
  const [checkedWrongItemIds, setCheckedWrongItemIds] = useState<string[]>([]);
  const [awaitingRetry, setAwaitingRetry] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const documents = activity?.documents ?? [];
  const activeOperation = question?.operation ?? activity?.operation;
  const savedCanvas = question?.canvas ?? activity?.canvas;
  const activeCanvas = useMemo(
    () => question && savedCanvas ? normalizeHistoryCanvasLayout(savedCanvas, question) : savedCanvas,
    [question, savedCanvas]
  );
  const questionComplete = validation === "correct" || (validation === "incorrect" && revealed);
  const hasNextQuestion = activeQuestionIndex < questions.length - 1;
  const primaryActionLabel = questionComplete && hasNextQuestion ? "Question suivante" : awaitingRetry ? "Réessayer" : "Valider";
  const linkedDocuments = question?.documentIds.length
    ? documents.filter((document) => question.documentIds.includes(document.id))
    : documents;
  const hotspotDocument = documents.find((document) => document.id === question?.hotspot?.documentId);
  const showDocumentPanel = linkedDocuments.length > 1;
  const primaryDocument = linkedDocuments.length === 1 && question?.action !== "document_hotspot" ? linkedDocuments[0] : null;

  const statusText = useMemo(() => {
    if (validation === "correct") return question?.feedbackCorrect || "Bonne réponse.";
    if (validation === "incorrect" && revealed) return "Les réponses restantes sont révélées.";
    if (validation === "incorrect" && awaitingRetry) return "Certaines réponses sont à corriger. Clique sur Réessayer pour garder les bonnes réponses et enlever les mauvaises.";
    if (validation === "incorrect") return attemptCount >= 1 ? "Dernière chance: corrige ce qui reste." : question?.feedbackIncorrect || "Pas encore. On ajuste ensemble, puis on réessaie.";
    return "";
  }, [attemptCount, awaitingRetry, question, revealed, validation]);

  useEffect(() => {
    setActiveQuestionIndex(0);
  }, [sentence.id]);

  useEffect(() => {
    setSelectedChoices([]);
    setClassificationAnswers({});
    setMatchingAnswers({});
    setEventOrder(question?.timelineEvents?.slice().sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id).reverse() ?? []);
    setHotspotAnswer(null);
    setClozeAnswers({});
    setShortTextAnswer("");
    setValidation("idle");
    setAttemptCount(0);
    setEarnedItemIds([]);
    setCheckedCorrectItemIds([]);
    setCheckedWrongItemIds([]);
    setAwaitingRetry(false);
    setRevealed(false);
    onCompleteChange?.(false);
  }, [onCompleteChange, question]);

  useEffect(() => {
    if (!selectedDocument) return;
    function updateViewportSize() {
      setDocumentViewportSize({ width: window.innerWidth, height: window.innerHeight });
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedDocument(null);
      if (event.key === "+" || event.key === "=" || event.key === "-") {
        event.preventDefault();
        setDocumentZoom((current) => event.key === "-" ? Math.max(0.5, current - 0.25) : Math.min(3, current + 0.25));
      }
    }
    updateViewportSize();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateViewportSize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateViewportSize);
    };
  }, [selectedDocument]);

  useLayoutEffect(() => {
    if (!selectedDocument) return;
    function positionDocumentControls() {
      const viewport = documentViewportRef.current;
      const stage = documentStageRef.current;
      const controls = documentControlsRef.current;
      if (!viewport || !stage || !controls) return;

      const viewportRect = viewport.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      const gap = 10;
      const edge = 14;
      const viewportRight = viewportRect.left + viewport.clientWidth;
      const rightLimit = Math.min(viewportRight - edge, window.innerWidth - edge);
      const leftLimit = Math.max(viewportRect.left + edge, edge);
      const candidates = [
        stageRect.right + gap,
        stageRect.left - controlsRect.width - gap,
        rightLimit - controlsRect.width
      ];
      const left = candidates.find((candidate) => candidate >= leftLimit && candidate + controlsRect.width <= rightLimit)
        ?? Math.max(leftLimit, rightLimit - controlsRect.width);
      const top = Math.min(
        Math.max(edge, stageRect.top + (stageRect.height - controlsRect.height) / 2),
        Math.max(edge, window.innerHeight - controlsRect.height - edge)
      );
      setDocumentControlsPosition({ left, top });
    }

    positionDocumentControls();
    const viewport = documentViewportRef.current;
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(positionDocumentControls) : null;
    if (viewport) viewport.addEventListener("scroll", positionDocumentControls, { passive: true });
    window.addEventListener("resize", positionDocumentControls);
    observer?.observe(document.body);
    return () => {
      viewport?.removeEventListener("scroll", positionDocumentControls);
      window.removeEventListener("resize", positionDocumentControls);
      observer?.disconnect();
    };
  }, [documentNaturalSize, documentZoom, selectedDocument]);

  if (!activity || !question) {
    return <Card><h2>Activité d’histoire incomplète</h2><p>Retourne dans l’éditeur pour ajouter une question.</p></Card>;
  }

  const earnedItemSet = new Set(earnedItemIds);
  const earnedAnswerLocked = earnedItemSet.has("answer");
  const isSingleChoiceAction = question.action === "choice_single" || question.action === "true_false" || question.action === "reference_point";
  const isMultipleChoiceAction = question.action === "choice_multiple" || question.action === "image_selection";

  function toggleChoice(id: string) {
    if (!question) return;
    if (revealed || awaitingRetry) return;
    if (isSingleChoiceAction && earnedAnswerLocked) return;
    if (isMultipleChoiceAction && earnedItemSet.has(`choice:${id}`)) return;
    setValidation("idle");
    if (isSingleChoiceAction) {
      setSelectedChoices([id]);
      return;
    }
    setSelectedChoices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function moveEvent(id: string, direction: -1 | 1) {
    if (revealed || awaitingRetry || earnedItemSet.has(`timeline:${id}`)) return;
    setValidation("idle");
    setEventOrder((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      if (earnedItemSet.has(`timeline:${current[target]}`)) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function validate() {
    if (!question) return;
    if (revealed) return;
    if (awaitingRetry) {
      prepareRetry();
      return;
    }
    const attempt = Math.min(attemptCount + 1, 2);
    const result = evaluateHistoryQuestion(question, {
      selectedChoices,
      classificationAnswers,
      matchingAnswers,
      eventOrder,
      hotspotAnswer,
      clozeAnswers,
      shortTextAnswer
    });
    const currentEarned = new Set(earnedItemIds);
    const newlyCorrect = result.correctItemIds.filter((id) => !currentEarned.has(id));
    const pointsPerItem = attempt === 1 ? 1 : 0.5;
    newlyCorrect.forEach((itemId) => onPoint(`history-${question.id}-${itemId}`, pointsPerItem));
    const nextEarned = Array.from(new Set([...earnedItemIds, ...newlyCorrect]));
    const allEarned = result.allItemIds.length > 0 && result.allItemIds.every((id) => nextEarned.includes(id));
    const shouldReveal = !allEarned && attempt >= 2;

    setAttemptCount(attempt);
    setEarnedItemIds(nextEarned);
    setCheckedCorrectItemIds(result.correctItemIds);
    setCheckedWrongItemIds(result.wrongItemIds);
    setRevealed(shouldReveal);
    setAwaitingRetry(!allEarned && !shouldReveal);
    setValidation(allEarned ? "correct" : "incorrect");
    if (allEarned || shouldReveal) {
      onCompleteChange?.(!hasNextQuestion);
    }
  }

  function goToNextQuestion() {
    if (!hasNextQuestion) return;
    setActiveQuestionIndex((current) => Math.min(questions.length - 1, current + 1));
  }

  function handlePrimaryAction() {
    if (questionComplete && hasNextQuestion) {
      goToNextQuestion();
      return;
    }
    validate();
  }

  function prepareRetry() {
    if (!question) return;
    const earned = new Set(earnedItemIds);
    setSelectedChoices((current) => {
      if (question.action === "choice_single" || question.action === "true_false" || question.action === "reference_point") return earned.has("answer") ? current : [];
      if (question.action === "choice_multiple" || question.action === "image_selection") return current.filter((id) => earned.has(`choice:${id}`));
      return current;
    });
    setClassificationAnswers((current) => Object.fromEntries(
      Object.entries(current).filter(([id]) => earned.has(`classification:${id}`))
    ));
    setMatchingAnswers((current) => Object.fromEntries(
      Object.entries(current).filter(([id]) => earned.has(`matching:${id}`))
    ));
    if (question.action === "document_hotspot" && !earned.has("answer")) setHotspotAnswer(null);
    if (question.action === "short_text" && !earned.has("answer")) setShortTextAnswer("");
    setClozeAnswers((current) => Object.fromEntries(
      Object.entries(current).filter(([blankId]) => earned.has(`cloze:${blankId}`))
    ));
    setCheckedCorrectItemIds([]);
    setCheckedWrongItemIds([]);
    setAwaitingRetry(false);
    setValidation("idle");
  }

  function resetAnswers() {
    if (!question) return;
    setSelectedChoices([]);
    setClassificationAnswers({});
    setMatchingAnswers({});
    setEventOrder(question.timelineEvents?.slice().sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id).reverse() ?? []);
    setHotspotAnswer(null);
    setClozeAnswers({});
    setShortTextAnswer("");
    setValidation("idle");
    setAttemptCount(0);
    setEarnedItemIds([]);
    setCheckedCorrectItemIds([]);
    setCheckedWrongItemIds([]);
    setAwaitingRetry(false);
    setRevealed(false);
    onCompleteChange?.(false);
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
        <div className="history-document-modal-viewport" ref={documentViewportRef}>
          <div className="history-document-modal-scroll-content">
            <div className="history-document-modal-stage" ref={documentStageRef}>
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
          </div>
        </div>
        <aside ref={documentControlsRef} className="history-document-modal-floating-tools" style={{ left: documentControlsPosition.left, top: documentControlsPosition.top }} aria-label="Commandes du document">
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
  );

  if (activeCanvas?.blocks.length) {
    return (
      <div className="history-reader history-reader-canvas-mode">
        {questions.length > 1 && (
          <div className="history-reader-sequence-nav">
            <button type="button" onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))} disabled={activeQuestionIndex === 0} aria-label="Question précédente">
              <ChevronLeft size={18} />
            </button>
            <span>Question {activeQuestionIndex + 1} / {questions.length}</span>
            <button type="button" onClick={goToNextQuestion} disabled={!questionComplete || !hasNextQuestion} aria-label="Question suivante">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        <HistoryCanvasStage
          canvas={activeCanvas}
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
          earnedItemIds={earnedItemIds}
          checkedCorrectItemIds={checkedCorrectItemIds}
          checkedWrongItemIds={checkedWrongItemIds}
          awaitingRetry={awaitingRetry}
          revealed={revealed}
          onValidate={handlePrimaryAction}
          onReset={resetAnswers}
          primaryActionLabel={primaryActionLabel}
          onOpenDocument={openDocument}
          resetValidation={() => !revealed && setValidation("idle")}
        />
        {documentModal}
      </div>
    );
  }

  return (
    <div className="history-reader">
      <Card className="history-reader-main">
        <div className="history-reader-heading">
          {activeOperation && <span className="activity-type-badge objective-history" style={historyOperationStyle(activeOperation)}>{historyOperationLabels[activeOperation]}</span>}
          <span className="history-reader-action-label">{historyActionLabels[question.action]}</span>
          {questions.length > 1 && <span className="history-reader-action-label">Question {activeQuestionIndex + 1} / {questions.length}</span>}
          <h1>{sentence.title}</h1>
          <p className="history-reader-question-lead">{question.prompt}</p>
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
              documents={documents}
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
              earnedItemIds={earnedItemIds}
              checkedCorrectItemIds={checkedCorrectItemIds}
              checkedWrongItemIds={checkedWrongItemIds}
              awaitingRetry={awaitingRetry}
              revealed={revealed}
              onValidate={handlePrimaryAction}
              onReset={resetAnswers}
              primaryActionLabel={primaryActionLabel}
              resetValidation={() => !revealed && setValidation("idle")}
            />

            {statusText && (
              <div className={`history-result ${validation}`}>
                {validation === "correct" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                <strong>{statusText}</strong>
              </div>
            )}
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
  earnedItemIds,
  checkedCorrectItemIds,
  checkedWrongItemIds,
  awaitingRetry,
  revealed,
  onValidate,
  onReset,
  primaryActionLabel,
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
  setHotspotAnswer: (answer: { x: number; y: number } | null) => void;
  clozeAnswers: Record<string, string>;
  setClozeAnswers: (next: Record<string, string>) => void;
  shortTextAnswer: string;
  setShortTextAnswer: (next: string) => void;
  validation: Validation;
  statusText: string;
  earnedItemIds: string[];
  checkedCorrectItemIds: string[];
  checkedWrongItemIds: string[];
  awaitingRetry: boolean;
  revealed: boolean;
  onValidate: () => void;
  onReset: () => void;
  primaryActionLabel: string;
  onOpenDocument: (document: HistorySourceDocument) => void;
  resetValidation: () => void;
}) {
  function renderBlock(block: HistoryCanvasBlock) {
    if (block.type === "shape") return <HistoryCanvasShape {...block} />;
    if (block.type === "visual") return <HistoryCanvasVisual {...block} />;
    if (block.type === "document") {
      const document = documents.find((item) => item.id === block.documentId);
      return (
        <button
          type="button"
          className="history-canvas-reader-document"
          disabled={!document}
          onClick={() => document && onOpenDocument(document)}
          style={{
            boxShadow: block.documentShadowEnabled
              ? historyBoxShadow(block.documentShadowColor ?? "#123f59", block.documentShadowDistance ?? 8, block.documentShadowOpacity ?? 0.8)
              : undefined
          }}
        >
          <HistoryDocumentContent document={document} />
        </button>
      );
    }
    if (block.type === "interaction") {
      return (
        <HistoryQuestionInteraction
          question={question}
          documents={documents}
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
          earnedItemIds={earnedItemIds}
          checkedCorrectItemIds={checkedCorrectItemIds}
          checkedWrongItemIds={checkedWrongItemIds}
          awaitingRetry={awaitingRetry}
          revealed={revealed}
          onValidate={onValidate}
          onReset={onReset}
          primaryActionLabel={primaryActionLabel}
          proportionalActions
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
    if (block.type === "text" || block.type === "shape" || block.type === "visual" || (block.type === "interaction" && question.action === "cloze_choice")) return renderBlock(block);
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
    <div className="history-canvas-stage history-canvas-reader-stage" style={{ backgroundColor: canvas.background || "#fff", ...historyCanvasBackgroundStyle(canvas) }}>
      {canvas.blocks.filter((block) => block.type !== "validation").map((block) => {
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
  documents,
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
  earnedItemIds,
  checkedCorrectItemIds,
  checkedWrongItemIds,
  awaitingRetry,
  revealed,
  onValidate,
  onReset,
  primaryActionLabel,
  proportionalActions = false,
  resetValidation
}: {
  question: HistoryQuestion;
  documents: HistorySourceDocument[];
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
  setHotspotAnswer: (answer: { x: number; y: number } | null) => void;
  clozeAnswers: Record<string, string>;
  setClozeAnswers: (next: Record<string, string>) => void;
  shortTextAnswer: string;
  setShortTextAnswer: (next: string) => void;
  earnedItemIds?: string[];
  checkedCorrectItemIds?: string[];
  checkedWrongItemIds?: string[];
  awaitingRetry?: boolean;
  revealed?: boolean;
  onValidate?: () => void;
  onReset?: () => void;
  primaryActionLabel?: string;
  proportionalActions?: boolean;
  resetValidation: () => void;
}) {
  const earned = new Set(earnedItemIds ?? []);
  const checkedCorrect = new Set(checkedCorrectItemIds ?? []);
  const checkedWrong = new Set(checkedWrongItemIds ?? []);

  function withReaderActions(content: ReactNode) {
    const proportionalStyle = proportionalActions
      ? { "--history-interaction-footer-ratio": `${historyInteractionActionAreaHeight / interactionBlockSize(question).height * 100}%` } as React.CSSProperties
      : undefined;
    return (
      <div className={`history-reader-interaction-stack ${proportionalActions ? "history-canvas-proportional-interaction" : ""} ${question.action === "true_false" ? "history-true-false-stack" : ""}`} style={proportionalStyle}>
        <div className="history-reader-interaction-body">{content}</div>
        <div className="history-reader-actions">
          <button type="button" className="history-reader-reset" onClick={onReset} aria-label="Réinitialiser" title="Réinitialiser"><RotateCcw size={20} /></button>
          <Button type="button" onClick={onValidate}>{primaryActionLabel ?? (awaitingRetry ? "Réessayer" : "Valider")}</Button>
        </div>
      </div>
    );
  }

  if (question.action === "choice_single" || question.action === "choice_multiple" || question.action === "true_false" || question.action === "image_selection" || question.action === "reference_point") {
    const imageMode = question.action === "image_selection";
    const referenceMode = question.action === "reference_point";
    const choiceContent = (
      <div className={imageMode ? "history-image-choice-grid" : referenceMode ? "history-reference-choice-grid" : question.action === "true_false" ? "history-choice-grid history-true-false-grid" : "history-choice-grid"}>
        {referenceMode && <strong className="history-reference-point-label">{question.acceptedTextAnswers?.[0] ?? "Repère"}</strong>}
        {(question.choices ?? []).map((choice) => {
      const correct = Boolean(choice.isCorrect);
      const singleChoice = question.action === "choice_single" || question.action === "true_false" || question.action === "reference_point";
      const itemId = singleChoice ? "answer" : `choice:${choice.id}`;
      const locked = earned.has(itemId) || Boolean(revealed);
      const correctSelected = correct && selectedChoices.includes(choice.id);
      const good = singleChoice
        ? (earned.has(itemId) || checkedCorrect.has(itemId)) && correctSelected
        : earned.has(itemId) || checkedCorrect.has(itemId);
      const wrong = selectedChoices.includes(choice.id) && (!correct || checkedWrong.has(`choice-wrong:${choice.id}`)) && Boolean(awaitingRetry || revealed);
      const document = documents.find((item) => item.id === choice.documentId);
      return (
        <button key={choice.id} type="button" style={historyTextStyleToCss(choice.textStyle)} className={[selectedChoices.includes(choice.id) ? "selected" : "", good ? "earned" : "", wrong ? "wrong" : "", revealed && correct ? "revealed" : ""].filter(Boolean).join(" ")} disabled={Boolean(awaitingRetry) || (locked && !selectedChoices.includes(choice.id))} onClick={() => toggleChoice(choice.id)}>
          {imageMode && <span className="history-image-choice-media">{document?.src ? <img src={document.src} alt="" /> : <FileText size={32} />}</span>}
          <span>{choice.text}</span>
        </button>
      );
        })}
      </div>
    );
    return withReaderActions(choiceContent);
  }

  if (question.action === "classification" || question.action === "sort_categories") {
    return withReaderActions(<div className="history-answer-list">{(question.classificationItems ?? []).map((item) => {
      const itemId = `classification:${item.id}`;
      const locked = earned.has(itemId) || Boolean(revealed);
      const value = locked ? item.correctCategoryId : classificationAnswers[item.id] ?? "";
      return <label key={item.id} className={earned.has(itemId) || checkedCorrect.has(itemId) ? "earned" : checkedWrong.has(itemId) ? "wrong" : revealed ? "revealed" : ""}><span>{item.text}</span><select value={value} disabled={locked || Boolean(awaitingRetry)} onChange={(event) => { resetValidation(); setClassificationAnswers({ ...classificationAnswers, [item.id]: event.target.value }); }}><option value="">Choisir</option>{(question.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>;
    })}</div>);
  }

  if (question.action === "matching" || question.action === "table_fill") {
    const tableMode = question.action === "table_fill";
    return withReaderActions(<div className={tableMode ? "history-table-fill-list" : "history-answer-list"}>{(question.matchingPrompts ?? []).map((prompt) => {
      const itemId = `matching:${prompt.id}`;
      const locked = earned.has(itemId) || Boolean(revealed);
      const value = locked ? prompt.correctTargetId : matchingAnswers[prompt.id] ?? "";
      return <label key={prompt.id} className={earned.has(itemId) || checkedCorrect.has(itemId) ? "earned" : checkedWrong.has(itemId) ? "wrong" : revealed ? "revealed" : ""}><span>{prompt.prompt}</span><select value={value} disabled={locked || Boolean(awaitingRetry)} onChange={(event) => { resetValidation(); setMatchingAnswers({ ...matchingAnswers, [prompt.id]: event.target.value }); }}><option value="">{tableMode ? "Compléter" : "Associer à..."}</option>{(question.matchingTargets ?? []).map((target) => <option key={target.id} value={target.id}>{target.text}</option>)}</select></label>;
    })}</div>);
  }

  if (question.action === "chronological_order" || question.action === "timeline" || question.action === "arrange_order") {
    const eventsById = new Map((question.timelineEvents ?? []).map((event) => [event.id, event]));
    const order = revealed ? [...(question.timelineEvents ?? [])].sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id) : eventOrder;
    return withReaderActions(<div className="history-order-list">{order.map((id) => {
      const event = eventsById.get(id);
      if (!event) return null;
      const itemId = `timeline:${id}`;
      const locked = earned.has(itemId) || Boolean(revealed);
      return <div key={id} className={earned.has(itemId) || checkedCorrect.has(itemId) ? "earned" : checkedWrong.has(itemId) ? "wrong" : revealed ? "revealed" : ""}><span>{event.dateLabel && <small>{event.dateLabel}</small>}{event.text}</span><button type="button" disabled={locked || Boolean(awaitingRetry)} onClick={() => moveEvent(id, -1)}>Monter</button><button type="button" disabled={locked || Boolean(awaitingRetry)} onClick={() => moveEvent(id, 1)}>Descendre</button></div>;
    })}</div>);
  }

  if (question.action === "document_hotspot") {
    return withReaderActions(hotspotDocument?.src ? (
      <button type="button" className={`history-hotspot-reader ${earned.has("answer") || checkedCorrect.has("answer") ? "earned" : (awaitingRetry || revealed) && hotspotAnswer ? "wrong" : ""}`} onClick={(event) => {
        if (revealed || earned.has("answer")) return;
        if (awaitingRetry) return;
        resetValidation();
        const rect = event.currentTarget.getBoundingClientRect();
        setHotspotAnswer({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
      }}>
        <img src={hotspotDocument.src} alt={hotspotDocument.title} />
        {hotspotAnswer && <span style={{ left: `${hotspotAnswer.x}%`, top: `${hotspotAnswer.y}%` }} />}
        {revealed && question.hotspot && <span className="revealed-hotspot" style={{ left: `${question.hotspot.x}%`, top: `${question.hotspot.y}%` }} />}
      </button>
    ) : <p>Cette action demande un document image ou une carte.</p>);
  }

  if (question.action === "short_text") {
    return withReaderActions(
      <div className="history-short-text-reader">
        <input
          value={revealed ? question.acceptedTextAnswers?.[0] ?? shortTextAnswer : shortTextAnswer}
          className={earned.has("answer") || checkedCorrect.has("answer") ? "earned" : awaitingRetry && shortTextAnswer ? "wrong" : ""}
          readOnly={earned.has("answer") || Boolean(awaitingRetry) || Boolean(revealed)}
          onChange={(event) => {
            resetValidation();
            setShortTextAnswer(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder={revealed ? question.acceptedTextAnswers?.[0] ?? "Réponse révélée" : "Écrire un mot ou une courte phrase"}
        />
      </div>
    );
  }

  return (
    <HistoryClozeInteraction question={question} answers={clozeAnswers} onAnswersChange={setClozeAnswers} onInteraction={resetValidation} onValidate={onValidate} primaryActionLabel={primaryActionLabel} lockedBlankIds={earnedItemIds?.filter((id) => id.startsWith("cloze:")).map((id) => id.slice("cloze:".length))} checkedCorrectBlankIds={checkedCorrectItemIds?.filter((id) => id.startsWith("cloze:")).map((id) => id.slice("cloze:".length))} checkedWrongBlankIds={checkedWrongItemIds?.filter((id) => id.startsWith("cloze:")).map((id) => id.slice("cloze:".length))} awaitingRetry={awaitingRetry} revealAnswers={revealed} />
  );
}
