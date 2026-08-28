import type { CSSProperties } from "react";
import type { HistoryActivityCanvas } from "@/types";

export const historyBackgroundPresets = [
  { id: "white", label: "Blanc", color: "#ffffff", pattern: "none" },
  { id: "mist", label: "Brume", color: "#eef5f8", pattern: "none" },
  { id: "paper", label: "Papier", color: "#fffaf0", pattern: "none" },
  { id: "sky", label: "Ciel", color: "#dceef8", pattern: "none" },
  { id: "grid", label: "Quadrillé", color: "#ffffff", pattern: "grid" },
  { id: "dots", label: "Points", color: "#ffffff", pattern: "dots" },
  { id: "lines", label: "Ligné", color: "#fffef9", pattern: "lines" },
  { id: "blueprint", label: "Plan bleu", color: "#1879ad", pattern: "blueprint" },
  { id: "chalkboard", label: "Tableau", color: "#214d42", pattern: "chalkboard" }
] as const;

function patternStyle(pattern: HistoryActivityCanvas["backgroundPattern"]): CSSProperties {
  if (pattern === "grid") return {
    backgroundImage: "linear-gradient(rgb(31 111 159 / 16%) 1px, transparent 1px), linear-gradient(90deg, rgb(31 111 159 / 16%) 1px, transparent 1px)",
    backgroundSize: "40px 40px"
  };
  if (pattern === "dots") return {
    backgroundImage: "radial-gradient(circle, rgb(31 111 159 / 28%) 2px, transparent 2.5px)",
    backgroundSize: "32px 32px"
  };
  if (pattern === "lines") return {
    backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 37px, rgb(57 124 166 / 20%) 38px, transparent 39px)",
    backgroundSize: "100% 40px"
  };
  if (pattern === "blueprint") return {
    backgroundImage: "linear-gradient(rgb(255 255 255 / 18%) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 18%) 1px, transparent 1px)",
    backgroundSize: "40px 40px"
  };
  if (pattern === "chalkboard") return {
    backgroundImage: "radial-gradient(circle at 20% 30%, rgb(255 255 255 / 5%) 0 1px, transparent 2px), radial-gradient(circle at 75% 60%, rgb(255 255 255 / 4%) 0 1px, transparent 2px)",
    backgroundSize: "34px 34px, 46px 46px"
  };
  return {};
}

export function historyCanvasBackgroundStyle(canvas: HistoryActivityCanvas): CSSProperties {
  if (canvas.backgroundImage) {
    const opacity = Math.max(0, Math.min(1, canvas.backgroundImageOpacity ?? 1));
    const veil = opacity < 1 ? `linear-gradient(rgb(255 255 255 / ${1 - opacity}), rgb(255 255 255 / ${1 - opacity})), ` : "";
    return {
      backgroundImage: `${veil}url(${canvas.backgroundImage})`,
      backgroundSize: canvas.backgroundImageFit === "stretch" ? "100% 100%" : canvas.backgroundImageFit ?? "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    };
  }
  return patternStyle(canvas.backgroundPattern);
}

export function HistoryCanvasBackground({ canvas }: { canvas: HistoryActivityCanvas }) {
  if (!canvas.backgroundImage && (!canvas.backgroundPattern || canvas.backgroundPattern === "none")) return null;
  return <div className="history-canvas-stage-background" style={{ ...historyCanvasBackgroundStyle(canvas), opacity: canvas.backgroundImage ? canvas.backgroundImageOpacity ?? 1 : 1 }} />;
}
