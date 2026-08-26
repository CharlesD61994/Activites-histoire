"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { FileText, MessageSquareText, MousePointer2, PanelTop, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryCanvasBlockType, HistoryChoiceOption, HistoryQuestion, HistorySourceDocument } from "@/types";

type Props = {
  canvas: HistoryActivityCanvas;
  documents: HistorySourceDocument[];
  question: HistoryQuestion;
  onChange: (canvas: HistoryActivityCanvas) => void;
  onQuestionChange: (question: HistoryQuestion) => void;
};

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  block: HistoryCanvasBlock;
};

const blockLabels: Record<HistoryCanvasBlockType, string> = {
  text: "Texte",
  document: "Document",
  interaction: "Interaction",
  validation: "Validation",
  feedback: "Feedback"
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fittedDocumentSize(canvas: HistoryActivityCanvas, naturalWidth: number, naturalHeight: number) {
  const maxWidth = Math.min(760, canvas.width * 0.48);
  const maxHeight = Math.min(610, canvas.height * 0.68);
  const ratio = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1.3;
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    width,
    height,
    aspectRatio: ratio
  };
}

function measureDocument(document: HistorySourceDocument | undefined, canvas: HistoryActivityCanvas) {
  if (!document?.src) return Promise.resolve({ width: 640, height: 460, aspectRatio: undefined });
  return new Promise<{ width: number; height: number; aspectRatio?: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(fittedDocumentSize(canvas, image.naturalWidth, image.naturalHeight));
    image.onerror = () => resolve({ width: 640, height: 460, aspectRatio: undefined });
    image.src = document.src ?? "";
  });
}

function defaultBlock(type: HistoryCanvasBlockType, question: HistoryQuestion, documents: HistorySourceDocument[]): HistoryCanvasBlock {
  const id = crypto.randomUUID();
  if (type === "document") return { id, type, x: 80, y: 190, width: 720, height: 610, documentId: documents[0]?.id };
  if (type === "interaction") return { id, type, x: 900, y: 300, width: 520, height: 150 };
  if (type === "validation") return { id, type, x: 1140, y: 500, width: 260, height: 95, text: "Valider" };
  if (type === "feedback") return { id, type, x: 900, y: 650, width: 520, height: 110, text: "Feedback" };
  return { id, type, x: 80, y: 60, width: 1440, height: 110, text: question.prompt };
}

export function createDefaultHistoryCanvas(question: HistoryQuestion, documents: HistorySourceDocument[]): HistoryActivityCanvas {
  return {
    width: 1600,
    height: 900,
    background: "#ffffff",
    blocks: [
      defaultBlock("text", question, documents),
      ...(documents[0] ? [defaultBlock("document", question, documents)] : []),
      defaultBlock("interaction", question, documents),
      defaultBlock("validation", question, documents)
    ]
  };
}

export function HistoryCanvasEditor({ canvas, documents, question, onChange, onQuestionChange }: Props) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const fittedDocumentsRef = useRef(new Set<string>());
  const [selectedId, setSelectedId] = useState(canvas.blocks[0]?.id ?? "");
  const [drag, setDrag] = useState<DragState | null>(null);
  const selectedBlock = canvas.blocks.find((block) => block.id === selectedId);

  function patchCanvas(patch: Partial<HistoryActivityCanvas>) {
    onChange({ ...canvas, ...patch });
  }

  function updateBlock(id: string, patch: Partial<HistoryCanvasBlock>) {
    patchCanvas({ blocks: canvas.blocks.map((block) => block.id === id ? { ...block, ...patch } : block) });
  }

  function updateQuestion(patch: Partial<HistoryQuestion>) {
    onQuestionChange({ ...question, ...patch });
  }

  function updateChoice(id: string, patch: Partial<HistoryChoiceOption>) {
    updateQuestion({ choices: question.choices?.map((choice) => choice.id === id ? { ...choice, ...patch } : choice) });
  }

  function stopEditingPointer(event: React.PointerEvent) {
    event.stopPropagation();
  }

  async function addBlock(type: HistoryCanvasBlockType) {
    const block = defaultBlock(type, question, documents);
    if (type === "document") {
      const size = await measureDocument(documents[0], canvas);
      block.width = size.width;
      block.height = size.height;
      block.aspectRatio = size.aspectRatio;
    }
    patchCanvas({ blocks: [...canvas.blocks, block] });
    setSelectedId(block.id);
  }

  async function selectDocument(id: string, documentId: string) {
    const document = documents.find((item) => item.id === documentId);
    fittedDocumentsRef.current.add(`${id}:${documentId}:${document?.src?.length ?? 0}`);
    const size = await measureDocument(document, canvas);
    updateBlock(id, { documentId, width: size.width, height: size.height, aspectRatio: size.aspectRatio });
  }

  useEffect(() => {
    let cancelled = false;
    const targets = canvas.blocks.flatMap((block) => {
      if (block.type !== "document") return [];
      const document = documents.find((item) => item.id === block.documentId);
      if (!document?.src) return [];
      const key = `${block.id}:${document.id}:${document.src.length}`;
      if (fittedDocumentsRef.current.has(key)) return [];
      fittedDocumentsRef.current.add(key);
      return [{ block, document }];
    });

    if (targets.length > 0) {
      Promise.all(targets.map(async ({ block, document }) => ({ id: block.id, size: await measureDocument(document, canvas) }))).then((measurements) => {
        if (cancelled) return;
        const sizes = new Map(measurements.map((item) => [item.id, item.size]));
        onChange({
          ...canvas,
          blocks: canvas.blocks.map((block) => {
            const size = sizes.get(block.id);
            return size ? { ...block, width: size.width, height: size.height, aspectRatio: size.aspectRatio } : block;
          })
        });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [canvas, documents, onChange]);

  function removeBlock(id: string) {
    const blocks = canvas.blocks.filter((block) => block.id !== id);
    patchCanvas({ blocks });
    setSelectedId(blocks[0]?.id ?? "");
  }

  function eventToCanvas(event: React.PointerEvent) {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag) return;
    const point = eventToCanvas(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    if (drag.mode === "move") {
      if (Math.hypot(dx, dy) < 4) return;
      updateBlock(drag.id, {
        x: clamp(drag.block.x + dx, 0, canvas.width - drag.block.width),
        y: clamp(drag.block.y + dy, 0, canvas.height - drag.block.height)
      });
      return;
    }
    if (drag.block.type === "document") {
      const scaleX = (drag.block.width + dx) / drag.block.width;
      const scaleY = (drag.block.height + dy) / drag.block.height;
      const desiredScale = Math.abs(scaleX - 1) >= Math.abs(scaleY - 1) ? scaleX : scaleY;
      const minimumScale = Math.max(120 / drag.block.width, 90 / drag.block.height);
      const maximumScale = Math.min(
        (canvas.width - drag.block.x) / drag.block.width,
        (canvas.height - drag.block.y) / drag.block.height
      );
      const scale = clamp(desiredScale, minimumScale, maximumScale);
      updateBlock(drag.id, {
        width: drag.block.width * scale,
        height: drag.block.height * scale
      });
      return;
    }
    updateBlock(drag.id, {
      width: clamp(drag.block.width + dx, 80, canvas.width - drag.block.x),
      height: clamp(drag.block.height + dy, 55, canvas.height - drag.block.y)
    });
  }

  function renderBlock(block: HistoryCanvasBlock) {
    const document = documents.find((item) => item.id === block.documentId);
    if (block.type === "document") {
      return (
        <button type="button" className="history-canvas-reader-document">
          {document?.src ? <img src={document.src} alt={document.title} /> : <span>{document?.text || "Document"}</span>}
        </button>
      );
    }
    if (block.type === "interaction") return <HistoryInteractionEditor question={question} documents={documents} updateChoice={updateChoice} stopEditingPointer={stopEditingPointer} />;
    if (block.type === "validation") return <Button type="button"><span contentEditable suppressContentEditableWarning onPointerDown={stopEditingPointer} onInput={(event) => updateBlock(block.id, { text: event.currentTarget.textContent ?? "" })}>{block.text ?? "Valider"}</span></Button>;
    if (block.type === "feedback") return <span className="history-canvas-reader-muted" contentEditable suppressContentEditableWarning onPointerDown={stopEditingPointer} onInput={(event) => updateBlock(block.id, { text: event.currentTarget.textContent ?? "" })}>{block.text ?? "Feedback"}</span>;
    return <p contentEditable suppressContentEditableWarning onPointerDown={stopEditingPointer} onInput={(event) => updateBlock(block.id, { text: event.currentTarget.textContent ?? "" })}>{block.text || "Texte"}</p>;
  }

  return (
    <section className="history-canvas-editor">
      <div className="history-canvas-toolbar">
        <div>
          <span className="eyebrow">Tableau du lecteur</span>
          <h3>Place les éléments affichés au tableau</h3>
        </div>
        <div className="history-canvas-tools">
          <Button type="button" variant="secondary" onClick={() => addBlock("text")}><MessageSquareText size={16} /> Texte</Button>
          <Button type="button" variant="secondary" onClick={() => addBlock("document")}><FileText size={16} /> Document</Button>
          <Button type="button" variant="secondary" onClick={() => addBlock("interaction")}><MousePointer2 size={16} /> Interaction</Button>
          <Button type="button" variant="secondary" onClick={() => addBlock("validation")}><PanelTop size={16} /> Valider</Button>
        </div>
      </div>

      <div className="history-canvas-layout">
        <div
          className="history-canvas-stage history-canvas-surface"
          ref={surfaceRef}
          style={{ background: canvas.background || "#fff" }}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          {canvas.blocks.map((block) => (
            <div
              key={block.id}
              role="button"
              tabIndex={0}
              className={`history-canvas-block block-${block.type} ${selectedId === block.id ? "selected" : ""}`}
              style={{
                left: `${block.x / canvas.width * 100}%`,
                top: `${block.y / canvas.height * 100}%`,
                width: `${block.width / canvas.width * 100}%`,
                height: block.type === "document" && block.aspectRatio ? "auto" : `${block.height / canvas.height * 100}%`,
                aspectRatio: block.type === "document" ? block.aspectRatio : undefined
              }}
              onPointerDownCapture={(event) => {
                if ((event.target as HTMLElement).closest(".history-canvas-resize")) return;
                const point = eventToCanvas(event);
                setSelectedId(block.id);
                setDrag({ id: block.id, mode: "move", startX: point.x, startY: point.y, block });
              }}
            >
              {renderBlock(block)}
              <span
                className="history-canvas-resize"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  const point = eventToCanvas(event);
                  setSelectedId(block.id);
                  setDrag({ id: block.id, mode: "resize", startX: point.x, startY: point.y, block });
                }}
              />
            </div>
          ))}
        </div>

        <aside className="history-canvas-inspector">
          {selectedBlock ? (
            <>
              <div className="history-canvas-inspector-heading">
                <strong>{blockLabels[selectedBlock.type]}</strong>
                <button type="button" onClick={() => removeBlock(selectedBlock.id)} aria-label="Supprimer le bloc"><Trash2 size={16} /></button>
              </div>
              <p>Modifie le contenu directement dans le tableau. Utilise ces champs seulement pour placer précisément le bloc.</p>
              {selectedBlock.type === "document" && (
                <label className="history-canvas-document-picker">
                  Document
                  <select value={selectedBlock.documentId ?? ""} onChange={(event) => void selectDocument(selectedBlock.id, event.target.value)}>
                    <option value="">Choisir un document</option>
                    {documents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
              )}
              <div className="history-canvas-number-grid">
                <label>X<input type="number" value={Math.round(selectedBlock.x)} onChange={(event) => updateBlock(selectedBlock.id, { x: Number(event.target.value) })} /></label>
                <label>Y<input type="number" value={Math.round(selectedBlock.y)} onChange={(event) => updateBlock(selectedBlock.id, { y: Number(event.target.value) })} /></label>
                <label>Largeur<input type="number" value={Math.round(selectedBlock.width)} onChange={(event) => updateBlock(selectedBlock.id, { width: Number(event.target.value) })} /></label>
                <label>Hauteur<input type="number" value={Math.round(selectedBlock.height)} onChange={(event) => updateBlock(selectedBlock.id, { height: Number(event.target.value) })} /></label>
              </div>
            </>
          ) : <p>Sélectionne un bloc sur le tableau.</p>}
        </aside>
      </div>
    </section>
  );
}

function HistoryInteractionEditor({
  question,
  documents,
  updateChoice,
  stopEditingPointer
}: {
  question: HistoryQuestion;
  documents: HistorySourceDocument[];
  updateChoice: (id: string, patch: Partial<HistoryChoiceOption>) => void;
  stopEditingPointer: (event: React.PointerEvent) => void;
}) {
  if (question.action === "choice_single" || question.action === "choice_multiple") {
    return (
      <div className="history-choice-grid history-canvas-choice-editor">
        {(question.choices ?? []).map((choice) => (
          <button type="button" key={choice.id}>
            <span contentEditable suppressContentEditableWarning onPointerDown={stopEditingPointer} onInput={(event) => updateChoice(choice.id, { text: event.currentTarget.textContent ?? "" })}>{choice.text}</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.action === "classification") {
    return <div className="history-answer-list">{(question.classificationItems ?? []).map((item) => <label key={item.id}>{item.text}<select value="" onPointerDown={stopEditingPointer} onChange={() => undefined}><option value="">Choisir</option>{(question.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>)}</div>;
  }

  if (question.action === "matching") {
    return <div className="history-answer-list">{(question.matchingPrompts ?? []).map((prompt) => <label key={prompt.id}>{prompt.prompt}<select value="" onPointerDown={stopEditingPointer} onChange={() => undefined}><option value="">Associer à...</option>{(question.matchingTargets ?? []).map((target) => <option key={target.id} value={target.id}>{target.text}</option>)}</select></label>)}</div>;
  }

  if (question.action === "chronological_order" || question.action === "timeline") {
    return <div className="history-order-list">{[...(question.timelineEvents ?? [])].sort((a, b) => a.correctOrder - b.correctOrder).map((event) => <div key={event.id}><span>{event.dateLabel && <small>{event.dateLabel}</small>}{event.text}</span><button type="button" onPointerDown={stopEditingPointer}>Monter</button><button type="button" onPointerDown={stopEditingPointer}>Descendre</button></div>)}</div>;
  }

  if (question.action === "document_hotspot") {
    const document = documents.find((item) => question.documentIds.includes(item.id) && item.src);
    return document?.src ? <button type="button" className="history-hotspot-reader"><img src={document.src} alt={document.title} /></button> : <p>Cette action demande un document image ou une carte.</p>;
  }

  if (question.action === "short_text") {
    return (
      <div className="history-short-text-reader">
        <input readOnly value="" placeholder="Écrire un mot ou une courte phrase" onPointerDown={stopEditingPointer} />
      </div>
    );
  }

  return (
    <div className="history-cloze-reader">
      <p>{question.clozeText}</p>
      {(question.clozeBlanks ?? []).map((blank) => <label key={blank.id}>Blanc {blank.label}<select value="" onPointerDown={stopEditingPointer} onChange={() => undefined}><option value="">Choisir</option>{blank.options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}</select></label>)}
    </div>
  );
}
