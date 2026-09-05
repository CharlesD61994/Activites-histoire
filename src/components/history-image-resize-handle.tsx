"use client";
import { useRef } from "react";
import type { HistoryChoiceOption } from "@/types";
import { imageChoiceSize } from "@/lib/history-canvas";

export function HistoryImageResizeHandle({ choice, onResize }: { choice: HistoryChoiceOption; onResize: (patch: Partial<HistoryChoiceOption>) => void }) {
  const drag = useRef<{ x: number; y: number; width: number; height: number; scaleX: number; scaleY: number } | null>(null);
  return <span className="history-image-resize-handle" role="button" tabIndex={0} aria-label={`Redimensionner ${choice.text}`} title="Glisser pour redimensionner cette carte" onPointerDown={(event) => {
    event.preventDefault(); event.stopPropagation();
    const size = imageChoiceSize(choice);
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, ...size, scaleX: rect.width / size.width, scaleY: rect.height / size.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  }} onPointerMove={(event) => {
    if (!drag.current) return;
    event.stopPropagation();
    const start = drag.current;
    onResize({ imageWidth: Math.round(Math.max(120, Math.min(720, start.width + (event.clientX - start.x) / start.scaleX))), imageHeight: Math.round(Math.max(120, Math.min(1100, start.height + (event.clientY - start.y) / start.scaleY))) });
  }} onPointerUp={(event) => { event.stopPropagation(); drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const size = imageChoiceSize(choice);
    onResize({ imageWidth: Math.max(120, Math.min(720, size.width + (event.key === "ArrowRight" ? 10 : event.key === "ArrowLeft" ? -10 : 0))), imageHeight: Math.max(120, Math.min(1100, size.height + (event.key === "ArrowDown" ? 10 : event.key === "ArrowUp" ? -10 : 0))) });
  }} />;
}
