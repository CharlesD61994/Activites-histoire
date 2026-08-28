export function historyShadowColor(color: string, opacity: number) {
  const normalized = color.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(normalized)) return color;
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0");
  return `#${normalized}${alpha}`;
}

export function historyDropShadow(color: string, distance: number, opacity: number) {
  return `drop-shadow(${distance}px ${distance}px 0 ${historyShadowColor(color, opacity)})`;
}

export function historyBoxShadow(color: string, distance: number, opacity: number) {
  return `${distance}px ${distance}px 0 ${historyShadowColor(color, opacity)}`;
}
