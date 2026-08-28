"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowRight, Bold, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Circle, Copy, FileText, Image as ImageIcon, Italic, Layers3, Map as MapIcon, Maximize2, MessageSquareText, Minus, Minimize2, MousePointer2, PanelTop, Plus, RectangleHorizontal, Shapes, Square, Trash2, Triangle, Underline, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistoryCanvasShape } from "@/components/history-canvas-shape";
import { HistoryDocumentContent } from "@/components/history-document-content";
import { HistoryClozeInteraction } from "@/components/history-cloze-interaction";
import { blockContentSize, blockScales, historyCanvasLayoutVersion, interactionBlockSize, reorderHistoryCanvasBlock, resizeHistoryCanvasBlock, type HistoryLayerAction, type HistoryResizeHandle } from "@/lib/history-canvas";
import { historyBoxShadow } from "@/lib/history-shadow";
import { historyActionDescriptions, historyActionLabels } from "@/lib/history-activities";
import { defaultHistoryTextStyle, historyTextStyleToCss } from "@/lib/history-text-style";
import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryCanvasBlockType, HistoryCanvasShapeFillMode, HistoryCanvasShapeKind, HistoryChoiceOption, HistoryInteractiveAction, HistoryQuestion, HistorySourceDocument, HistoryTextStyle } from "@/types";

type Props = {
  canvas: HistoryActivityCanvas;
  documents: HistorySourceDocument[];
  question: HistoryQuestion;
  onChange: (canvas: HistoryActivityCanvas) => void;
  onQuestionChange: (question: HistoryQuestion) => void;
  availableActions: HistoryInteractiveAction[];
  onActionChange: (action: HistoryInteractiveAction) => void;
  onAddDocument: (document: HistorySourceDocument) => void;
  onUpdateDocument: (id: string, patch: Partial<HistorySourceDocument>) => void;
  onDeleteDocument: (id: string) => void;
  contextPanel?: React.ReactNode;
};

type DragState = {
  id: string;
  mode: "move" | "resize";
  handle?: HistoryResizeHandle;
  startX: number;
  startY: number;
  block: HistoryCanvasBlock;
};

type TextTarget =
  | { kind: "block"; id: string }
  | { kind: "choice"; id: string; blockId: string };

const resizeHandles: HistoryResizeHandle[] = ["n", "e", "s", "w", "ne", "se", "sw", "nw"];
const proportionalResizeHandles: HistoryResizeHandle[] = ["ne", "se", "sw", "nw"];

function resizeHandlesForBlock(block: HistoryCanvasBlock) {
  return block.type === "shape" && block.shapeKind === "triangle" ? proportionalResizeHandles : resizeHandles;
}

const blockLabels: Record<HistoryCanvasBlockType, string> = {
  text: "Texte",
  document: "Document",
  shape: "Forme",
  interaction: "Interaction",
  validation: "Validation",
  feedback: "Feedback"
};

const shapeOptions = [
  { kind: "rectangle", label: "Rectangle", icon: Square, width: 360, height: 220 },
  { kind: "rounded_rectangle", label: "Rectangle arrondi", icon: RectangleHorizontal, width: 360, height: 220 },
  { kind: "circle", label: "Cercle", icon: Circle, width: 240, height: 240 },
  { kind: "triangle", label: "Triangle", icon: Triangle, width: 280, height: 240 },
  { kind: "line", label: "Ligne", icon: Minus, width: 360, height: 36 },
  { kind: "arrow", label: "Flèche", icon: ArrowRight, width: 360, height: 110 }
] satisfies Array<{ kind: HistoryCanvasShapeKind; label: string; icon: typeof Square; width: number; height: number }>;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readerFullscreenStageHeight() {
  const fullscreenOffset = window.screen.height <= 760 ? 88 : 104;
  return window.screen.height - fullscreenOffset;
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
  if (type === "document") return { id, type, x: 80, y: 190, width: 720, height: 610, contentWidth: 720, contentHeight: 610, documentId: documents[0]?.id, documentShadowEnabled: false, documentShadowColor: "#123f59", documentShadowDistance: 8, documentShadowOpacity: 0.8 };
  if (type === "shape") return { id, type, x: 620, y: 340, width: 360, height: 220, contentWidth: 360, contentHeight: 220, shapeKind: "rectangle", shapeFillMode: "filled", shapeFillColor: "#d9eef8", shapeFillOpacity: 1, shapeStrokeColor: "#0b4a6f", shapeStrokeWidth: 3, shapeShadowEnabled: false, shapeShadowColor: "#123f59", shapeShadowDistance: 8, shapeShadowOpacity: 0.8 };
  if (type === "interaction") {
    const size = interactionBlockSize(question);
    return { id, type, x: Math.min(900, 1600 - size.width), y: 300, ...size, contentWidth: size.width, contentHeight: size.height };
  }
  if (type === "validation") return { id, type, x: 1140, y: 500, width: 260, height: 95, contentWidth: 260, contentHeight: 95, text: "Valider" };
  if (type === "feedback") return { id, type, x: 900, y: 650, width: 520, height: 110, contentWidth: 520, contentHeight: 110, text: "Feedback" };
  return { id, type, x: 80, y: 60, width: 1440, height: 110, contentWidth: 1440, contentHeight: 110, text: question.prompt };
}

function defaultShapeBlock(kind: HistoryCanvasShapeKind, canvas: HistoryActivityCanvas): HistoryCanvasBlock {
  const option = shapeOptions.find((item) => item.kind === kind) ?? shapeOptions[0];
  return {
    id: crypto.randomUUID(),
    type: "shape",
    x: Math.max(0, (canvas.width - option.width) / 2),
    y: Math.max(0, (canvas.height - option.height) / 2),
    width: option.width,
    height: option.height,
    contentWidth: option.width,
    contentHeight: option.height,
    shapeKind: kind,
    shapeFillMode: kind === "line" ? "outline" : "filled",
    shapeFillColor: "#d9eef8",
    shapeFillOpacity: 1,
    shapeStrokeColor: "#0b4a6f",
    shapeStrokeWidth: 3,
    shapeShadowEnabled: false,
    shapeShadowColor: "#123f59",
    shapeShadowDistance: 8,
    shapeShadowOpacity: 0.8
  };
}

export function createDefaultHistoryCanvas(question: HistoryQuestion, documents: HistorySourceDocument[]): HistoryActivityCanvas {
  return {
    width: 1600,
    height: 900,
    background: "#ffffff",
    layoutVersion: historyCanvasLayoutVersion,
    blocks: [
      defaultBlock("text", question, documents),
      ...(documents[0] ? [defaultBlock("document", question, documents)] : []),
      defaultBlock("interaction", question, documents),
      defaultBlock("validation", question, documents)
    ]
  };
}

export function HistoryCanvasEditor({ canvas, documents, question, onChange, onQuestionChange, availableActions, onActionChange, onAddDocument, onUpdateDocument, onDeleteDocument, contextPanel }: Props) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const fittedDocumentsRef = useRef(new Set<string>());
  const [selectedId, setSelectedId] = useState("");
  const [inspectedId, setInspectedId] = useState("");
  const [textTarget, setTextTarget] = useState<TextTarget | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [interactionMenuOpen, setInteractionMenuOpen] = useState(false);
  const [resourceMenuOpen, setResourceMenuOpen] = useState(false);
  const [documentLibraryOpen, setDocumentLibraryOpen] = useState(false);
  const [isSurfaceExpanded, setIsSurfaceExpanded] = useState(false);
  const [expandedSurfaceHeight, setExpandedSurfaceHeight] = useState(0);
  const inspectedBlock = canvas.blocks.find((block) => block.id === inspectedId);
  const activeTextStyle = textTarget?.kind === "block"
    ? canvas.blocks.find((block) => block.id === textTarget.id)?.textStyle
    : question.choices?.find((choice) => choice.id === textTarget?.id)?.textStyle;

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

  function activateTextEditing(event: React.PointerEvent | React.FocusEvent, target: TextTarget) {
    event.stopPropagation();
    setResourceMenuOpen(false);
    setDocumentLibraryOpen(false);
    setInteractionMenuOpen(false);
    setTextTarget(target);
    setSelectedId(target.kind === "block" ? target.id : target.blockId);
  }

  function updateActiveTextStyle(patch: Partial<HistoryTextStyle>) {
    if (!textTarget) return;
    if (textTarget.kind === "block") {
      const block = canvas.blocks.find((item) => item.id === textTarget.id);
      if (block) updateBlock(block.id, { textStyle: { ...block.textStyle, ...patch } });
      return;
    }
    const choice = question.choices?.find((item) => item.id === textTarget.id);
    if (choice) updateChoice(choice.id, { textStyle: { ...choice.textStyle, ...patch } });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTextTarget(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isSurfaceExpanded) return;
    function updateExpandedSurfaceHeight() {
      setExpandedSurfaceHeight(readerFullscreenStageHeight());
    }
    updateExpandedSurfaceHeight();
    window.addEventListener("resize", updateExpandedSurfaceHeight);
    return () => window.removeEventListener("resize", updateExpandedSurfaceHeight);
  }, [isSurfaceExpanded]);

  function toggleExpandedSurface() {
    setResourceMenuOpen(false);
    setDocumentLibraryOpen(false);
    setInteractionMenuOpen(false);
    setIsSurfaceExpanded((expanded) => {
      if (!expanded) setExpandedSurfaceHeight(readerFullscreenStageHeight());
      return !expanded;
    });
  }

  async function addBlock(type: HistoryCanvasBlockType) {
    const block = defaultBlock(type, question, documents);
    if (type === "document") {
      const size = await measureDocument(documents[0], canvas);
      block.width = size.width;
      block.height = size.height;
      block.contentWidth = size.width;
      block.contentHeight = size.height;
      block.aspectRatio = size.aspectRatio;
    }
    patchCanvas({ blocks: [...canvas.blocks, block] });
    setSelectedId(block.id);
    setInspectedId("");
    setTextTarget(null);
  }

  function addShape(kind: HistoryCanvasShapeKind) {
    const block = defaultShapeBlock(kind, canvas);
    patchCanvas({ blocks: [...canvas.blocks, block] });
    setSelectedId(block.id);
    setInspectedId("");
    setTextTarget(null);
    setResourceMenuOpen(false);
  }

  async function addDocumentBlock(document: HistorySourceDocument) {
    const block = defaultBlock("document", question, [document]);
    const size = await measureDocument(document, canvas);
    const documentBlockCount = canvas.blocks.filter((item) => item.type === "document").length;
    block.x = Math.min(120 + documentBlockCount * 36, canvas.width - size.width);
    block.y = Math.min(180 + documentBlockCount * 36, canvas.height - size.height);
    block.width = size.width;
    block.height = size.height;
    block.contentWidth = size.width;
    block.contentHeight = size.height;
    block.aspectRatio = size.aspectRatio;
    patchCanvas({ blocks: [...canvas.blocks, block] });
    setSelectedId(block.id);
    setInspectedId("");
    setTextTarget(null);
    setDocumentLibraryOpen(false);
  }

  function importImage(file: File | undefined, kind: "image" | "map") {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const document: HistorySourceDocument = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, "") || (kind === "map" ? "Nouvelle carte" : "Nouveau document"),
        kind,
        src: String(reader.result),
        caption: "",
        source: "",
        showTitle: false,
        showCaption: false,
        showSource: false
      };
      onAddDocument(document);
      void addDocumentBlock(document);
    };
    reader.readAsDataURL(file);
  }

  function createTextDocument() {
    const document: HistorySourceDocument = {
      id: crypto.randomUUID(),
      title: "Nouveau document texte",
      kind: "text",
      text: "Écris ou colle le document historique ici.",
      caption: "",
      source: "",
      showTitle: false,
      showCaption: false,
      showSource: false
    };
    onAddDocument(document);
    void addDocumentBlock(document);
  }

  function replaceDocumentImage(document: HistorySourceDocument, file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const nextDocument = { ...document, src: String(reader.result) };
      const size = await measureDocument(nextDocument, canvas);
      onUpdateDocument(document.id, { src: nextDocument.src });
      patchCanvas({
        blocks: canvas.blocks.map((block) => block.documentId === document.id
          ? { ...block, width: size.width, height: size.height, contentWidth: size.width, contentHeight: size.height, aspectRatio: size.aspectRatio }
          : block)
      });
    };
    reader.readAsDataURL(file);
  }

  function deleteDocument(documentId: string) {
    if (!window.confirm("Supprimer ce document de l’activité et retirer toutes ses occurrences du tableau?")) return;
    onDeleteDocument(documentId);
    patchCanvas({ blocks: canvas.blocks.filter((block) => block.documentId !== documentId) });
    setSelectedId("");
    setInspectedId("");
    setTextTarget(null);
  }

  function chooseInteraction(action: HistoryInteractiveAction) {
    onActionChange(action);
    const existingInteraction = canvas.blocks.find((block) => block.type === "interaction");
    if (existingInteraction) {
      setSelectedId(existingInteraction.id);
      setInspectedId("");
      setTextTarget(null);
    } else {
      void addBlock("interaction");
    }
    setInteractionMenuOpen(false);
  }

  async function selectDocument(id: string, documentId: string) {
    const document = documents.find((item) => item.id === documentId);
    fittedDocumentsRef.current.add(`${id}:${documentId}:${document?.src?.length ?? 0}`);
    const size = await measureDocument(document, canvas);
    updateBlock(id, { documentId, width: size.width, height: size.height, contentWidth: size.width, contentHeight: size.height, aspectRatio: size.aspectRatio });
  }

  useEffect(() => {
    let cancelled = false;
    const targets = canvas.blocks.flatMap((block) => {
      if (block.type !== "document") return [];
      const document = documents.find((item) => item.id === block.documentId);
      if (!document?.src || block.aspectRatio) return [];
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
            return size ? { ...block, width: size.width, height: size.height, contentWidth: size.width, contentHeight: size.height, aspectRatio: size.aspectRatio } : block;
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
    setInspectedId("");
    setTextTarget(null);
  }

  function duplicateBlock(id: string) {
    const source = canvas.blocks.find((block) => block.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: crypto.randomUUID(),
      x: clamp(source.x + 28, 0, canvas.width - source.width),
      y: clamp(source.y + 28, 0, canvas.height - source.height)
    };
    patchCanvas({ blocks: [...canvas.blocks, copy] });
    setSelectedId(copy.id);
    setInspectedId(copy.id);
    setTextTarget(null);
  }

  function changeBlockLayer(id: string, action: HistoryLayerAction) {
    patchCanvas({ blocks: reorderHistoryCanvasBlock(canvas.blocks, id, action) });
  }

  function eventToCanvas(event: React.PointerEvent) {
    const surface = surfaceRef.current;
    const rect = surface?.getBoundingClientRect();
    if (!surface || !rect) return { x: 0, y: 0 };
    const contentLeft = rect.left + surface.clientLeft;
    const contentTop = rect.top + surface.clientTop;
    return {
      x: ((event.clientX - contentLeft) / surface.clientWidth) * canvas.width,
      y: ((event.clientY - contentTop) / surface.clientHeight) * canvas.height
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
    updateBlock(drag.id, resizeHistoryCanvasBlock(
      drag.block,
      drag.handle ?? "se",
      dx,
      dy,
      canvas,
      question
    ));
  }

  function renderBlock(block: HistoryCanvasBlock) {
    const document = documents.find((item) => item.id === block.documentId);
    if (block.type === "shape") return <HistoryCanvasShape {...block} />;
    if (block.type === "document") {
      return (
        <button
          type="button"
          className="history-canvas-reader-document"
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
    if (block.type === "interaction") return <HistoryInteractionEditor question={question} documents={documents} blockId={block.id} updateChoice={updateChoice} activateTextEditing={activateTextEditing} stopEditingPointer={stopEditingPointer} />;
    if (block.type === "validation") return <Button type="button" style={historyTextStyleToCss(block.textStyle)}><span contentEditable suppressContentEditableWarning onPointerDown={(event) => activateTextEditing(event, { kind: "block", id: block.id })} onFocus={(event) => activateTextEditing(event, { kind: "block", id: block.id })} onBlur={(event) => updateBlock(block.id, { text: event.currentTarget.innerText.replace(/\r\n?/g, "\n") })}>{block.text ?? "Valider"}</span></Button>;
    if (block.type === "feedback") return <span className="history-canvas-reader-muted" style={historyTextStyleToCss(block.textStyle)} contentEditable suppressContentEditableWarning onPointerDown={(event) => activateTextEditing(event, { kind: "block", id: block.id })} onFocus={(event) => activateTextEditing(event, { kind: "block", id: block.id })} onBlur={(event) => updateBlock(block.id, { text: event.currentTarget.innerText.replace(/\r\n?/g, "\n") })}>{block.text ?? "Feedback"}</span>;
    return <p style={historyTextStyleToCss(block.textStyle)} contentEditable suppressContentEditableWarning onPointerDown={(event) => activateTextEditing(event, { kind: "block", id: block.id })} onFocus={(event) => activateTextEditing(event, { kind: "block", id: block.id })} onBlur={(event) => updateBlock(block.id, { text: event.currentTarget.innerText.replace(/\r\n?/g, "\n") })}>{block.text || "Texte"}</p>;
  }

  function renderScaledBlock(block: HistoryCanvasBlock) {
    if (block.type === "text" || block.type === "shape" || (block.type === "interaction" && question.action === "cloze_choice")) return renderBlock(block);
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
    <section className="history-canvas-editor">
      <div className="history-canvas-toolbar-stack">
        <div className="history-canvas-toolbar" aria-label="Ajouter un objet">
          <div className="history-canvas-tools">
          <Button type="button" variant="secondary" onClick={() => { setResourceMenuOpen(false); setDocumentLibraryOpen(false); setInteractionMenuOpen(false); void addBlock("text"); }}><MessageSquareText size={16} /> Texte</Button>
          <div className="history-canvas-tool-menu">
            <Button type="button" variant="secondary" aria-expanded={resourceMenuOpen} onClick={() => { setDocumentLibraryOpen(false); setInteractionMenuOpen(false); setResourceMenuOpen((open) => !open); }}><Shapes size={16} /> Ressources</Button>
            {resourceMenuOpen && (
              <div className="history-canvas-tool-popover history-resource-menu" role="menu" aria-label="Ressources">
                <div className="history-resource-menu-heading"><Shapes size={18} /><strong>Formes</strong></div>
                <div className="history-shape-palette">
                  {shapeOptions.map(({ kind, label, icon: Icon }) => (
                    <button type="button" role="menuitem" key={kind} onClick={() => addShape(kind)} title={`Ajouter : ${label}`}>
                      <Icon size={25} strokeWidth={1.8} />
                      <strong>{label}</strong>
                    </button>
                  ))}
                </div>
                <div className="history-resource-menu-divider" />
                <button type="button" role="menuitem" className="history-resource-images-placeholder" disabled><ImageIcon size={19} /><strong>Images</strong></button>
              </div>
            )}
          </div>
          <div className="history-canvas-tool-menu">
            <Button type="button" variant="secondary" aria-expanded={documentLibraryOpen} onClick={() => { setResourceMenuOpen(false); setInteractionMenuOpen(false); setDocumentLibraryOpen((open) => !open); }}><FileText size={16} /> Document</Button>
            {documentLibraryOpen && (
              <div
                className="history-document-library-popover"
                role="dialog"
                aria-label="Documents de l’activité"
                tabIndex={0}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); importImage(event.dataTransfer.files?.[0], "image"); }}
                onPaste={(event) => importImage(event.clipboardData.files?.[0], "image")}
              >
                <div className="history-document-library-heading">
                  <div><strong>Documents de l’activité</strong><span>Importe un document ou replace un document existant.</span></div>
                  <button type="button" onClick={() => setDocumentLibraryOpen(false)} aria-label="Fermer"><X size={17} /></button>
                </div>
                <div className="history-document-import-actions">
                  <label className="history-document-import-action"><ImageIcon size={22} /><strong>Document image</strong><span>Photo, illustration ou artefact</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => importImage(event.target.files?.[0], "image")} /></label>
                  <label className="history-document-import-action"><MapIcon size={22} /><strong>Carte</strong><span>Carte historique ou géographique</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => importImage(event.target.files?.[0], "map")} /></label>
                  <button type="button" className="history-document-import-action" onClick={createTextDocument}><Plus size={22} /><strong>Document texte</strong><span>Écrire ou coller un extrait</span></button>
                </div>
                <p className="history-document-drop-hint"><Upload size={17} /> Tu peux aussi déposer ou coller une image dans cette fenêtre.</p>
                {documents.length > 0 ? (
                  <div className="history-document-library-grid">
                    {documents.map((document) => (
                      <div className="history-document-library-card" key={document.id}>
                        <button type="button" className="history-document-library-preview" onClick={() => void addDocumentBlock(document)}>
                          {document.src ? <img src={document.src} alt="" /> : <FileText size={28} />}
                        </button>
                        <div><strong>{document.title}</strong><span>{document.kind === "map" ? "Carte" : document.kind === "text" ? "Texte" : "Image"}</span></div>
                        <button type="button" className="history-document-library-add" onClick={() => void addDocumentBlock(document)}><Plus size={15} /> Ajouter</button>
                        <button type="button" className="history-document-library-delete" onClick={() => deleteDocument(document.id)} aria-label={`Supprimer ${document.title}`}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                ) : <p className="history-document-library-empty"><Upload size={22} /> Aucun document importé dans cette activité.</p>}
              </div>
            )}
          </div>
          <div className="history-canvas-tool-menu">
            <Button type="button" variant="secondary" aria-expanded={interactionMenuOpen} onClick={() => { setResourceMenuOpen(false); setDocumentLibraryOpen(false); setInteractionMenuOpen((open) => !open); }}><MousePointer2 size={16} /> Interaction</Button>
            {interactionMenuOpen && (
              <div className="history-canvas-tool-popover" role="menu" aria-label="Choisir une interaction">
                {availableActions.map((action) => (
                  <button type="button" role="menuitem" key={action} className={question.action === action ? "active" : ""} onClick={() => chooseInteraction(action)}>
                    <strong>{historyActionLabels[action]}</strong>
                    <span>{historyActionDescriptions[action]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {question.action !== "cloze_choice" && <Button type="button" variant="secondary" onClick={() => { setResourceMenuOpen(false); setDocumentLibraryOpen(false); setInteractionMenuOpen(false); void addBlock("validation"); }}><PanelTop size={16} /> Valider</Button>}
          <Button
            type="button"
            variant="secondary"
            className="history-canvas-fullscreen-toggle"
            onClick={toggleExpandedSurface}
            aria-pressed={isSurfaceExpanded}
            title={isSurfaceExpanded ? "Revenir à la hauteur normale" : "Afficher la hauteur du lecteur en plein écran"}
          >
            {isSurfaceExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isSurfaceExpanded ? "Hauteur normale" : "Surface complète"}
          </Button>
          </div>
          {textTarget && (
            <>
              <span className="history-toolbar-section-divider" aria-hidden="true" />
              <TextFormattingToolbar style={activeTextStyle} onChange={updateActiveTextStyle} />
            </>
          )}
        </div>
      </div>

      <div className="history-canvas-layout">
        <div
          className={`history-canvas-stage history-canvas-surface ${isSurfaceExpanded ? "is-expanded" : ""}`}
          ref={surfaceRef}
          style={{
            background: canvas.background || "#fff",
            "--history-expanded-stage-height": `${expandedSurfaceHeight}px`
          } as React.CSSProperties}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedId("");
              setInspectedId("");
              setTextTarget(null);
              setResourceMenuOpen(false);
              setDocumentLibraryOpen(false);
              setInteractionMenuOpen(false);
            }
          }}
        >
          {canvas.blocks.filter((block) => question.action !== "cloze_choice" || block.type !== "validation").map((block) => {
            return (
              <div
              key={block.id}
              role="button"
              tabIndex={0}
              className={`history-canvas-block block-${block.type} ${selectedId === block.id ? "selected" : ""}`}
              style={{
                left: `${block.x / canvas.width * 100}%`,
                top: `${block.y / canvas.height * 100}%`,
                width: `${block.width / canvas.width * 100}%`,
                height: `${block.height / canvas.height * 100}%`
              }}
              onPointerDownCapture={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest(".history-canvas-resize-handle")) return;
                const point = eventToCanvas(event);
                setSelectedId(block.id);
                if (!target.closest("[contenteditable='true']")) setTextTarget(null);
                if (inspectedId && inspectedId !== block.id) setInspectedId("");
                setDrag({ id: block.id, mode: "move", startX: point.x, startY: point.y, block });
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // Some browsers only allow capture after pointerdown reaches its target.
                }
              }}
              onClick={() => setSelectedId(block.id)}
              onDoubleClick={(event) => {
                event.stopPropagation();
                setSelectedId(block.id);
                setInspectedId(block.id);
              }}
            >
              {renderScaledBlock(block)}
              {resizeHandlesForBlock(block).map((handle) => (
                <span
                  key={handle}
                  className={`history-canvas-resize-handle resize-${handle}`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const point = eventToCanvas(event);
                    setSelectedId(block.id);
                    setTextTarget(null);
                    if (inspectedId && inspectedId !== block.id) setInspectedId("");
                    setDrag({ id: block.id, mode: "resize", handle, startX: point.x, startY: point.y, block });
                  }}
                />
              ))}
              </div>
            );
          })}
        </div>

        {inspectedBlock && (
          <aside className="history-canvas-inspector">
            <div className="history-canvas-inspector-heading">
              <strong>{blockLabels[inspectedBlock.type]}</strong>
              <div className="history-canvas-inspector-actions">
                {inspectedBlock.type === "shape" && <button type="button" onClick={() => duplicateBlock(inspectedBlock.id)} aria-label="Dupliquer la forme" title="Dupliquer"><Copy size={16} /></button>}
                <button type="button" className="danger" onClick={() => removeBlock(inspectedBlock.id)} aria-label="Supprimer le bloc"><Trash2 size={16} /></button>
                <button type="button" onClick={() => setInspectedId("")} aria-label="Fermer les propriétés"><X size={16} /></button>
              </div>
            </div>
            {inspectedBlock.type === "shape" && <ShapeInspector block={inspectedBlock} onUpdate={(patch) => updateBlock(inspectedBlock.id, patch)} />}
            {inspectedBlock.type === "document" && (
              <DocumentInspector
                block={inspectedBlock}
                document={documents.find((item) => item.id === inspectedBlock.documentId)}
                documents={documents}
                documentId={inspectedBlock.documentId ?? ""}
                onSelect={(documentId) => void selectDocument(inspectedBlock.id, documentId)}
                onUpdate={onUpdateDocument}
                onReplace={replaceDocumentImage}
                onBlockUpdate={(patch) => updateBlock(inspectedBlock.id, patch)}
              />
            )}
            {inspectedBlock.type === "interaction" && contextPanel}
            <LayerInspector
              index={canvas.blocks.findIndex((block) => block.id === inspectedBlock.id)}
              count={canvas.blocks.length}
              onChange={(action) => changeBlockLayer(inspectedBlock.id, action)}
            />
          </aside>
        )}
      </div>
    </section>
  );
}

function ShapeInspector({ block, onUpdate }: { block: HistoryCanvasBlock; onUpdate: (patch: Partial<HistoryCanvasBlock>) => void }) {
  const kind = block.shapeKind ?? "rectangle";
  const fillMode = block.shapeFillMode ?? "filled";
  const supportsFill = kind !== "line";
  const fillOpacity = Math.round((block.shapeFillOpacity ?? 1) * 100);
  const shadowEnabled = block.shapeShadowEnabled ?? false;
  const shadowDistance = block.shapeShadowDistance ?? 8;
  const shadowOpacity = Math.round((block.shapeShadowOpacity ?? 0.8) * 100);

  function setFillMode(mode: HistoryCanvasShapeFillMode) {
    onUpdate({ shapeFillMode: mode });
  }

  return (
    <section className="history-shape-inspector" aria-label="Apparence de la forme">
      <div className="history-inspector-section-heading"><Shapes size={18} /><strong>Apparence</strong></div>
      <label className="history-inspector-field">
        <span>Forme</span>
        <select
          value={kind}
          onChange={(event) => {
            const shapeKind = event.target.value as HistoryCanvasShapeKind;
            onUpdate({ shapeKind, shapeFillMode: shapeKind === "line" ? "outline" : fillMode });
          }}
        >
          {shapeOptions.map((option) => <option key={option.kind} value={option.kind}>{option.label}</option>)}
        </select>
      </label>
      {supportsFill && (
        <div className="history-shape-fill-mode" role="group" aria-label="Style de la forme">
          <button type="button" className={fillMode === "filled" ? "active" : ""} aria-pressed={fillMode === "filled"} onClick={() => setFillMode("filled")}>Remplie</button>
          <button type="button" className={fillMode === "outline" ? "active" : ""} aria-pressed={fillMode === "outline"} onClick={() => setFillMode("outline")}>Contour seulement</button>
        </div>
      )}
      {supportsFill && fillMode === "filled" && (
        <div className="history-shape-setting-grid">
          <label className="history-inspector-color-field">
            <span>Remplissage</span>
            <input type="color" value={block.shapeFillColor ?? "#d9eef8"} onChange={(event) => onUpdate({ shapeFillColor: event.target.value })} />
          </label>
          <label className="history-inspector-range-field">
            <span>Opacité <strong>{fillOpacity} %</strong></span>
            <input type="range" min="10" max="100" step="5" value={fillOpacity} onChange={(event) => onUpdate({ shapeFillOpacity: Number(event.target.value) / 100 })} />
          </label>
        </div>
      )}
      <div className="history-shape-setting-grid">
        <label className="history-inspector-color-field">
          <span>Contour</span>
          <input type="color" value={block.shapeStrokeColor ?? "#0b4a6f"} onChange={(event) => onUpdate({ shapeStrokeColor: event.target.value })} />
        </label>
        <label className="history-inspector-range-field">
          <span>Épaisseur <strong>{block.shapeStrokeWidth ?? 3}px</strong></span>
          <input type="range" min="1" max="12" step="1" value={block.shapeStrokeWidth ?? 3} onChange={(event) => onUpdate({ shapeStrokeWidth: Number(event.target.value) })} />
        </label>
      </div>
      <ShadowControls
        enabled={shadowEnabled}
        color={block.shapeShadowColor ?? "#123f59"}
        distance={shadowDistance}
        opacity={shadowOpacity}
        onChange={(patch) => onUpdate({
          ...(patch.enabled !== undefined ? { shapeShadowEnabled: patch.enabled } : {}),
          ...(patch.color !== undefined ? { shapeShadowColor: patch.color } : {}),
          ...(patch.distance !== undefined ? { shapeShadowDistance: patch.distance } : {}),
          ...(patch.opacity !== undefined ? { shapeShadowOpacity: patch.opacity / 100 } : {})
        })}
      />
    </section>
  );
}

function ShadowControls({
  enabled,
  color,
  distance,
  opacity,
  onChange
}: {
  enabled: boolean;
  color: string;
  distance: number;
  opacity: number;
  onChange: (patch: { enabled?: boolean; color?: string; distance?: number; opacity?: number }) => void;
}) {
  return (
    <div className="history-shape-shadow-settings">
      <label className="history-shape-shadow-toggle">
        <input type="checkbox" checked={enabled} onChange={(event) => onChange({ enabled: event.target.checked })} />
        <span>Ombre</span>
      </label>
      {enabled && (
        <div className="history-shape-setting-grid">
          <label className="history-inspector-color-field">
            <span>Couleur</span>
            <input type="color" value={color} onChange={(event) => onChange({ color: event.target.value })} />
          </label>
          <label className="history-inspector-range-field">
            <span>Distance <strong>{distance}px</strong></span>
            <input type="range" min="1" max="30" step="1" value={distance} onChange={(event) => onChange({ distance: Number(event.target.value) })} />
          </label>
          <label className="history-inspector-range-field">
            <span>Opacité <strong>{opacity} %</strong></span>
            <input type="range" min="10" max="100" step="5" value={opacity} onChange={(event) => onChange({ opacity: Number(event.target.value) })} />
          </label>
        </div>
      )}
    </div>
  );
}

function LayerInspector({ index, count, onChange }: { index: number; count: number; onChange: (action: HistoryLayerAction) => void }) {
  const atBack = index <= 0;
  const atFront = index >= count - 1;
  return (
    <section className="history-layer-inspector" aria-label="Disposition de l’objet">
      <div className="history-inspector-section-heading">
        <Layers3 size={18} />
        <strong>Disposition</strong>
        <span>Plan {index + 1} sur {count}</span>
      </div>
      <div className="history-layer-actions">
        <button type="button" disabled={atBack} onClick={() => onChange("send_back")} title="Mettre complètement derrière"><ChevronsDown size={18} /><span>Tout derrière</span></button>
        <button type="button" disabled={atBack} onClick={() => onChange("move_back")} title="Reculer d’un plan"><ChevronDown size={18} /><span>Reculer</span></button>
        <button type="button" disabled={atFront} onClick={() => onChange("move_front")} title="Avancer d’un plan"><ChevronUp size={18} /><span>Avancer</span></button>
        <button type="button" disabled={atFront} onClick={() => onChange("bring_front")} title="Mettre complètement devant"><ChevronsUp size={18} /><span>Tout devant</span></button>
      </div>
    </section>
  );
}

function TextFormattingToolbar({
  style,
  onChange
}: {
  style?: HistoryTextStyle;
  onChange: (patch: Partial<HistoryTextStyle>) => void;
}) {
  const current = { ...defaultHistoryTextStyle, ...style };
  return (
    <div className="history-text-toolbar" role="toolbar" aria-label="Mise en forme du texte">
      <label className="history-text-size-control" title="Taille de la police">
        <span>Taille</span>
        <input type="number" min={10} max={96} value={current.fontSize} onChange={(event) => onChange({ fontSize: clamp(Number(event.target.value), 10, 96) })} />
      </label>
      <label className="history-text-color-control" title="Couleur du texte">
        <span style={{ background: current.color }} />
        <input type="color" value={current.color} onChange={(event) => onChange({ color: event.target.value })} />
      </label>
      <span className="history-toolbar-divider" />
      <button type="button" className={current.bold ? "active" : ""} onClick={() => onChange({ bold: !current.bold })} aria-label="Gras" title="Gras"><Bold size={18} /></button>
      <button type="button" className={current.italic ? "active" : ""} onClick={() => onChange({ italic: !current.italic })} aria-label="Italique" title="Italique"><Italic size={18} /></button>
      <button type="button" className={current.underline ? "active" : ""} onClick={() => onChange({ underline: !current.underline })} aria-label="Souligné" title="Souligné"><Underline size={18} /></button>
      <span className="history-toolbar-divider" />
      <button type="button" className={current.align === "left" ? "active" : ""} onClick={() => onChange({ align: "left" })} aria-label="Aligner à gauche" title="Aligner à gauche"><AlignLeft size={18} /></button>
      <button type="button" className={current.align === "center" ? "active" : ""} onClick={() => onChange({ align: "center" })} aria-label="Centrer" title="Centrer"><AlignCenter size={18} /></button>
      <button type="button" className={current.align === "right" ? "active" : ""} onClick={() => onChange({ align: "right" })} aria-label="Aligner à droite" title="Aligner à droite"><AlignRight size={18} /></button>
    </div>
  );
}

function DocumentInspector({
  block,
  document,
  documents,
  documentId,
  onSelect,
  onUpdate,
  onReplace,
  onBlockUpdate
}: {
  block: HistoryCanvasBlock;
  document?: HistorySourceDocument;
  documents: HistorySourceDocument[];
  documentId: string;
  onSelect: (documentId: string) => void;
  onUpdate: (id: string, patch: Partial<HistorySourceDocument>) => void;
  onReplace: (document: HistorySourceDocument, file?: File) => void;
  onBlockUpdate: (patch: Partial<HistoryCanvasBlock>) => void;
}) {
  const shadowEnabled = block.documentShadowEnabled ?? false;
  return (
    <div className="history-document-inspector">
      <label>
        Document placé
        <select value={documentId} onChange={(event) => onSelect(event.target.value)}>
          <option value="">Choisir un document</option>
          {documents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      {document && (
        <>
          <label>Nom dans la bibliothèque<input value={document.title} onChange={(event) => onUpdate(document.id, { title: event.target.value })} /></label>
          <label>
            Type de document
            <select value={document.kind} onChange={(event) => onUpdate(document.id, { kind: event.target.value as HistorySourceDocument["kind"] })}>
              <option value="image">Document image</option>
              <option value="map">Carte</option>
              <option value="text">Document texte</option>
            </select>
          </label>
          {document.kind === "text" ? (
            <label>Contenu<textarea rows={7} value={document.text ?? ""} onChange={(event) => onUpdate(document.id, { text: event.target.value })} /></label>
          ) : (
            <label className="history-document-replace"><Upload size={16} /> Remplacer l’image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onReplace(document, event.target.files?.[0])} /></label>
          )}
          <div className="history-document-display-setting">
            <label className="history-check"><input type="checkbox" checked={Boolean(document.showTitle)} onChange={(event) => onUpdate(document.id, { showTitle: event.target.checked })} /> Afficher un titre</label>
            {document.showTitle && <input value={document.displayTitle ?? document.title} onChange={(event) => onUpdate(document.id, { displayTitle: event.target.value })} placeholder="Titre affiché" />}
          </div>
          <div className="history-document-display-setting">
            <label className="history-check"><input type="checkbox" checked={Boolean(document.showCaption)} onChange={(event) => onUpdate(document.id, { showCaption: event.target.checked })} /> Afficher une légende</label>
            {document.showCaption && <textarea rows={2} value={document.caption ?? ""} onChange={(event) => onUpdate(document.id, { caption: event.target.value })} placeholder="Légende affichée" />}
          </div>
          <div className="history-document-display-setting">
            <label className="history-check"><input type="checkbox" checked={Boolean(document.showSource)} onChange={(event) => onUpdate(document.id, { showSource: event.target.checked })} /> Afficher la source</label>
            {document.showSource && <textarea rows={2} value={document.source ?? ""} onChange={(event) => onUpdate(document.id, { source: event.target.value })} placeholder="Source affichée" />}
          </div>
          <ShadowControls
            enabled={shadowEnabled}
            color={block.documentShadowColor ?? "#123f59"}
            distance={block.documentShadowDistance ?? 8}
            opacity={Math.round((block.documentShadowOpacity ?? 0.8) * 100)}
            onChange={(patch) => onBlockUpdate({
              ...(patch.enabled !== undefined ? { documentShadowEnabled: patch.enabled } : {}),
              ...(patch.color !== undefined ? { documentShadowColor: patch.color } : {}),
              ...(patch.distance !== undefined ? { documentShadowDistance: patch.distance } : {}),
              ...(patch.opacity !== undefined ? { documentShadowOpacity: patch.opacity / 100 } : {})
            })}
          />
        </>
      )}
    </div>
  );
}

function HistoryInteractionEditor({
  question,
  documents,
  blockId,
  updateChoice,
  activateTextEditing,
  stopEditingPointer
}: {
  question: HistoryQuestion;
  documents: HistorySourceDocument[];
  blockId: string;
  updateChoice: (id: string, patch: Partial<HistoryChoiceOption>) => void;
  activateTextEditing: (event: React.PointerEvent | React.FocusEvent, target: TextTarget) => void;
  stopEditingPointer: (event: React.PointerEvent) => void;
}) {
  if (question.action === "choice_single" || question.action === "choice_multiple") {
    return (
      <div className="history-choice-grid history-canvas-choice-editor">
        {(question.choices ?? []).map((choice) => (
          <button type="button" key={choice.id}>
            <span style={historyTextStyleToCss(choice.textStyle)} contentEditable suppressContentEditableWarning onPointerDown={(event) => activateTextEditing(event, { kind: "choice", id: choice.id, blockId })} onFocus={(event) => activateTextEditing(event, { kind: "choice", id: choice.id, blockId })} onBlur={(event) => updateChoice(choice.id, { text: event.currentTarget.innerText.replace(/\r\n?/g, "\n") })}>{choice.text}</span>
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
    <HistoryClozeInteraction question={question} preview onPointerDown={stopEditingPointer} />
  );
}
