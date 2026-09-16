import type { HistoryQuestion } from "../types";

/** Reorder the movable cards while preserving the positions of earned answers. */
export function reorderHistoryEvents(order: string[], id: string, targetId: string, lockedIds: Set<string>): string[] {
  if (lockedIds.has(id) || lockedIds.has(targetId)) return order;
  const movable = order.filter((item) => !lockedIds.has(item));
  const from = movable.indexOf(id);
  const to = movable.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return order;
  movable.splice(to, 0, movable.splice(from, 1)[0]);
  let index = 0;
  return order.map((item) => lockedIds.has(item) ? item : movable[index++]);
}

export function initialHistoryEventOrder(question?: HistoryQuestion): string[] {
  const events = question?.timelineEvents ?? [];
  return question?.action === "chronological_order" ? events.map(() => "") : [...events].sort((a, b) => a.correctOrder - b.correctOrder).map((event) => event.id).reverse();
}

/** Move a token between slots or back to the bank (-1); displaced tokens return to the bank. */
export function placeHistoryDocument(order: string[], id: string, target: number, lockedIds: Set<string>): string[] {
  if (!id || lockedIds.has(id) || target < -1 || target >= order.length || !Number.isInteger(target) || (target >= 0 && lockedIds.has(order[target]))) return order;
  const next = order.map((item) => item === id ? "" : item);
  if (target >= 0) next[target] = id;
  return next;
}
