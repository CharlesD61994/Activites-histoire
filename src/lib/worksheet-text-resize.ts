type Frame = { x: number; y: number; width: number; height: number };
type Handle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export function resizeWorksheetText(frame: Frame, handle: Handle, dx: number, dy: number, bounds = { width: 1056, height: 816 }): Frame {
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const west = handle.includes("w"), north = handle.includes("n");
  const horizontal = west || handle.includes("e"), vertical = north || handle.includes("s");
  let width = frame.width, height = frame.height;
  const maxWidth = west ? frame.x + frame.width : bounds.width - frame.x;
  const maxHeight = north ? frame.y + frame.height : bounds.height - frame.y;
  if (horizontal && vertical) {
    const scaleX = (west ? -dx : dx) / frame.width;
    const scaleY = (north ? -dy : dy) / frame.height;
    const scale = clamp(1 + (Math.abs(scaleX) >= Math.abs(scaleY) ? scaleX : scaleY), Math.max(80 / frame.width, 24 / frame.height), Math.min(maxWidth / frame.width, maxHeight / frame.height));
    width *= scale;
    height *= scale;
  } else {
    if (horizontal) width = clamp(frame.width + (west ? -dx : dx), 80, maxWidth);
    if (vertical) height = clamp(frame.height + (north ? -dy : dy), 24, maxHeight);
  }
  return { x: west ? frame.x + frame.width - width : frame.x, y: north ? frame.y + frame.height - height : frame.y, width, height };
}
