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

function colorChannel(hex: string, start: number) {
  return Number.parseInt(hex.slice(start, start + 2), 16);
}

function patternInk(background?: string) {
  const color = /^#[0-9a-f]{6}$/i.test(background ?? "") ? background ?? "#ffffff" : "#ffffff";
  const red = colorChannel(color, 1);
  const green = colorChannel(color, 3);
  const blue = colorChannel(color, 5);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance < 0.45
    ? { subtle: "rgb(255 255 255 / 24%)", medium: "rgb(255 255 255 / 34%)", soft: "rgb(255 255 255 / 12%)" }
    : { subtle: "rgb(31 111 159 / 18%)", medium: "rgb(31 111 159 / 30%)", soft: "rgb(57 124 166 / 14%)" };
}

function patternStyle(pattern: HistoryActivityCanvas["backgroundPattern"], background?: string): CSSProperties {
  const ink = patternInk(background);
  if (pattern === "grid") return {
    backgroundImage: `linear-gradient(${ink.subtle} 1px, transparent 1px), linear-gradient(90deg, ${ink.subtle} 1px, transparent 1px)`,
    backgroundSize: "40px 40px"
  };
  if (pattern === "dots") return {
    backgroundImage: `radial-gradient(circle, ${ink.medium} 2px, transparent 2.5px)`,
    backgroundSize: "32px 32px"
  };
  if (pattern === "lines") return {
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 37px, ${ink.medium} 38px, transparent 39px)`,
    backgroundSize: "100% 40px"
  };
  if (pattern === "blueprint") return {
    backgroundImage: `linear-gradient(${ink.medium} 1px, transparent 1px), linear-gradient(90deg, ${ink.medium} 1px, transparent 1px)`,
    backgroundSize: "40px 40px"
  };
  if (pattern === "chalkboard") return {
    backgroundImage: `radial-gradient(circle at 20% 30%, ${ink.soft} 0 1px, transparent 2px), radial-gradient(circle at 75% 60%, ${ink.soft} 0 1px, transparent 2px)`,
    backgroundSize: "34px 34px, 46px 46px"
  };
  if (pattern === "parchment") return {
    backgroundImage: `radial-gradient(circle at 18% 24%, ${ink.subtle} 0 1px, transparent 2px), radial-gradient(circle at 76% 68%, ${ink.soft} 0 1px, transparent 2px), linear-gradient(135deg, rgb(255 255 255 / 20%), transparent 45%, ${ink.soft})`,
    backgroundSize: "30px 30px, 42px 42px, 100% 100%"
  };
  if (pattern === "timeline") return {
    backgroundImage: `linear-gradient(90deg, transparent 0, transparent calc(50% - 1px), ${ink.medium} calc(50% - 1px), ${ink.medium} calc(50% + 1px), transparent calc(50% + 1px)), repeating-linear-gradient(90deg, transparent 0, transparent 94px, ${ink.subtle} 95px, transparent 96px)`,
    backgroundSize: "100% 100%, 96px 100%"
  };
  if (pattern === "map") return {
    backgroundImage: `radial-gradient(ellipse at 20% 28%, ${ink.soft} 0 18%, transparent 19%), radial-gradient(ellipse at 76% 68%, ${ink.soft} 0 16%, transparent 17%), linear-gradient(120deg, transparent 0 44%, ${ink.subtle} 45%, transparent 46% 100%)`,
    backgroundSize: "420px 250px, 360px 260px, 160px 160px",
    backgroundPosition: "0 0, 120px 80px, 0 0"
  };
  if (pattern === "notebook") return {
    backgroundImage: `linear-gradient(90deg, rgb(218 72 72 / 34%) 0 2px, transparent 2px), repeating-linear-gradient(to bottom, transparent 0, transparent 31px, ${ink.subtle} 32px, transparent 33px)`,
    backgroundSize: "72px 100%, 100% 33px",
    backgroundPosition: "72px 0, 0 0"
  };
  if (pattern === "crosshatch") return {
    backgroundImage: `repeating-linear-gradient(45deg, ${ink.subtle} 0 1px, transparent 1px 18px), repeating-linear-gradient(135deg, ${ink.soft} 0 1px, transparent 1px 18px)`,
    backgroundSize: "18px 18px"
  };
  if (pattern === "soft-waves") return {
    backgroundImage: `radial-gradient(ellipse at 20% 18%, ${ink.soft} 0 18%, transparent 19%), radial-gradient(ellipse at 86% 82%, ${ink.subtle} 0 22%, transparent 23%)`,
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
  return patternStyle(canvas.backgroundPattern, canvas.background);
}

export function HistoryCanvasBackground({ canvas }: { canvas: HistoryActivityCanvas }) {
  if (!canvas.backgroundImage && (!canvas.backgroundPattern || canvas.backgroundPattern === "none")) return null;
  return <div className="history-canvas-stage-background" style={{ ...historyCanvasBackgroundStyle(canvas), opacity: canvas.backgroundImage ? canvas.backgroundImageOpacity ?? 1 : 1 }} />;
}
