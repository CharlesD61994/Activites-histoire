import type { HistoryActivityCanvas, HistoryCanvasBlock, HistoryQuestion } from "../types";

export const historyCanvasLayoutVersion = 6;

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
  return { width: 920, height: Math.max(300, 190 + Math.ceil(((question.clozeBlanks?.length ?? 1) + (question.clozeDistractors?.length ?? 0)) / 4) * 62) };
}

export function scalableBlockSize(block: HistoryCanvasBlock, question: HistoryQuestion) {
  if (block.type === "text") return { width: 1440, height: 110 };
  if (block.type === "interaction") return interactionBlockSize(question);
  if (block.type === "validation") return { width: 260, height: 95 };
  if (block.type === "feedback") return { width: 520, height: 110 };
  return null;
}

export function blockContentSize(block: HistoryCanvasBlock, question: HistoryQuestion) {
  const scalableSize = scalableBlockSize(block, question);
  if (scalableSize) return scalableSize;
  return {
    width: Math.max(1, block.contentWidth ?? block.width),
    height: Math.max(1, block.contentHeight ?? block.height)
  };
}

export function blockScales(block: HistoryCanvasBlock, question: HistoryQuestion) {
  const base = blockContentSize(block, question);
  return {
    x: Math.max(0.001, block.width / base.width),
    y: Math.max(0.001, block.height / base.height)
  };
}

function minimumBlockSize(block: HistoryCanvasBlock, question: HistoryQuestion) {
  const base = blockContentSize(block, question);
  return {
    width: Math.max(block.type === "document" ? 120 : 80, base.width * 0.25),
    height: Math.max(block.type === "document" ? 90 : 55, base.height * 0.25)
  };
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
  const interaction = canvas.blocks.find((block) => block.type === "interaction");
  const resizedInteraction = interaction ? {
    ...interaction,
    width: size.width,
    height: size.height,
    contentWidth: size.width,
    contentHeight: size.height,
    x: Math.min(interaction.x, canvas.width - size.width),
    y: Math.min(interaction.y, canvas.height - size.height)
  } : null;

  return {
    ...canvas,
    layoutVersion: historyCanvasLayoutVersion,
    blocks: canvas.blocks.map((block) => {
      if (block.type === "interaction" && resizedInteraction) return resizedInteraction;
      if (block.type !== "validation" || !resizedInteraction) return block;
      const overlaps = block.x < resizedInteraction.x + resizedInteraction.width
        && block.x + block.width > resizedInteraction.x
        && block.y < resizedInteraction.y + resizedInteraction.height
        && block.y + block.height > resizedInteraction.y;
      if (!overlaps) return block;
      return {
        ...block,
        y: Math.min(canvas.height - block.height, resizedInteraction.y + resizedInteraction.height + 24)
      };
    })
  };
}

export function normalizeHistoryCanvasLayout(canvas: HistoryActivityCanvas, question: HistoryQuestion): HistoryActivityCanvas {
  if ((canvas.layoutVersion ?? 0) >= historyCanvasLayoutVersion) return canvas;

  if ((canvas.layoutVersion ?? 0) >= 5) {
    return {
      ...canvas,
      layoutVersion: historyCanvasLayoutVersion,
      blocks: canvas.blocks.map((block) => {
        const base = scalableBlockSize(block, question) ?? { width: block.width, height: block.height };
        return {
          ...block,
          contentWidth: block.contentWidth ?? base.width,
          contentHeight: block.contentHeight ?? base.height
        };
      })
    };
  }

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
        contentWidth: base.width,
        contentHeight: base.height,
        x: Math.min(block.x, canvas.width - width),
        y: Math.min(block.y, canvas.height - height)
      };
    })
  };
}
