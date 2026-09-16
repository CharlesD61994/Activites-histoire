"use client";

import { useRef, useState, type PointerEvent } from "react";
import { GripVertical, LockKeyhole } from "lucide-react";
import type { HistoryQuestion } from "@/types";

type Props = {
  events: NonNullable<HistoryQuestion["timelineEvents"]>;
  order: string[];
  lockedIds?: string[];
  correctIds?: string[];
  wrongIds?: string[];
  disabled?: boolean;
  preview?: boolean;
  revealed?: boolean;
  onMove?: (id: string, offset: number) => void;
};

export function HistoryOrderInteraction({ events, order, lockedIds = [], correctIds = [], wrongIds = [], disabled, preview, revealed, onMove }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ id: string; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; target: string; offset: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const locked = (id: string) => Boolean(disabled || revealed || lockedIds.includes(id));

  function move(id: string, target: string) {
    onMove?.(id, order.indexOf(target) - order.indexOf(id));
    setAnnouncement(`Carte déplacée à la position ${order.indexOf(target) + 1} sur ${order.length}.`);
  }

  function track(event: PointerEvent<HTMLDivElement>) {
    const origin = start.current;
    if (!origin || locked(origin.id)) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 5 && !drag) return;
    const cards = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-order-id]") ?? []);
    let target = origin.id;
    let distance = Infinity;
    for (const card of cards) {
      const id = card.dataset.orderId!;
      if (locked(id)) continue;
      const rect = card.getBoundingClientRect();
      const displacement = drag?.id === id ? drag.offset * (rect.height / card.offsetHeight || 1) : 0;
      const nextDistance = Math.abs(event.clientY - (rect.top - displacement + rect.height / 2));
      if (nextDistance < distance) { target = id; distance = nextDistance; }
    }
    const card = event.currentTarget;
    const scale = card.getBoundingClientRect().height / card.offsetHeight || 1;
    setDrag({ id: origin.id, target, offset: (event.clientY - origin.y) / scale });
  }

  return (
    <>
      <div ref={listRef} className={`history-order-list history-draggable-order ${preview ? "is-preview" : ""}`} role="list" aria-label="Événements à classer du plus ancien au plus récent">
        {order.map((id, index) => {
          const item = events.find((event) => event.id === id);
          if (!item) return null;
          const isLocked = locked(id);
          return (
            <div key={id} data-order-id={id} role="listitem" tabIndex={preview ? undefined : 0}
              aria-label={`${index + 1}. ${item.dateLabel ? `${item.dateLabel}, ` : ""}${item.text}. ${isLocked ? "Carte verrouillée." : "Glissez pour déplacer ou utilisez les flèches haut et bas."}`}
              className={[correctIds.includes(id) || lockedIds.includes(id) ? "earned" : wrongIds.includes(id) ? "wrong" : revealed ? "revealed" : "", isLocked ? "is-locked" : "", drag?.id === id ? "is-dragging" : "", drag?.target === id && drag.id !== id ? "is-drop-target" : ""].join(" ")}
              style={drag?.id === id ? { transform: `translateY(${drag.offset}px)` } : undefined}
              onPointerDown={preview ? undefined : (event) => {
                if (isLocked || event.button !== 0 || !event.isPrimary) return;
                event.preventDefault();
                event.currentTarget.focus();
                event.currentTarget.setPointerCapture(event.pointerId);
                start.current = { id, x: event.clientX, y: event.clientY };
              }}
              onPointerMove={preview ? undefined : track}
              onPointerUp={preview ? undefined : (event) => {
                if (drag && !isLocked) move(drag.id, drag.target);
                start.current = null;
                setDrag(null);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onLostPointerCapture={() => { start.current = null; setDrag(null); }}
              onPointerCancel={() => { start.current = null; setDrag(null); }}
              onKeyDown={preview ? undefined : (event) => {
                if (event.key === "Escape") { start.current = null; setDrag(null); return; }
                if (isLocked || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
                event.preventDefault();
                const movable = order.filter((itemId) => !locked(itemId));
                const target = movable[movable.indexOf(id) + (event.key === "ArrowUp" ? -1 : 1)];
                if (target) move(id, target);
              }}>
              <span className="history-order-position" aria-hidden="true">{index + 1}</span>
              <span>{item.dateLabel && <small>{item.dateLabel}</small>}{item.text}</span>
              {isLocked ? <LockKeyhole size={20} aria-hidden="true" /> : <GripVertical size={22} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <span className="sr-only" role="status">{announcement}</span>
    </>
  );
}
