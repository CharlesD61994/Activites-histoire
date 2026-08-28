import type { CSSProperties } from "react";
import type { HistoryActivityCanvas } from "@/types";

export const historyBackgroundPresets = [
  { id: "white", label: "Blanc", color: "#ffffff", pattern: "none" },
  { id: "mist", label: "Brume claire", color: "#eef5f8", pattern: "none" },
  { id: "paper", label: "Papier doux", color: "#fffaf0", pattern: "parchment" },
  { id: "sky", label: "Ciel pâle", color: "#dceef8", pattern: "soft-waves" },
  { id: "grid", label: "Quadrillé", color: "#ffffff", pattern: "grid" },
  { id: "dots", label: "Points", color: "#ffffff", pattern: "dots" },
  { id: "lines", label: "Ligné", color: "#fffef9", pattern: "lines" },
  { id: "blueprint", label: "Plan bleu", color: "#1879ad", pattern: "blueprint" },
  { id: "chalkboard", label: "Tableau", color: "#214d42", pattern: "chalkboard" },
  { id: "timeline", label: "Ligne du temps", color: "#f7fbff", pattern: "timeline" },
  { id: "map", label: "Carte ancienne", color: "#f2e4c8", pattern: "map" },
  { id: "notebook", label: "Cahier", color: "#fffdf6", pattern: "notebook" },
  { id: "crosshatch", label: "Croquis", color: "#f3f8fb", pattern: "crosshatch" }
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
  if (pattern === "parchment") return {
    backgroundImage: "radial-gradient(circle at 18% 24%, rgb(168 125 68 / 10%) 0 1px, transparent 2px), radial-gradient(circle at 76% 68%, rgb(168 125 68 / 8%) 0 1px, transparent 2px), linear-gradient(135deg, rgb(255 255 255 / 35%), transparent 45%, rgb(145 101 45 / 8%))",
    backgroundSize: "30px 30px, 42px 42px, 100% 100%"
  };
  if (pattern === "timeline") return {
    backgroundImage: "linear-gradient(90deg, transparent 0, transparent calc(50% - 1px), rgb(31 111 159 / 18%) calc(50% - 1px), rgb(31 111 159 / 18%) calc(50% + 1px), transparent calc(50% + 1px)), repeating-linear-gradient(90deg, transparent 0, transparent 94px, rgb(31 111 159 / 16%) 95px, transparent 96px)",
    backgroundSize: "100% 100%, 96px 100%"
  };
  if (pattern === "map") return {
    backgroundImage: "radial-gradient(ellipse at 20% 28%, rgb(31 111 159 / 10%) 0 18%, transparent 19%), radial-gradient(ellipse at 76% 68%, rgb(31 111 159 / 8%) 0 16%, transparent 17%), linear-gradient(120deg, transparent 0 44%, rgb(99 78 45 / 12%) 45%, transparent 46% 100%)",
    backgroundSize: "420px 250px, 360px 260px, 160px 160px",
    backgroundPosition: "0 0, 120px 80px, 0 0"
  };
  if (pattern === "notebook") return {
    backgroundImage: "linear-gradient(90deg, rgb(218 72 72 / 22%) 0 2px, transparent 2px), repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgb(31 111 159 / 16%) 32px, transparent 33px)",
    backgroundSize: "72px 100%, 100% 33px",
    backgroundPosition: "72px 0, 0 0"
  };
  if (pattern === "crosshatch") return {
    backgroundImage: "repeating-linear-gradient(45deg, rgb(31 111 159 / 8%) 0 1px, transparent 1px 18px), repeating-linear-gradient(135deg, rgb(31 111 159 / 6%) 0 1px, transparent 1px 18px)",
    backgroundSize: "18px 18px"
  };
  if (pattern === "soft-waves") return {
    backgroundImage: "radial-gradient(ellipse at 20% 18%, rgb(31 111 159 / 10%) 0 18%, transparent 19%), radial-gradient(ellipse at 86% 82%, rgb(55 150 124 / 10%) 0 22%, transparent 23%)",
    backgroundSize: "480px 280px, 520px 320px",
    backgroundPosition: "0 0, 100% 100%"
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
