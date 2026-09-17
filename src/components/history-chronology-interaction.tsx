"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { HistoryTimelineEvent } from "@/types";

type Props = {
  events: HistoryTimelineEvent[];
  order: string[];
  lockedIds?: string[];
  correctIds?: string[];
  wrongIds?: string[];
  disabled?: boolean;
  revealed?: boolean;
  preview?: boolean;
  onMove?: (id: string, target: number) => void;
};

export function HistoryChronologyInteraction({ events, order, lockedIds = [], correctIds = [], wrongIds = [], disabled, revealed, preview, onMove }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const ignoreClick = useRef(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; target: number | null } | null>(null);
  const [message, setMessage] = useState("");
  const blocked = Boolean(disabled || revealed || preview);
  const number = (id: string) => { const index = events.findIndex((item) => item.id === id); return events[index]?.documentNumber ?? index + 1; };
  const locked = (id: string) => blocked || lockedIds.includes(id);

  function destination(x: number, y: number) {
    for (const slot of root.current?.querySelectorAll<HTMLElement>("[data-chronology-slot]") ?? []) {
      const rect = slot.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return Number(slot.dataset.chronologySlot);
    }
    const rect = root.current?.querySelector(".history-chronology-bank")?.getBoundingClientRect();
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom ? -1 : null;
  }

  function place(id: string, target: number) {
    if (locked(id) || (target >= 0 && lockedIds.includes(order[target]))) return;
    onMove?.(id, target);
    setSelected(null);
    setMessage(target < 0 ? `Document ${number(id)} remis dans la banque.` : `Document ${number(id)} placé au rang ${target + 1}.`);
  }

  function start(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (locked(id) || event.button !== 0 || !event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id, x: event.clientX, y: event.clientY, moved: false };
    ignoreClick.current = false;
  }

  function track(event: PointerEvent<HTMLButtonElement>) {
    const origin = gesture.current;
    if (!origin) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 5 && !origin.moved) return;
    origin.moved = true;
    const rect = event.currentTarget.getBoundingClientRect();
    setDrag({ id: origin.id, x: (event.clientX - origin.x) / (rect.width / event.currentTarget.offsetWidth || 1), y: (event.clientY - origin.y) / (rect.height / event.currentTarget.offsetHeight || 1), target: destination(event.clientX, event.clientY) });
  }

  function finish(event: PointerEvent<HTMLButtonElement>) {
    const origin = gesture.current;
    if (origin?.moved) {
      ignoreClick.current = true;
      const target = destination(event.clientX, event.clientY);
      if (target !== null) place(origin.id, target);
    }
    gesture.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function token(id: string, slot?: number) {
    const good = lockedIds.includes(id) || correctIds.includes(id);
    const wrong = !revealed && wrongIds.includes(id) && !good;
    return <button type="button" key={id} className={`history-chronology-circle ${good ? "earned" : wrong ? "wrong" : revealed ? "revealed" : ""} ${selected === id ? "selected" : ""} ${drag?.id === id ? "is-dragging" : ""}`}
      aria-label={`Document ${number(id)}${slot === undefined ? ", dans la banque" : `, rang ${slot + 1}`}${good ? ", bonne réponse verrouillée" : wrong ? ", à corriger" : ""}`}
      aria-pressed={selected === id} disabled={!preview && locked(id)} tabIndex={preview ? -1 : 0}
      style={drag?.id === id ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
      onPointerDown={preview ? undefined : (event) => start(event, id)} onPointerMove={track} onPointerUp={finish}
      onPointerCancel={() => { gesture.current = null; setDrag(null); }} onLostPointerCapture={() => { gesture.current = null; setDrag(null); }}
      onClick={() => {
        if (ignoreClick.current) { ignoreClick.current = false; return; }
        if (blocked) return;
        if (selected && selected !== id && slot !== undefined) place(selected, slot);
        else setSelected(selected === id ? null : id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { gesture.current = null; setDrag(null); setSelected(null); }
        if ((event.key === "Delete" || event.key === "Backspace") && slot !== undefined) { event.preventDefault(); place(id, -1); }
      }}>
      {number(id)}{(good || wrong) && <span className="history-chronology-mark" aria-hidden="true">{good ? "✓" : "×"}</span>}
    </button>;
  }

  return <div ref={root} className={`history-chronology ${preview ? "is-preview" : ""}`}>
    <div className="history-chronology-track" style={{ "--chronology-count": Math.max(1, events.length) } as CSSProperties} aria-label="Ordre chronologique, du plus ancien au plus récent">
      {events.map((item, index) => <div key={item.id} className={`history-chronology-slot ${drag?.target === index && !lockedIds.includes(order[index]) ? "is-drop-target" : ""}`} data-chronology-slot={index}>
        {index < events.length - 1 && <svg className="history-chronology-arrow" aria-hidden="true" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 H96" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" /><path d="M90 3 L100 10 L90 17 Z" fill="currentColor" /></svg>}
        {order[index] ? token(order[index], index) : <button type="button" className="history-chronology-circle is-empty" aria-label={`Rang ${index + 1}, emplacement vide`} disabled={!preview && blocked} tabIndex={preview ? -1 : 0} onClick={() => { if (selected) place(selected, index); }} />}
      </div>)}
    </div>
    <div className={`history-chronology-bank ${drag?.target === -1 ? "is-drop-target" : ""}`} aria-label="Banque de documents" onClick={(event) => { if (event.target === event.currentTarget && selected) place(selected, -1); }}>
      {events.filter((item) => !order.includes(item.id)).map((item) => token(item.id))}
      {events.every((item) => order.includes(item.id)) && <button type="button" className="history-chronology-return" aria-label="Remettre le numéro sélectionné dans la banque" disabled={blocked || !selected} onClick={() => { if (selected) place(selected, -1); }}>↶</button>}
    </div>
    <span className="sr-only" role="status">{message}</span>
  </div>;
}
