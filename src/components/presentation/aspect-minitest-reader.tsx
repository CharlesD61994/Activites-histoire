"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { CheckCircle2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { AspectIllustration, type AspectMinitestTokenStatus } from "@/components/aspect-minitest-sheet";
import { ReaderChromePortal } from "@/components/presentation/reader-chrome";
import { Button } from "@/components/ui/button";
import type { AspectMinitestData, AspectMinitestPhrase, Sentence } from "@/types";

type Props = {
  sentence: Sentence;
  onPoint: (pointId: string, points: number) => void;
  onCompleteChange?: (complete: boolean) => void;
};

type ReaderStage = "placing" | "first-result" | "second-result" | "complete";

function phraseNumber(data: AspectMinitestData, phraseId: string) {
  return data.phrases.filter((phrase) => phrase.text.trim()).findIndex((phrase) => phrase.id === phraseId) + 1;
}

export function AspectMinitestReader({ sentence, onPoint, onCompleteChange }: Props) {
  const data = sentence.aspectMinitest;
  const phrases = useMemo(() => data?.phrases.filter((phrase) => phrase.text.trim()) ?? [], [data]);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, AspectMinitestTokenStatus>>({});
  const [earned, setEarned] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<ReaderStage>("placing");
  const [attempt, setAttempt] = useState<0 | 1>(0);
  const [selectedPhraseId, setSelectedPhraseId] = useState<string>();
  const [draggedPhraseId, setDraggedPhraseId] = useState<string>();
  const [boardZoom, setBoardZoom] = useState(100);
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    setPlacements({});
    setStatus({});
    setEarned({});
    setStage("placing");
    setAttempt(0);
    setSelectedPhraseId(undefined);
    setDraggedPhraseId(undefined);
    setBoardZoom(100);
    setHasValidated(false);
  }, [sentence.id]);

  useEffect(() => {
    onCompleteChange?.(stage === "complete");
  }, [onCompleteChange, stage]);

  if (!data) return <p>Ce minitest ne contient pas encore de contenu.</p>;

  const allPlaced = phrases.length > 0 && phrases.every((phrase) => placements[phrase.id]);
  const totalEarned = Object.values(earned).reduce((sum, points) => sum + points, 0);
  const maxScore = data.aspects.reduce((sum, aspect) => sum + aspect.total, 0);
  const unplaced = phrases.filter((phrase) => !placements[phrase.id]);
  const earnedByAspect = Object.fromEntries(data.aspects.map((aspect) => [
    aspect.id,
    phrases
      .filter((phrase) => phrase.aspectId === aspect.id)
      .reduce((sum, phrase) => sum + (earned[phrase.id] ?? 0), 0)
  ]));

  function locked(phraseId: string) {
    return status[phraseId] === "correct" || status[phraseId] === "revealed";
  }

  function assign(phraseId: string, aspectId?: string) {
    if (locked(phraseId) || stage !== "placing") return;
    setPlacements((current) => {
      const next = { ...current };
      if (aspectId) next[phraseId] = aspectId;
      else delete next[phraseId];
      return next;
    });
    setSelectedPhraseId(undefined);
  }

  function validate() {
    if (!allPlaced || stage !== "placing") return;
    const nextStatus = { ...status };
    const nextEarned = { ...earned };
    const wrong: AspectMinitestPhrase[] = [];
    const value = attempt === 0 ? 1 : 0.5;

    phrases.forEach((phrase) => {
      if (locked(phrase.id)) return;
      if (phrase.aspectId && placements[phrase.id] === phrase.aspectId) {
        nextStatus[phrase.id] = "correct";
        nextEarned[phrase.id] = value;
        onPoint(`aspect-minitest:${phrase.id}:${attempt}`, value);
      } else {
        nextStatus[phrase.id] = "wrong";
        wrong.push(phrase);
      }
    });

    setStatus(nextStatus);
    setEarned(nextEarned);
    setHasValidated(true);
    if (!wrong.length) setStage("complete");
    else setStage(attempt === 0 ? "first-result" : "second-result");
  }

  function retry() {
    const wrongIds = new Set(Object.entries(status).filter(([, value]) => value === "wrong").map(([id]) => id));
    setPlacements((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !wrongIds.has(id))));
    setStatus((current) => Object.fromEntries(Object.entries(current).filter(([, value]) => value !== "wrong")));
    setAttempt(1);
    setStage("placing");
  }

  function reveal() {
    const wrongIds = Object.entries(status).filter(([, value]) => value === "wrong").map(([id]) => id);
    setPlacements((current) => {
      const next = { ...current };
      wrongIds.forEach((id) => {
        const phrase = phrases.find((item) => item.id === id);
        if (phrase?.aspectId) next[id] = phrase.aspectId;
      });
      return next;
    });
    setStatus((current) => ({
      ...current,
      ...Object.fromEntries(wrongIds.map((id) => [id, "revealed" as const]))
    }));
    setStage("complete");
  }

  function restart() {
    setPlacements({});
    setStatus({});
    setEarned({});
    setStage("placing");
    setAttempt(0);
    setSelectedPhraseId(undefined);
    setHasValidated(false);
    onCompleteChange?.(false);
  }

  function dropOnAspect(event: DragEvent<HTMLDivElement>, aspectId: string) {
    event.preventDefault();
    const phraseId = event.dataTransfer.getData("text/aspect-phrase");
    if (phraseId) assign(phraseId, aspectId);
    setDraggedPhraseId(undefined);
  }

  function startPhraseDrag(event: DragEvent<HTMLElement>, phraseId: string) {
    if (stage !== "placing" || locked(phraseId)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/aspect-phrase", phraseId);
    const source = event.currentTarget;
    const dragToken = source.matches(".aspect-minitest-token")
      ? source
      : source.querySelector<HTMLElement>(".aspect-minitest-bank-number");
    if (dragToken) event.dataTransfer.setDragImage(dragToken, 20, 20);
    setDraggedPhraseId(phraseId);
  }

  function keepDragAreaScrolling(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const area = event.currentTarget;
    const bounds = area.getBoundingClientRect();
    const edge = 52;
    const step = 18;
    if (event.clientY < bounds.top + edge) area.scrollBy({ top: -step });
    else if (event.clientY > bounds.bottom - edge) area.scrollBy({ top: step });
    if (event.clientX < bounds.left + edge) area.scrollBy({ left: -step });
    else if (event.clientX > bounds.right - edge) area.scrollBy({ left: step });
  }

  const actionLabel = stage === "first-result" ? "Réessayer" : stage === "second-result" ? "Corriger" : stage === "complete" ? "Terminé" : "Valider";
  const feedback = stage === "first-result"
    ? "Les bonnes réponses restent en place. Les réponses rouges retourneront dans la banque au prochain essai."
    : stage === "second-result"
      ? "Il reste des réponses à corriger. Affiche maintenant le corrigé."
      : stage === "complete"
        ? "Minitest terminé."
        : attempt === 1
          ? "Replace les numéros revenus dans la banque. Une nouvelle bonne réponse vaut 0,5 point."
          : "Glisse chaque phrase dans le bon aspect de société.";

  return (
    <>
      <ReaderChromePortal slot="viewTools">
        <div className="aspect-minitest-reader-zoom is-header" aria-label="Zoom du tableau">
          <button type="button" onClick={() => setBoardZoom((value) => Math.max(80, value - 10))} disabled={boardZoom === 80} aria-label="Réduire le tableau" title="Réduire le tableau"><ZoomOut size={18} /></button>
          <button type="button" onClick={() => setBoardZoom(100)} aria-label="Rétablir le zoom à 100 %" title="Rétablir le zoom">{boardZoom}%</button>
          <button type="button" onClick={() => setBoardZoom((value) => Math.min(130, value + 10))} disabled={boardZoom === 130} aria-label="Agrandir le tableau" title="Agrandir le tableau"><ZoomIn size={18} /></button>
        </div>
      </ReaderChromePortal>

      <div className="aspect-minitest-reader">
        <div className="aspect-minitest-reader-layout">
          <aside
            className={`aspect-minitest-reader-bank ${draggedPhraseId ? "is-dragging" : ""}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const phraseId = event.dataTransfer.getData("text/aspect-phrase");
              if (phraseId) assign(phraseId, undefined);
              setDraggedPhraseId(undefined);
            }}
          >
            <div className="aspect-minitest-reader-bank-title">
              <div>
                <span className="eyebrow">{data.bankTitle}</span>
                <strong>{unplaced.length} phrase{unplaced.length > 1 ? "s" : ""} à placer</strong>
              </div>
              <Button type="button" variant="secondary" onClick={restart} aria-label="Recommencer" title="Recommencer"><RotateCcw size={17} /></Button>
            </div>
            <div className="aspect-minitest-reader-phrases" role="list" onDragOver={keepDragAreaScrolling}>
              {unplaced.map((phrase) => {
                const number = phraseNumber(data, phrase.id);
                return (
                  <button
                    key={phrase.id}
                    type="button"
                    role="listitem"
                    className={`aspect-minitest-reader-phrase ${selectedPhraseId === phrase.id ? "is-selected" : ""} ${draggedPhraseId === phrase.id ? "is-dragging" : ""}`}
                    draggable={stage === "placing"}
                    onDragStart={(event) => startPhraseDrag(event, phrase.id)}
                    onDragEnd={() => setDraggedPhraseId(undefined)}
                    onClick={() => setSelectedPhraseId((current) => current === phrase.id ? undefined : phrase.id)}
                  >
                    <strong className="aspect-minitest-bank-number">{number}</strong>
                    <span>{phrase.text}</span>
                  </button>
                );
              })}
              {!unplaced.length && <span className="aspect-minitest-reader-bank-empty">Toutes les phrases sont placées.</span>}
            </div>
          </aside>

          <main className="aspect-minitest-reader-board">
            <div className="aspect-minitest-reader-board-viewport" onDragOver={keepDragAreaScrolling}>
              <div
                className="aspect-minitest-reader-board-stage"
                style={{
                  width: `${boardZoom}%`,
                  minWidth: `${6.78 * boardZoom}px`
                }}
              >
                <div
                  className="aspect-minitest-reader-aspects"
                  style={{
                    width: `${10000 / boardZoom}%`,
                    height: `${10000 / boardZoom}%`,
                    transform: `scale(${boardZoom / 100})`
                  }}
                >
                  {data.aspects.map((aspect) => {
                    const placed = phrases.filter((phrase) => placements[phrase.id] === aspect.id);
                    return (
                      <div
                        key={aspect.id}
                        className={`aspect-minitest-reader-aspect ${selectedPhraseId || draggedPhraseId ? "is-drop-ready" : ""}`}
                        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                        onDrop={(event) => dropOnAspect(event, aspect.id)}
                        onClick={() => { if (selectedPhraseId) assign(selectedPhraseId, aspect.id); }}
                      >
                        <div className="aspect-minitest-reader-aspect-heading">
                          <strong>{aspect.label}</strong>
                          <span>{hasValidated ? earnedByAspect[aspect.id] : "___"} / {aspect.total}</span>
                        </div>
                        <div className="aspect-minitest-reader-aspect-tokens">
                          {placed.map((phrase) => {
                            const tokenState = status[phrase.id];
                            return (
                              <button
                                key={phrase.id}
                                type="button"
                                className={`aspect-minitest-token ${tokenState ? `is-${tokenState}` : ""}`}
                                draggable={!locked(phrase.id) && stage === "placing"}
                                onDragStart={(event) => startPhraseDrag(event, phrase.id)}
                                onDragEnd={() => setDraggedPhraseId(undefined)}
                                onClick={(event) => { event.stopPropagation(); assign(phrase.id, undefined); }}
                              >
                                {phraseNumber(data, phrase.id)}
                              </button>
                            );
                          })}
                        </div>
                        <div className={`aspect-minitest-reader-aspect-art is-${aspect.key}`}><AspectIllustration aspectKey={aspect.key} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>

        <footer className="aspect-minitest-reader-actions">
          <p>{feedback}</p>
          {hasValidated && <strong className="aspect-minitest-reader-score">{totalEarned} / {maxScore}</strong>}
          <Button
            type="button"
            disabled={(stage === "placing" && !allPlaced) || stage === "complete"}
            onClick={stage === "first-result" ? retry : stage === "second-result" ? reveal : validate}
          >
            {stage === "complete" && <CheckCircle2 size={18} />}{actionLabel}
          </Button>
        </footer>
      </div>
    </>
  );
}
