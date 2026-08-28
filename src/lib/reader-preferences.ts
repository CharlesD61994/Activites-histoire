const AUTO_FULLSCREEN_KEY = "alinea-history-reader-auto-fullscreen";

export function autoFullscreenFromStoredValue(value: string | null) {
  return value !== "false";
}

export function getReaderAutoFullscreen() {
  if (typeof window === "undefined") return true;
  return autoFullscreenFromStoredValue(window.localStorage.getItem(AUTO_FULLSCREEN_KEY));
}

export function setReaderAutoFullscreen(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_FULLSCREEN_KEY, String(enabled));
}

export function requestReaderFullscreen() {
  if (typeof document === "undefined" || !getReaderAutoFullscreen() || document.fullscreenElement) return Promise.resolve();
  return document.documentElement.requestFullscreen().catch(() => undefined);
}

export function exitReaderFullscreen() {
  if (typeof document === "undefined" || !document.fullscreenElement) return Promise.resolve();
  return document.exitFullscreen().catch(() => undefined);
}
