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
