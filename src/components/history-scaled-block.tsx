"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { blockContentSize } from "@/lib/history-canvas";
import type { HistoryCanvasBlock, HistoryQuestion } from "@/types";

// Lay out at the same logical pixel dimensions in both surfaces, then scale once.
export function HistoryScaledBlock({ block, question, children }: { block: HistoryCanvasBlock; question: HistoryQuestion; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: block.width, height: block.height });
  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  const base = blockContentSize(block, question);
  return <div ref={ref} className={`history-canvas-scaled-content content-${block.type}`} style={{ width: base.width, height: base.height, transform: `scale(${size.width / base.width}, ${size.height / base.height})` }}>{children}</div>;
}
