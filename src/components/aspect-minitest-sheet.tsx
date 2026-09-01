"use client";

import type { DragEvent } from "react";
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
  editableBank?: boolean;
  onAssign?: (phraseId: string, aspectId?: string) => void;
  onPhraseChange?: (phraseId: string, text: string) => void;
  onInsertPhraseAfter?: (phraseId: string) => void;
  onSelectPhraseAspect?: (phraseId: string) => void;
  className?: string;
};

const aspectIllustrations: Record<AspectMinitestAspectKey, string> = {
  society: "/aspect-minitest/social.png",
  politics: "/aspect-minitest/politics.png",
  economy: "/aspect-minitest/economy.png",
  culture: "/aspect-minitest/culture.png",
  territory: "/aspect-minitest/territory.png",
  science: "/aspect-minitest/science.png"
};

export function AspectIllustration({ aspectKey }: { aspectKey: AspectMinitestAspectKey }) {
  return <img src={aspectIllustrations[aspectKey]} alt="" aria-hidden="true" />;
}

function MinitestHeader({ data, corrected }: { data: AspectMinitestData; corrected: boolean }) {
  const total = data.aspects.reduce((sum, aspect) => sum + aspect.total, 0);
  const useOriginalLabels = data.nameLabel === "NOM" && data.groupLabel === "GROUPE";
  return (
    <>
      <div className="aspect-minitest-sheet-header">
        <i className="aspect-minitest-header-rule" />
        {useOriginalLabels ? (
          <img className="aspect-minitest-header-labels" src="/aspect-minitest/header-labels.png" alt="NOM, GROUPE" />
        ) : (
          <>
            <strong className="aspect-minitest-name-label">{data.nameLabel}</strong>
            <strong className="aspect-minitest-group-label">{data.groupLabel}</strong>
          </>
        )}
        <span className={`aspect-minitest-corrected-label ${corrected ? "is-visible" : ""}`}>{data.headerLabel}</span>
        {data.dateLabel && <span className="aspect-minitest-date-line">{data.dateLabel}</span>}
        <span className="aspect-minitest-chapter-label">{data.chapterLabel ?? ""}</span>
        <span className="aspect-minitest-sheet-total">/{total}</span>
      </div>
      <MinitestTitle title={data.bannerTitle} />
    </>
  );
}

function MinitestTitle({ title }: { title: string }) {
  const separator = title.match(/\s[–—]\s/);
  if (!separator?.index) return <div className="aspect-minitest-title-band">{title}</div>;
  const topicStart = separator.index + separator[0].length;
  return (
    <div className="aspect-minitest-title-band">
      <span>{title.slice(0, topicStart)}<em>{title.slice(topicStart)}</em></span>
    </div>
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
        <strong>{aspect.label}</strong>
        <span className="aspect-minitest-aspect-score">
          {earned === undefined ? `/${aspect.total}` : `${earned} / ${aspect.total}`}
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
      <div className={`aspect-minitest-aspect-art is-${aspect.key}`}>
        <AspectIllustration aspectKey={aspect.key} />
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
  editableBank = false,
  onAssign,
  onPhraseChange,
  onInsertPhraseAfter,
  onSelectPhraseAspect,
  className = ""
}: Props) {
  const answerPlacements = variant === "answer"
    ? Object.fromEntries(data.phrases.filter((phrase) => phrase.aspectId).map((phrase) => [phrase.id, phrase.aspectId!]))
    : interactiveCorrection ? placements : {};
  const unassigned = data.phrases
    .map((phrase, index) => ({ phrase, number: index + 1 }))
    .filter(({ phrase }) => phrase.text.trim() && !answerPlacements[phrase.id]);
  const bankPhrases = (editableBank ? data.phrases : data.phrases.filter((phrase) => phrase.text.trim()))
    .map((phrase, index) => ({ phrase, number: index + 1 }));
  const bankColumnBreak = Math.ceil(bankPhrases.length / 2);

  return (
    <div className={`aspect-minitest-print-set ${className}`}>
      <section className="aspect-minitest-paper aspect-minitest-table-page">
        <MinitestHeader data={data} corrected={variant === "answer"} />
        <div className="aspect-minitest-instruction-row">
          <div className="aspect-minitest-instruction-block">
            <strong>{data.instructionTitle}</strong>
            <p>{data.instructions}</p>
          </div>
          <aside className="aspect-minitest-tip">
            <span className="aspect-minitest-tip-copy"><strong>{data.tipTitle}</strong> {data.tipText}</span>
          </aside>
        </div>

        {interactiveCorrection && unassigned.length > 0 && (
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

        <h2 className="aspect-minitest-section-title">{data.sectionTitle ?? "L’Europe chrétienne au Moyen Âge"}</h2>
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
        <span className="aspect-minitest-page-number">1</span>
      </section>

      <section className={`aspect-minitest-paper aspect-minitest-bank-page ${bankPhrases.length >= 17 ? "is-dense" : ""}`}>
        <h2>{data.bankTitle}</h2>
        <div className="aspect-minitest-phrase-list">
          {[bankPhrases.slice(0, bankColumnBreak), bankPhrases.slice(bankColumnBreak)].map((column, columnIndex) => (
            <div key={columnIndex}>
              {column.map(({ phrase, number }) => (
                <p key={phrase.id} className={editableBank ? "is-editable" : ""}>
                  <button
                    type="button"
                    className={`aspect-minitest-bank-number ${phrase.aspectId ? "is-assigned" : ""}`}
                    onDoubleClick={() => onSelectPhraseAspect?.(phrase.id)}
                    aria-label={`Attribuer un aspect à la phrase ${number}`}
                    title="Double-cliquer pour attribuer un aspect"
                  >
                    {number}
                  </button>
                  {editableBank ? (
                    <textarea
                      data-minitest-bank-phrase-id={phrase.id}
                      value={phrase.text}
                      onChange={(event) => onPhraseChange?.(phrase.id, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          onInsertPhraseAfter?.(phrase.id);
                        }
                      }}
                      rows={1}
                      placeholder="Écris la phrase..."
                      aria-label={`Phrase ${number}`}
                    />
                  ) : <span>{phrase.text}</span>}
                </p>
              ))}
            </div>
          ))}
        </div>
        <span className="aspect-minitest-page-number">2</span>
      </section>
    </div>
  );
}
