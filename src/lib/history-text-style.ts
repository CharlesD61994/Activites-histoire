import type { CSSProperties } from "react";
import type { HistoryTextStyle } from "@/types";

export const defaultHistoryTextStyle: Required<HistoryTextStyle> = {
  fontSize: 32,
  color: "#0b355d",
  bold: false,
  italic: false,
  underline: false,
  align: "left"
};

export function historyTextStyleToCss(style?: HistoryTextStyle): CSSProperties {
  return {
    fontSize: style?.fontSize ? `${style.fontSize}px` : undefined,
    color: style?.color || undefined,
    fontWeight: style?.bold ? 800 : undefined,
    fontStyle: style?.italic ? "italic" : undefined,
    textDecoration: style?.underline ? "underline" : undefined,
    textAlign: style?.align
  };
}
