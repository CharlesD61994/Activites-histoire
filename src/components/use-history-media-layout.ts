"use client";
import { useEffect, useMemo, useState } from "react";
import type { HistoryQuestion, HistorySourceDocument } from "@/types";
import { fitHistoryMedia } from "@/lib/history-media-layout";

export function useHistoryMediaLayout(question: HistoryQuestion, documents: HistorySourceDocument[]) {
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const sources = useMemo(() => JSON.stringify(documents.filter((document) => document.src).map(({ id, src }) => ({ id, src }))), [documents]);
  useEffect(() => {
    let active = true;
    setRatios({});
    for (const { id, src } of JSON.parse(sources) as { id: string; src: string }[]) {
      const image = new Image();
      image.onload = () => {
        if (active && image.naturalWidth && image.naturalHeight) setRatios((current) => ({ ...current, [id]: image.naturalWidth / image.naturalHeight }));
      };
      image.src = src;
    }
    return () => { active = false; };
  }, [sources]);
  return useMemo(() => question ? fitHistoryMedia(question, ratios) : question, [question, ratios]);
}
