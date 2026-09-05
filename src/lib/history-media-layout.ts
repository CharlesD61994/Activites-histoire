import type { HistoryQuestion } from "../types";
import { historyInteractionActionAreaHeight, interactionBlockSize } from "./history-canvas";

export function normalizeHistoryChoiceLabels(question: HistoryQuestion): HistoryQuestion {
  if (!["choice_single", "choice_multiple", "image_selection"].includes(question.action)) return question;
  const choices = question.choices;
  if (choices?.length !== 2 || choices[0].text.trim().toLowerCase() !== "vrai" || choices[1].text.trim().toLowerCase() !== "faux") return question;
  return { ...question, choices: choices.map((choice, index) => ({ ...choice, text: `Choix #${index + 1}` })) };
}

export function fitHistoryMedia(question: HistoryQuestion, ratios: Record<string, number>): HistoryQuestion {
  let next = normalizeHistoryChoiceLabels(question);
  if (next.action === "image_selection") {
    const choices = next.choices?.map((choice) => {
      const ratio = ratios[choice.documentId ?? ""];
      return ratio && ratio !== choice.imageAspectRatio ? { ...choice, imageAspectRatio: ratio } : choice;
    });
    if (choices?.some((choice, index) => choice !== next.choices?.[index])) next = { ...next, choices };
    const size = interactionBlockSize(next);
    if (next.canvas) {
      const blocks = next.canvas.blocks.map((block) => {
        if (block.type !== "interaction" || (block.contentWidth === size.width && block.contentHeight === size.height)) return block;
        return { ...block, width: size.width, height: size.height, contentWidth: size.width, contentHeight: size.height };
      });
      if (blocks.some((block, index) => block !== next.canvas!.blocks[index])) next = { ...next, canvas: { ...next.canvas, blocks } };
    }
  }
  const ratio = ratios[next.hotspot?.documentId ?? ""];
  if (next.action === "document_hotspot" && ratio && next.canvas) {
    const blocks = next.canvas.blocks.map((block) => {
      if (block.type !== "interaction" || block.aspectRatio === ratio) return block;
      const bodyHeight = block.height * (1 - historyInteractionActionAreaHeight / interactionBlockSize(next).height);
      const width = Math.min(block.width, bodyHeight * ratio);
      const height = width / ratio / (1 - historyInteractionActionAreaHeight / interactionBlockSize(next).height);
      return { ...block, x: block.x + (block.width - width) / 2, width, height, aspectRatio: ratio };
    });
    if (blocks.some((block, index) => block !== next.canvas!.blocks[index])) next = { ...next, canvas: { ...next.canvas, blocks } };
  }
  return next;
}
