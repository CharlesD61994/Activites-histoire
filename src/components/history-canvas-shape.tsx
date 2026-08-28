import type { HistoryCanvasBlock } from "@/types";

type Props = Pick<HistoryCanvasBlock,
  | "shapeKind"
  | "shapeFillMode"
  | "shapeFillColor"
  | "shapeFillOpacity"
  | "shapeStrokeColor"
  | "shapeStrokeWidth"
>;

export function HistoryCanvasShape({
  shapeKind = "rectangle",
  shapeFillMode = "filled",
  shapeFillColor = "#d9eef8",
  shapeFillOpacity = 1,
  shapeStrokeColor = "#0b4a6f",
  shapeStrokeWidth = 3
}: Props) {
  const fill = shapeFillMode === "filled" && shapeKind !== "line" ? shapeFillColor : "none";
  const common = {
    fill,
    fillOpacity: shapeFillMode === "filled" ? shapeFillOpacity : 0,
    stroke: shapeStrokeColor,
    strokeWidth: shapeStrokeWidth,
    vectorEffect: "non-scaling-stroke" as const
  };

  return (
    <svg className="history-canvas-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {shapeKind === "rectangle" && <rect x="2" y="2" width="96" height="96" {...common} />}
      {shapeKind === "rounded_rectangle" && <rect x="2" y="2" width="96" height="96" rx="12" ry="12" {...common} />}
      {shapeKind === "circle" && <ellipse cx="50" cy="50" rx="48" ry="48" {...common} />}
      {shapeKind === "triangle" && <polygon points="50,3 97,97 3,97" strokeLinejoin="round" {...common} />}
      {shapeKind === "line" && <line x1="3" y1="50" x2="97" y2="50" strokeLinecap="round" {...common} />}
      {shapeKind === "arrow" && <polygon points="3,38 67,38 67,18 97,50 67,82 67,62 3,62" strokeLinejoin="round" {...common} />}
    </svg>
  );
}
