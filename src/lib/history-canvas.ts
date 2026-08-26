import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryQuestion } from "../types";

export const historyCanvasLayoutVersion = 5;

export function interactionBlockSize(question: HistoryQuestion) {
  if (question.action === "short_text") return { width: 520, height: 103 };
  if (question.action === "document_hotspot") return { width: 760, height: 500 };
  if (question.action === "choice_single" || question.action === "choice_multiple") {
    return { width: 680, height: Math.max(150, Math.ceil((question.choices?.length ?? 2) / 2) * 135) };
  }
  if (question.action === "classification") return { width: 720, height: Math.max(180, (question.classificationItems?.length ?? 1) * 120) };
  if (question.action === "matching") return { width: 720, height: Math.max(180, (question.matchingPrompts?.length ?? 1) * 120) };
  if (question.action === "chronological_order" || question.action === "timeline") return { width: 760, height: Math.max(200, (question.timelineEvents?.length ?? 2) * 105) };
  return { width: 720, height: Math.max(220, (question.clozeBlanks?.length ?? 1) * 105 + 100) };
}

export function scalableBlockSize(block: HistoryCanvasBlock, question: HistoryQuestion) {
  if (block.type === "text") return { width: 1440, height: 110 };
  if (block.type === "interaction") return interactionBlockSize(question);
  if (block.type === "validation") return { width: 260, height: 95 };
  if (block.type === "feedback") return { width: 520, height: 110 };
  return null;
}

export function blockScale(block: HistoryCanvasBlock, question: HistoryQuestion) {
  const base = scalableBlockSize(block, question);
  if (!base) return 1;
  return block.width / base.width;
}

export function blockAspectRatio(block: HistoryCanvasBlock, question: HistoryQuestion) {
  if (block.type === "document") return block.aspectRatio;
  const base = scalableBlockSize(block, question);
  return base ? base.width / base.height : undefined;
}

export function resizeHistoryInteractionBlocks(canvas: HistoryActivityCanvas, question: HistoryQuestion): HistoryActivityCanvas {
  const size = interactionBlockSize(question);
  return {
    ...canvas,
    layoutVersion: historyCanvasLayoutVersion,
    blocks: canvas.blocks.map((block) => block.type === "interaction" ? {
      ...block,
      width: size.width,
      height: size.height,
      x: Math.min(block.x, canvas.width - size.width),
      y: Math.min(block.y, canvas.height - size.height)
    } : block)
  };
}

export function normalizeHistoryCanvasLayout(canvas: HistoryActivityCanvas, question: HistoryQuestion): HistoryActivityCanvas {
  if ((canvas.layoutVersion ?? 0) >= historyCanvasLayoutVersion) return canvas;

  return {
    ...canvas,
    layoutVersion: historyCanvasLayoutVersion,
    blocks: canvas.blocks.map((block) => {
      const base = scalableBlockSize(block, question);
      if (!base) return block;
      const scale = block.type === "interaction" && (canvas.layoutVersion ?? 0) < 2
        ? 1
        : Math.max(0.25, block.width / base.width);
      const width = base.width * scale;
      const height = base.height * scale;
      return {
        ...block,
        width,
        height,
        x: Math.min(block.x, canvas.width - width),
        y: Math.min(block.y, canvas.height - height)
      };
    })
  };
}
