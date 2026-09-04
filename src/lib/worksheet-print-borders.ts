type BorderWidths = Record<"top" | "right" | "bottom" | "left", number>;

export function worksheetPrintBorderStyles(widths: BorderWidths) {
  const inset = {
    top: `${-widths.top}px`, right: `${-widths.right}px`,
    bottom: `${-widths.bottom}px`, left: `${-widths.left}px`
  };
  return [
    { width: widths.top, style: { top: inset.top, left: inset.left, right: inset.right, height: `${widths.top}px` } },
    { width: widths.right, style: { top: inset.top, right: inset.right, bottom: inset.bottom, width: `${widths.right}px` } },
    { width: widths.bottom, style: { bottom: inset.bottom, left: inset.left, right: inset.right, height: `${widths.bottom}px` } },
    { width: widths.left, style: { top: inset.top, left: inset.left, bottom: inset.bottom, width: `${widths.left}px` } }
  ].filter((edge) => edge.width > 0).map((edge) => edge.style);
}

function replaceBorders(element: HTMLElement, widths: BorderWidths) {
  // Keep the border space, but print solid rectangles instead of Chromium PDF hairlines.
  element.style.setProperty("border-color", "transparent", "important");
  for (const style of worksheetPrintBorderStyles(widths)) {
    const edge = element.ownerDocument.createElement("span");
    edge.className = "worksheet-print-border";
    edge.setAttribute("aria-hidden", "true");
    Object.assign(edge.style, {
      position: "absolute", background: "#202020", zIndex: "1",
      pointerEvents: "none", ...style
    });
    element.appendChild(edge);
  }
}

export function addWorksheetPrintBorders(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".worksheet-activity-table").forEach((table) => {
    if (table.classList.contains("worksheet-page-reference-block")) return;
    const section = table.classList.contains("worksheet-section-block");
    if (section) replaceBorders(table, { top: 1, right: 1, bottom: 1, left: 1 });
    table.querySelectorAll<HTMLElement>(".worksheet-table-cell").forEach((cell, index) => {
      replaceBorders(cell, section ? { top: 0, right: index === 0 ? 1 : 0, bottom: 0, left: 0 } : {
        top: parseFloat(cell.style.borderTopWidth) || 0,
        right: parseFloat(cell.style.borderRightWidth) || 0,
        bottom: parseFloat(cell.style.borderBottomWidth) || 0,
        left: parseFloat(cell.style.borderLeftWidth) || 0
      });
    });
  });
}
