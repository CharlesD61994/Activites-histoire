import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryQuestion } from "../types";

export const historyCanvasLayoutVersion = 5;

export type HistoryResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

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

export function blockScales(block: HistoryCanvasBlock, question: HistoryQuestion) {
  const base = scalableBlockSize(block, question);
  if (!base) return { x: 1, y: 1 };
  return {
    x: Math.max(0.001, block.width / base.width),
    y: Math.max(0.001, block.height / base.height)
  };
}

function minimumBlockSize(block: HistoryCanvasBlock, question: HistoryQuestion) {
  const base = scalableBlockSize(block, question);
  if (base) return { width: base.width * 0.25, height: base.height * 0.25 };
  if (block.type === "document") return { width: 120, height: 90 };
  return { width: 80, height: 55 };
}

export function resizeHistoryCanvasBlock(
  block: HistoryCanvasBlock,
  handle: HistoryResizeHandle,
  dx: number,
  dy: number,
  canvas: Pick<HistoryActivityCanvas, "width" | "height">,
  question: HistoryQuestion
): HistoryCanvasBlock {
  const minimum = minimumBlockSize(block, question);
  const right = block.x + block.width;
  const bottom = block.y + block.height;
  const fromLeft = handle.includes("w");
  const fromTop = handle.includes("n");
  const isCorner = handle.length === 2;

  if (isCorner) {
    const horizontalScale = (block.width + (fromLeft ? -dx : dx)) / block.width;
    const verticalScale = (block.height + (fromTop ? -dy : dy)) / block.height;
    const desiredScale = Math.abs(horizontalScale - 1) >= Math.abs(verticalScale - 1)
      ? horizontalScale
      : verticalScale;
    const minimumScale = Math.max(minimum.width / block.width, minimum.height / block.height);
    const maximumScale = Math.min(
      (fromLeft ? right : canvas.width - block.x) / block.width,
      (fromTop ? bottom : canvas.height - block.y) / block.height
    );
    const scale = clampCanvasValue(desiredScale, minimumScale, maximumScale);
    const width = block.width * scale;
    const height = block.height * scale;
    return {
      ...block,
      x: fromLeft ? right - width : block.x,
      y: fromTop ? bottom - height : block.y,
      width,
      height
    };
  }

  if (handle === "e") {
    return { ...block, width: clampCanvasValue(block.width + dx, minimum.width, canvas.width - block.x) };
  }
  if (handle === "w") {
    const x = clampCanvasValue(block.x + dx, 0, right - minimum.width);
    return { ...block, x, width: right - x };
  }
  if (handle === "s") {
    return { ...block, height: clampCanvasValue(block.height + dy, minimum.height, canvas.height - block.y) };
  }

  const y = clampCanvasValue(block.y + dy, 0, bottom - minimum.height);
  return { ...block, y, height: bottom - y };
}

function clampCanvasValue(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
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
