"use client";

import type { DragEvent } from "react";
import {
  Atom,
  Banknote,
  Building2,
  Map,
  Palette,
  UsersRound
} from "lucide-react";
import type {
  AspectMinitestAspect,
  AspectMinitestAspectKey,
  AspectMinitestData
} from "@/types";

export type AspectMinitestTokenStatus = "correct" | "wrong" | "revealed";

type Props = {
  data: AspectMinitestData;
  variant: "student" | "answer";
  placements?: Record<string, string>;
  tokenStatus?: Record<string, AspectMinitestTokenStatus>;
  earnedByAspect?: Record<string, number>;
  interactiveCorrection?: boolean;
  onAssign?: (phraseId: string, aspectId?: string) => void;
  className?: string;
};

export function AspectIcon({ aspectKey }: { aspectKey: AspectMinitestAspectKey }) {
  const props = { size: 42, strokeWidth: 1.45, "aria-hidden": true } as const;
  if (aspectKey === "society") return <UsersRound {...props} />;
  if (aspectKey === "politics") return <Building2 {...props} />;
  if (aspectKey === "economy") return <Banknote {...props} />;
  if (aspectKey === "culture") return <Palette {...props} />;
  if (aspectKey === "science") return <Atom {...props} />;
  return <Map {...props} />;
}

function MinitestHeader({ data }: { data: AspectMinitestData }) {
  const total = data.aspects.reduce((sum, aspect) => sum + aspect.total, 0);
  return (
    <>
      <div className="aspect-minitest-sheet-header">
        <strong>{data.headerLabel}</strong>
        <span>{data.nameLabel}<i /></span>
        <span>{data.groupLabel}<i /></span>
        <span>{data.dateLabel}<i /></span>
        <span className="aspect-minitest-sheet-total">Total&nbsp;: <b>___ / {total}</b></span>
      </div>
      <div className="aspect-minitest-title-band">{data.bannerTitle}</div>
    </>
  );
}

function Token({
  number,
  phraseId,
  status,
  draggable,
  onRemove
}: {
  number: number;
  phraseId: string;
  status?: AspectMinitestTokenStatus;
  draggable?: boolean;
  onRemove?: () => void;
}) {
  return (
    <button
      type="button"
      className={`aspect-minitest-token ${status ? `is-${status}` : ""}`}
      draggable={draggable}
      onDragStart={(event) => event.dataTransfer.setData("text/aspect-phrase", phraseId)}
      onClick={onRemove}
      aria-label={`Phrase ${number}${onRemove ? ", retirer du tableau" : ""}`}
    >
      {number}
    </button>
  );
}

function AspectCell({
  aspect,
  data,
  placements,
  tokenStatus,
  earned,
  interactiveCorrection,
  onAssign
}: {
  aspect: AspectMinitestAspect;
  data: AspectMinitestData;
  placements: Record<string, string>;
  tokenStatus: Record<string, AspectMinitestTokenStatus>;
  earned?: number;
  interactiveCorrection?: boolean;
  onAssign?: (phraseId: string, aspectId?: string) => void;
}) {
  const phrases = data.phrases
    .map((phrase, index) => ({ phrase, number: index + 1 }))
    .filter(({ phrase }) => phrase.text.trim() && placements[phrase.id] === aspect.id);

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const phraseId = event.dataTransfer.getData("text/aspect-phrase");
    if (phraseId) onAssign?.(phraseId, aspect.id);
  }

  return (
    <div
      className="aspect-minitest-aspect-cell"
      onDragOver={interactiveCorrection ? (event) => event.preventDefault() : undefined}
      onDrop={interactiveCorrection ? drop : undefined}
    >
      <div className="aspect-minitest-aspect-heading">
        <span className="aspect-minitest-aspect-icon"><AspectIcon aspectKey={aspect.key} /></span>
        <strong>{aspect.label}</strong>
        <span className="aspect-minitest-aspect-score">
          {earned === undefined ? "___" : earned} / {aspect.total}
        </span>
      </div>
      <div className="aspect-minitest-token-grid">
        {phrases.map(({ phrase, number }) => (
          <Token
            key={phrase.id}
            number={number}
            phraseId={phrase.id}
            status={tokenStatus[phrase.id]}
            draggable={interactiveCorrection}
            onRemove={interactiveCorrection ? () => onAssign?.(phrase.id, undefined) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function AspectMinitestSheet({
  data,
  variant,
  placements = {},
  tokenStatus = {},
  earnedByAspect = {},
  interactiveCorrection = false,
  onAssign,
  className = ""
}: Props) {
  const answerPlacements = variant === "answer"
    ? Object.fromEntries(data.phrases.filter((phrase) => phrase.aspectId).map((phrase) => [phrase.id, phrase.aspectId!]))
    : interactiveCorrection ? placements : {};
  const unassigned = data.phrases
    .map((phrase, index) => ({ phrase, number: index + 1 }))
    .filter(({ phrase }) => phrase.text.trim() && !answerPlacements[phrase.id]);

  return (
    <div className={`aspect-minitest-print-set ${className}`}>
      <section className="aspect-minitest-paper aspect-minitest-table-page">
        <MinitestHeader data={data} />
        <div className="aspect-minitest-instruction-row">
          <div className="aspect-minitest-instruction-block">
            <strong>{data.instructionTitle}</strong>
            <p>{data.instructions}</p>
          </div>
          <aside className="aspect-minitest-tip">
            <strong>{data.tipTitle}</strong>
            <p>{data.tipText}</p>
          </aside>
        </div>

        {interactiveCorrection && (
          <div
            className="aspect-minitest-correction-bank"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const phraseId = event.dataTransfer.getData("text/aspect-phrase");
              if (phraseId) onAssign?.(phraseId, undefined);
            }}
          >
            <span>Numéros à placer</span>
            <div>
              {unassigned.map(({ phrase, number }) => (
                <Token key={phrase.id} number={number} phraseId={phrase.id} draggable />
              ))}
            </div>
          </div>
        )}

        <div className="aspect-minitest-aspect-grid">
          {data.aspects.map((aspect) => (
            <AspectCell
              key={aspect.id}
              aspect={aspect}
              data={data}
              placements={answerPlacements}
              tokenStatus={tokenStatus}
              earned={earnedByAspect[aspect.id]}
              interactiveCorrection={interactiveCorrection}
              onAssign={onAssign}
            />
          ))}
        </div>
      </section>

      <section className="aspect-minitest-paper aspect-minitest-bank-page">
        <MinitestHeader data={data} />
        <h2>{data.bankTitle}</h2>
        <div className="aspect-minitest-phrase-list">
          {data.phrases.filter((phrase) => phrase.text.trim()).map((phrase, index) => (
            <p key={phrase.id}><strong>{index + 1})</strong><span>{phrase.text}</span></p>
          ))}
        </div>
      </section>
    </div>
  );
}
