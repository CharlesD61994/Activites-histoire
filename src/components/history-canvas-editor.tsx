"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowRight, Bold, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Circle, Copy, FileText, FlipHorizontal2, FlipVertical2, Image as ImageIcon, Italic, Layers3, Map as MapIcon, Maximize2, MessageSquareText, Minus, Minimize2, MousePointer2, Plus, RectangleHorizontal, RotateCcw, RotateCw, Shapes, Square, Trash2, Triangle, Underline, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistoryCanvasShape } from "@/components/history-canvas-shape";
import { HistoryCanvasVisual, type HistoryVisualLibraryItem } from "@/components/history-canvas-visual";
import { HistoryResourceLibrary } from "@/components/history-resource-library";
import { historyCanvasBackgroundStyle } from "@/components/history-canvas-background";
import { HistoryDocumentContent } from "@/components/history-document-content";
import { HistoryClozeInteraction } from "@/components/history-cloze-interaction";
import { blockContentSize, blockScales, historyCanvasLayoutVersion, historyInteractionActionAreaHeight, interactionBlockSize, reorderHistoryCanvasBlock, resizeHistoryCanvasBlock, type HistoryLayerAction, type HistoryResizeHandle } from "@/lib/history-canvas";
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
  blocks?: HistoryCanvasBlock[];
};

type TextTarget =
  | { kind: "block"; id: string }
  | { kind: "choice"; id: string; blockId: string };

type SelectionBox = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type ContextMenuState = {
  x: number;
  y: number;
} | null;

const resizeHandles: HistoryResizeHandle[] = ["n", "e", "s", "w", "ne", "se", "sw", "nw"];
const proportionalResizeHandles: HistoryResizeHandle[] = ["ne", "se", "sw", "nw"];

function resizeHandlesForBlock(block: HistoryCanvasBlock) {
  return block.type === "shape" && block.shapeKind === "triangle" ? proportionalResizeHandles : resizeHandles;
}

const blockLabels: Record<HistoryCanvasBlockType, string> = {
  text: "Texte",
  document: "Document",
  shape: "Forme",
  visual: "Élément visuel",
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

function selectionBounds(selection: SelectionBox) {
  const x = Math.min(selection.startX, selection.currentX);
  const y = Math.min(selection.startY, selection.currentY);
  return {
    x,
    y,
    width: Math.abs(selection.currentX - selection.startX),
    height: Math.abs(selection.currentY - selection.startY)
  };
}

function blockIntersectsRect(block: HistoryCanvasBlock, rect: { x: number; y: number; width: number; height: number }) {
  return block.x < rect.x + rect.width
    && block.x + block.width > rect.x
    && block.y < rect.y + rect.height
    && block.y + block.height > rect.y;
}

function constrainedGroupDelta(blocks: HistoryCanvasBlock[], dx: number, dy: number, canvas: Pick<HistoryActivityCanvas, "width" | "height">) {
  if (blocks.length === 0) return { dx: 0, dy: 0 };
  const minX = Math.min(...blocks.map((block) => block.x));
  const minY = Math.min(...blocks.map((block) => block.y));
  const maxX = Math.max(...blocks.map((block) => block.x + block.width));
  const maxY = Math.max(...blocks.map((block) => block.y + block.height));
  return {
    dx: clamp(dx, -minX, canvas.width - maxX),
    dy: clamp(dy, -minY, canvas.height - maxY)
  };
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

function defaultVisualBlock(item: HistoryVisualLibraryItem, canvas: HistoryActivityCanvas): HistoryCanvasBlock {
  const size = item.kind === "emoji" ? 210 : 190;
  return {
    id: crypto.randomUUID(),
    type: "visual",
    x: Math.max(0, (canvas.width - size) / 2),
    y: Math.max(0, (canvas.height - size) / 2),
    width: size,
    height: size,
    contentWidth: size,
    contentHeight: size,
    visualKind: item.kind,
    visualId: item.kind === "icon" ? item.value : undefined,
    visualSrc: item.kind === "emoji" ? item.value : undefined,
    visualLabel: item.label,
    visualColor: "#0b4a6f",
    visualOpacity: 1,
    visualBackgroundEnabled: false,
    visualBackgroundColor: "#ffffff",
    visualBackgroundOpacity: 1,
    visualBackgroundShape: "rounded",
    visualBorderColor: "#0b4a6f",
    visualBorderWidth: 0
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
      defaultBlock("interaction", question, documents)
    ]
  };
}

export function HistoryCanvasEditor({ canvas, documents, question, onChange, onQuestionChange, availableActions, onActionChange, onAddDocument, onUpdateDocument, onDeleteDocument, contextPanel }: Props) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const fittedDocumentsRef = useRef(new Set<string>());
  const clipboardRef = useRef<HistoryCanvasBlock[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectedId, setInspectedId] = useState("");
  const [textTarget, setTextTarget] = useState<TextTarget | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [interactionMenuOpen, setInteractionMenuOpen] = useState(false);
  const [resourceMenuOpen, setResourceMenuOpen] = useState(false);
  const [documentLibraryOpen, setDocumentLibraryOpen] = useState(false);
  const [isSurfaceExpanded, setIsSurfaceExpanded] = useState(true);
  const [expandedSurfaceHeight, setExpandedSurfaceHeight] = useState(canvas.height);
  const inspectedBlock = canvas.blocks.find((block) => block.id === inspectedId);
  const activeTextStyle = textTarget?.kind === "block"
    ? canvas.blocks.find((block) => block.id === textTarget.id)?.textStyle
    : question.choices?.find((choice) => choice.id === textTarget?.id)?.textStyle;
  const activeSelectionIds = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : [];
  const selectedBlocks = canvas.blocks.filter((block) => activeSelectionIds.includes(block.id));
  const canPaste = clipboardRef.current.length > 0;

  function patchCanvas(patch: Partial<HistoryActivityCanvas>) {
    onChange({ ...canvas, ...patch });
  }

  function selectOnly(id: string) {
    setSelectedId(id);
    setSelectedIds(id ? [id] : []);
    setContextMenu(null);
  }

  function clearSelection() {
    setSelectedId("");
    setSelectedIds([]);
    setInspectedId("");
    setTextTarget(null);
    setContextMenu(null);
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
    selectOnly(target.kind === "block" ? target.id : target.blockId);
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

  function isKeyboardEditingTarget(target: EventTarget | null) {
    const element = target instanceof HTMLElement ? target : null;
    return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
  }

  function moveSelectedBlocks(dx: number, dy: number) {
    if (selectedBlocks.length === 0) return;
    const delta = constrainedGroupDelta(selectedBlocks, dx, dy, canvas);
    if (delta.dx === 0 && delta.dy === 0) return;
    const selected = new Set(selectedBlocks.map((block) => block.id));
    patchCanvas({
      blocks: canvas.blocks.map((block) => selected.has(block.id)
        ? { ...block, x: block.x + delta.dx, y: block.y + delta.dy }
        : block)
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTextTarget(null);
        setContextMenu(null);
        setSelectionBox(null);
        return;
      }
      if (isKeyboardEditingTarget(event.target)) return;

      const lowerKey = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && lowerKey === "c") {
        if (activeSelectionIds.length === 0) return;
        event.preventDefault();
        copySelectedBlocks();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && lowerKey === "x") {
        if (activeSelectionIds.length === 0) return;
        event.preventDefault();
        cutSelectedBlocks();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && lowerKey === "v") {
        if (clipboardRef.current.length === 0) return;
        event.preventDefault();
        pasteBlocks();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && lowerKey === "d") {
        if (activeSelectionIds.length === 0) return;
        event.preventDefault();
        duplicateSelectedBlocks();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (activeSelectionIds.length === 0) return;
        event.preventDefault();
        removeSelectedBlocks();
        return;
      }
      if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(event.key)) {
        if (activeSelectionIds.length === 0) return;
        event.preventDefault();
        const step = event.shiftKey ? 24 : 4;
        const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
        const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
        moveSelectedBlocks(dx, dy);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!isSurfaceExpanded) return;
    function updateExpandedSurfaceHeight() {
      setExpandedSurfaceHeight(readerFullscreenStageHeight());
    }
    updateExpandedSurfaceHeight();
    window.addEventListener("resize", updateExpandedSurfaceHeight);
    return () => window.removeEventListener("resize", updateExpandedSurfaceHeight);
  }, [isSurfaceExpanded]);

  useLayoutEffect(() => {
    if (!contextMenu) return;
    const menu = contextMenuRef.current;
    if (!menu) return;
    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const nextX = clamp(contextMenu.x, margin, Math.max(margin, window.innerWidth - rect.width - margin));
    const nextY = clamp(contextMenu.y, margin, Math.max(margin, window.innerHeight - rect.height - margin));
    if (nextX !== contextMenu.x || nextY !== contextMenu.y) {
      setContextMenu({ x: nextX, y: nextY });
    }
  }, [contextMenu]);

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
    selectOnly(block.id);
    setInspectedId("");
    setTextTarget(null);
  }

  function addShape(kind: HistoryCanvasShapeKind) {
    const block = defaultShapeBlock(kind, canvas);
    patchCanvas({ blocks: [...canvas.blocks, block] });
    selectOnly(block.id);
    setInspectedId("");
    setTextTarget(null);
    setResourceMenuOpen(false);
  }

  function addVisual(item: HistoryVisualLibraryItem) {
    const block = defaultVisualBlock(item, canvas);
    patchCanvas({ blocks: [...canvas.blocks, block] });
    selectOnly(block.id);
    setInspectedId("");
    setTextTarget(null);
    setResourceMenuOpen(false);
  }

  function importVisual(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 360;
        const ratio = image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
        const width = ratio >= 1 ? maxSize : maxSize * ratio;
        const height = ratio >= 1 ? maxSize / ratio : maxSize;
        const block: HistoryCanvasBlock = {
          id: crypto.randomUUID(), type: "visual",
          x: Math.max(0, (canvas.width - width) / 2), y: Math.max(0, (canvas.height - height) / 2),
          width, height, contentWidth: width, contentHeight: height,
          visualKind: "image", visualSrc: String(reader.result), visualLabel: file.name.replace(/\.[^.]+$/, ""),
          visualOpacity: 1, visualBackgroundEnabled: false
        };
        patchCanvas({ blocks: [...canvas.blocks, block] });
        selectOnly(block.id);
        setInspectedId("");
        setResourceMenuOpen(false);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
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
    selectOnly(block.id);
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
    clearSelection();
  }

  function chooseInteraction(action: HistoryInteractiveAction) {
    onActionChange(action);
    const existingInteraction = canvas.blocks.find((block) => block.type === "interaction");
    if (existingInteraction) {
      selectOnly(existingInteraction.id);
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
    selectOnly(blocks[0]?.id ?? "");
    setInspectedId("");
    setTextTarget(null);
  }

  function removeSelectedBlocks() {
    if (activeSelectionIds.length === 0) return;
    const selected = new Set(activeSelectionIds);
    patchCanvas({ blocks: canvas.blocks.filter((block) => !selected.has(block.id)) });
    clearSelection();
  }

  function copySelectedBlocks() {
    if (selectedBlocks.length === 0) return;
    clipboardRef.current = selectedBlocks.map((block) => ({ ...block }));
    setContextMenu(null);
  }

  function pasteBlocks() {
    if (clipboardRef.current.length === 0) return;
    const copies = clipboardRef.current.map((source, index) => ({
      ...source,
      id: crypto.randomUUID(),
      x: source.x + 28 + index * 10,
      y: source.y + 28 + index * 10
    }));
    const { dx, dy } = constrainedGroupDelta(copies, 0, 0, canvas);
    const normalizedCopies = copies.map((copy) => ({
      ...copy,
      x: clamp(copy.x + dx, 0, canvas.width - copy.width),
      y: clamp(copy.y + dy, 0, canvas.height - copy.height)
    }));
    patchCanvas({ blocks: [...canvas.blocks, ...normalizedCopies] });
    setSelectedIds(normalizedCopies.map((block) => block.id));
    setSelectedId(normalizedCopies[normalizedCopies.length - 1]?.id ?? "");
    setInspectedId("");
    setTextTarget(null);
    setContextMenu(null);
  }

  function cutSelectedBlocks() {
    if (activeSelectionIds.length === 0) return;
    copySelectedBlocks();
    removeSelectedBlocks();
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
    selectOnly(copy.id);
    setInspectedId(copy.id);
    setTextTarget(null);
  }

  function duplicateSelectedBlocks() {
    if (selectedBlocks.length === 0) return;
    clipboardRef.current = selectedBlocks.map((block) => ({ ...block }));
    pasteBlocks();
  }

  function changeBlockLayer(id: string, action: HistoryLayerAction) {
    patchCanvas({ blocks: reorderHistoryCanvasBlock(canvas.blocks, id, action) });
    setContextMenu(null);
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
    const point = eventToCanvas(event);
    if (selectionBox) {
      setSelectionBox({ ...selectionBox, currentX: point.x, currentY: point.y });
      return;
    }
    if (!drag) return;
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    if (drag.mode === "move") {
      if (Math.hypot(dx, dy) < 4) return;
      const movingBlocks = drag.blocks && drag.blocks.length > 0 ? drag.blocks : [drag.block];
      const delta = constrainedGroupDelta(movingBlocks, dx, dy, canvas);
      const movingById = new Map(movingBlocks.map((block) => [block.id, block]));
      patchCanvas({
        blocks: canvas.blocks.map((block) => {
          const startBlock = movingById.get(block.id);
          return startBlock ? { ...block, x: startBlock.x + delta.dx, y: startBlock.y + delta.dy } : block;
        })
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

  function finishPointerAction() {
    if (selectionBox) {
      const bounds = selectionBounds(selectionBox);
      if (bounds.width > 6 && bounds.height > 6) {
        const ids = canvas.blocks
          .filter((block) => block.type !== "validation" && blockIntersectsRect(block, bounds))
          .map((block) => block.id);
        setSelectedIds(ids);
        setSelectedId(ids[ids.length - 1] ?? "");
        setInspectedId("");
        setTextTarget(null);
      }
      setSelectionBox(null);
    }
    setDrag(null);
  }

  function renderBlock(block: HistoryCanvasBlock) {
    const document = documents.find((item) => item.id === block.documentId);
    if (block.type === "shape") return <HistoryCanvasShape {...block} />;
    if (block.type === "visual") return <HistoryCanvasVisual {...block} />;
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
    <section className="history-canvas-editor">
      <div className="history-canvas-toolbar-stack">
        <div className="history-canvas-toolbar" aria-label="Ajouter un objet">
          <div className="history-canvas-tools">
          <Button type="button" variant="secondary" onClick={() => { setResourceMenuOpen(false); setDocumentLibraryOpen(false); setInteractionMenuOpen(false); void addBlock("text"); }}><MessageSquareText size={16} /> Texte</Button>
          <div className="history-canvas-tool-menu">
            <Button type="button" variant="secondary" aria-expanded={resourceMenuOpen} onClick={() => { setDocumentLibraryOpen(false); setInteractionMenuOpen(false); setResourceMenuOpen((open) => !open); }}><Shapes size={16} /> Ressources</Button>
            {resourceMenuOpen && (
              <HistoryResourceLibrary
                canvas={canvas}
                onCanvasChange={patchCanvas}
                onAddShape={addShape}
                onAddVisual={addVisual}
                onImportVisual={importVisual}
                onClose={() => setResourceMenuOpen(false)}
              />
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
            backgroundColor: canvas.background || "#fff",
            ...historyCanvasBackgroundStyle(canvas),
            ...(canvas.backgroundImage ? { backgroundBlendMode: "normal" } : {}),
            "--history-expanded-stage-height": `${expandedSurfaceHeight}px`
          } as React.CSSProperties}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointerAction}
          onPointerCancel={finishPointerAction}
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              const point = eventToCanvas(event);
              clearSelection();
              setSelectionBox({ startX: point.x, startY: point.y, currentX: point.x, currentY: point.y });
              setResourceMenuOpen(false);
              setDocumentLibraryOpen(false);
              setInteractionMenuOpen(false);
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
        >
          {canvas.blocks.filter((block) => block.type !== "validation").map((block) => {
            return (
              <div
              key={block.id}
              role="button"
              tabIndex={0}
              className={`history-canvas-block block-${block.type} ${activeSelectionIds.includes(block.id) ? "selected" : ""}`}
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
                setContextMenu(null);
                const additive = event.shiftKey || event.ctrlKey || event.metaKey;
                const alreadySelected = activeSelectionIds.includes(block.id);
                if (additive) {
                  const nextIds = alreadySelected
                    ? activeSelectionIds.filter((id) => id !== block.id)
                    : [...activeSelectionIds, block.id];
                  setSelectedIds(nextIds);
                  setSelectedId(nextIds[nextIds.length - 1] ?? "");
                  setDrag(null);
                  return;
                }
                const movingIds = alreadySelected ? activeSelectionIds : [block.id];
                setSelectedIds(movingIds);
                setSelectedId(block.id);
                if (!target.closest("[contenteditable='true']")) setTextTarget(null);
                if (inspectedId && inspectedId !== block.id) setInspectedId("");
                setDrag({
                  id: block.id,
                  mode: "move",
                  startX: point.x,
                  startY: point.y,
                  block,
                  blocks: canvas.blocks.filter((item) => movingIds.includes(item.id))
                });
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // Some browsers only allow capture after pointerdown reaches its target.
                }
              }}
              onClick={(event) => event.stopPropagation()}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!activeSelectionIds.includes(block.id)) selectOnly(block.id);
                setContextMenu({ x: event.clientX, y: event.clientY });
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                selectOnly(block.id);
                setInspectedId(block.id);
              }}
            >
              {renderScaledBlock(block)}
              {selectedId === block.id && resizeHandlesForBlock(block).map((handle) => (
                <span
                  key={handle}
                  className={`history-canvas-resize-handle resize-${handle}`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const point = eventToCanvas(event);
                    selectOnly(block.id);
                    setTextTarget(null);
                    if (inspectedId && inspectedId !== block.id) setInspectedId("");
                    setDrag({ id: block.id, mode: "resize", handle, startX: point.x, startY: point.y, block });
                  }}
                />
              ))}
              </div>
            );
          })}
          {selectionBox && (
            <div
              className="history-canvas-selection-box"
              style={{
                left: `${selectionBounds(selectionBox).x / canvas.width * 100}%`,
                top: `${selectionBounds(selectionBox).y / canvas.height * 100}%`,
                width: `${selectionBounds(selectionBox).width / canvas.width * 100}%`,
                height: `${selectionBounds(selectionBox).height / canvas.height * 100}%`
              }}
            />
          )}
        </div>

        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="history-canvas-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
          >
            <button type="button" role="menuitem" disabled={activeSelectionIds.length === 0} onClick={copySelectedBlocks}>Copier</button>
            <button type="button" role="menuitem" disabled={activeSelectionIds.length === 0} onClick={cutSelectedBlocks}>Couper</button>
            <button type="button" role="menuitem" disabled={!canPaste} onClick={pasteBlocks}>Coller</button>
            <button type="button" role="menuitem" disabled={activeSelectionIds.length === 0} onClick={duplicateSelectedBlocks}>Dupliquer</button>
            <span aria-hidden="true" />
            <button type="button" role="menuitem" disabled={activeSelectionIds.length !== 1} onClick={() => activeSelectionIds[0] && changeBlockLayer(activeSelectionIds[0], "bring_front")}>Premier plan</button>
            <button type="button" role="menuitem" disabled={activeSelectionIds.length !== 1} onClick={() => activeSelectionIds[0] && changeBlockLayer(activeSelectionIds[0], "send_back")}>Arrière-plan</button>
            <span aria-hidden="true" />
            <button type="button" role="menuitem" className="danger" disabled={activeSelectionIds.length === 0} onClick={removeSelectedBlocks}>Supprimer</button>
          </div>
        )}

        {inspectedBlock && (
          <aside className="history-canvas-inspector">
            <div className="history-canvas-inspector-heading">
              <strong>{blockLabels[inspectedBlock.type]}</strong>
              <div className="history-canvas-inspector-actions">
                {(inspectedBlock.type === "shape" || inspectedBlock.type === "visual") && <button type="button" onClick={() => duplicateBlock(inspectedBlock.id)} aria-label="Dupliquer l’objet" title="Dupliquer"><Copy size={16} /></button>}
                <button type="button" className="danger" onClick={() => removeBlock(inspectedBlock.id)} aria-label="Supprimer le bloc"><Trash2 size={16} /></button>
                <button type="button" onClick={() => setInspectedId("")} aria-label="Fermer les propriétés"><X size={16} /></button>
              </div>
            </div>
            {inspectedBlock.type === "shape" && <ShapeInspector block={inspectedBlock} onUpdate={(patch) => updateBlock(inspectedBlock.id, patch)} />}
            {inspectedBlock.type === "visual" && <VisualInspector block={inspectedBlock} onUpdate={(patch) => updateBlock(inspectedBlock.id, patch)} />}
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

function VisualInspector({ block, onUpdate }: { block: HistoryCanvasBlock; onUpdate: (patch: Partial<HistoryCanvasBlock>) => void }) {
  const opacity = Math.round((block.visualOpacity ?? 1) * 100);
  const backgroundOpacity = Math.round((block.visualBackgroundOpacity ?? 1) * 100);
  return (
    <section className="history-visual-inspector" aria-label="Apparence de l’élément visuel">
      <label className="history-inspector-field">
        <span>Description</span>
        <input value={block.visualLabel ?? ""} onChange={(event) => onUpdate({ visualLabel: event.target.value })} placeholder="Décrire l’élément" />
      </label>
      {block.visualKind === "icon" && (
        <label className="history-inspector-color-field">
          <span>Couleur de l’icône</span>
          <input type="color" value={block.visualColor ?? "#0b4a6f"} onChange={(event) => onUpdate({ visualColor: event.target.value })} />
        </label>
      )}
      <label className="history-inspector-range-field">
        <span>Opacité <strong>{opacity} %</strong></span>
        <input type="range" min="10" max="100" step="5" value={opacity} onChange={(event) => onUpdate({ visualOpacity: Number(event.target.value) / 100 })} />
      </label>
      <div className="history-visual-orientation">
        <div className="history-inspector-section-heading"><strong>Orientation</strong><span>{block.visualRotation ?? 0}°</span></div>
        <div className="history-visual-orientation-actions">
          <button type="button" onClick={() => onUpdate({ visualRotation: (((block.visualRotation ?? 0) + 270) % 360) as 0 | 90 | 180 | 270 })} title="Tourner vers la gauche"><RotateCcw size={18} /><span>Gauche</span></button>
          <button type="button" onClick={() => onUpdate({ visualRotation: (((block.visualRotation ?? 0) + 90) % 360) as 0 | 90 | 180 | 270 })} title="Tourner vers la droite"><RotateCw size={18} /><span>Droite</span></button>
          <button type="button" className={block.visualFlipX ? "active" : ""} onClick={() => onUpdate({ visualFlipX: !block.visualFlipX })} title="Miroir horizontal"><FlipHorizontal2 size={18} /><span>Miroir H</span></button>
          <button type="button" className={block.visualFlipY ? "active" : ""} onClick={() => onUpdate({ visualFlipY: !block.visualFlipY })} title="Miroir vertical"><FlipVertical2 size={18} /><span>Miroir V</span></button>
        </div>
      </div>
      <label className="history-visual-background-toggle">
        <input type="checkbox" checked={block.visualBackgroundEnabled ?? false} onChange={(event) => onUpdate({ visualBackgroundEnabled: event.target.checked })} />
        <span>Ajouter un fond</span>
      </label>
      {block.visualBackgroundEnabled && (
        <div className="history-visual-background-settings">
          <label className="history-inspector-field">
            <span>Forme du fond</span>
            <select value={block.visualBackgroundShape ?? "rounded"} onChange={(event) => onUpdate({ visualBackgroundShape: event.target.value as NonNullable<HistoryCanvasBlock["visualBackgroundShape"]> })}>
              <option value="square">Carré</option>
              <option value="rounded">Coins arrondis</option>
              <option value="circle">Cercle</option>
            </select>
          </label>
          <div className="history-shape-setting-grid">
            <label className="history-inspector-color-field"><span>Couleur du fond</span><input type="color" value={block.visualBackgroundColor ?? "#ffffff"} onChange={(event) => onUpdate({ visualBackgroundColor: event.target.value })} /></label>
            <label className="history-inspector-range-field"><span>Opacité <strong>{backgroundOpacity} %</strong></span><input type="range" min="10" max="100" step="5" value={backgroundOpacity} onChange={(event) => onUpdate({ visualBackgroundOpacity: Number(event.target.value) / 100 })} /></label>
          </div>
          <div className="history-shape-setting-grid">
            <label className="history-inspector-color-field"><span>Contour</span><input type="color" value={block.visualBorderColor ?? "#0b4a6f"} onChange={(event) => onUpdate({ visualBorderColor: event.target.value })} /></label>
            <label className="history-inspector-range-field"><span>Épaisseur <strong>{block.visualBorderWidth ?? 0}px</strong></span><input type="range" min="0" max="12" step="1" value={block.visualBorderWidth ?? 0} onChange={(event) => onUpdate({ visualBorderWidth: Number(event.target.value) })} /></label>
          </div>
        </div>
      )}
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
  function withCanvasActions(content: React.ReactNode) {
    const footerRatio = interactionActionAreaHeightRatio(question);
    return (
      <div
        className={`history-reader-interaction-stack history-canvas-interaction-preview history-canvas-proportional-interaction ${question.action === "true_false" ? "history-true-false-stack" : ""}`}
        style={{ "--history-interaction-footer-ratio": footerRatio } as React.CSSProperties}
      >
        <div className="history-reader-interaction-body">{content}</div>
        <div className="history-reader-actions">
          <button type="button" className="history-reader-reset" aria-label="Réinitialiser" title="Réinitialiser"><RotateCcw size={20} /></button>
          <Button type="button">Valider</Button>
        </div>
      </div>
    );
  }

  if (question.action === "choice_single" || question.action === "choice_multiple" || question.action === "true_false" || question.action === "image_selection" || question.action === "reference_point") {
    const imageMode = question.action === "image_selection";
    const referenceMode = question.action === "reference_point";
    return withCanvasActions(
      <div className={`${imageMode ? "history-image-choice-grid" : referenceMode ? "history-reference-choice-grid" : question.action === "true_false" ? "history-choice-grid history-true-false-grid" : "history-choice-grid"} history-canvas-choice-editor`}>
        {referenceMode && <strong className="history-reference-point-label">{question.acceptedTextAnswers?.[0] ?? "Repère"}</strong>}
        {(question.choices ?? []).map((choice) => (
          <button type="button" key={choice.id}>
            {imageMode && <span className="history-image-choice-media">{documents.find((document) => document.id === choice.documentId)?.src ? <img src={documents.find((document) => document.id === choice.documentId)?.src} alt="" /> : <ImageIcon size={32} />}</span>}
            <span style={historyTextStyleToCss(choice.textStyle)} contentEditable suppressContentEditableWarning onPointerDown={(event) => activateTextEditing(event, { kind: "choice", id: choice.id, blockId })} onFocus={(event) => activateTextEditing(event, { kind: "choice", id: choice.id, blockId })} onBlur={(event) => updateChoice(choice.id, { text: event.currentTarget.innerText.replace(/\r\n?/g, "\n") })}>{choice.text}</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.action === "classification" || question.action === "sort_categories") {
    return withCanvasActions(<div className="history-answer-list">{(question.classificationItems ?? []).map((item) => <label key={item.id}><span>{item.text}</span><select value="" onPointerDown={stopEditingPointer} onChange={() => undefined}><option value="">Choisir</option>{(question.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>)}</div>);
  }

  if (question.action === "matching" || question.action === "table_fill") {
    const tableMode = question.action === "table_fill";
    return withCanvasActions(<div className={tableMode ? "history-table-fill-list" : "history-answer-list"}>{(question.matchingPrompts ?? []).map((prompt) => <label key={prompt.id}><span>{prompt.prompt}</span><select value="" onPointerDown={stopEditingPointer} onChange={() => undefined}><option value="">{tableMode ? "Compléter" : "Associer à..."}</option>{(question.matchingTargets ?? []).map((target) => <option key={target.id} value={target.id}>{target.text}</option>)}</select></label>)}</div>);
  }

  if (question.action === "chronological_order" || question.action === "timeline" || question.action === "arrange_order") {
    return withCanvasActions(<div className="history-order-list">{[...(question.timelineEvents ?? [])].sort((a, b) => a.correctOrder - b.correctOrder).map((event) => <div key={event.id}><span>{event.dateLabel && <small>{event.dateLabel}</small>}{event.text}</span><button type="button" onPointerDown={stopEditingPointer}>Monter</button><button type="button" onPointerDown={stopEditingPointer}>Descendre</button></div>)}</div>);
  }

  if (question.action === "document_hotspot") {
    const document = documents.find((item) => item.id === question.hotspot?.documentId && item.src)
      ?? documents.find((item) => question.documentIds.includes(item.id) && item.src);
    return withCanvasActions(document?.src ? <button type="button" className="history-hotspot-reader"><img src={document.src} alt={document.title} /></button> : <p>Cette action demande un document image ou une carte.</p>);
  }

  if (question.action === "short_text") {
    return withCanvasActions(
      <div className="history-short-text-reader">
        <input readOnly value="" placeholder="Écrire un mot ou une courte phrase" onPointerDown={stopEditingPointer} />
      </div>
    );
  }

  return (
    <HistoryClozeInteraction question={question} preview onPointerDown={stopEditingPointer} />
  );
}

function interactionActionAreaHeightRatio(question: HistoryQuestion) {
  return `${historyInteractionActionAreaHeight / interactionBlockSize(question).height * 100}%`;
}
