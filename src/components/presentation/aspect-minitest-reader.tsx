"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { AspectIcon, type AspectMinitestTokenStatus } from "@/components/aspect-minitest-sheet";
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
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    setPlacements({});
    setStatus({});
    setEarned({});
    setStage("placing");
    setAttempt(0);
    setSelectedPhraseId(undefined);
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
          : "Glisse chaque numéro dans le bon aspect de société.";

  return (
    <div className="aspect-minitest-reader">
      <header className="aspect-minitest-reader-heading">
        <div><span>{data.headerLabel}</span><h1>{data.bannerTitle}</h1><p>{data.instructions}</p></div>
        {hasValidated && <div className="aspect-minitest-reader-total"><span>Total</span><strong>{totalEarned} / {maxScore}</strong></div>}
      </header>

      <div className="aspect-minitest-reader-layout">
        <aside className="aspect-minitest-reader-bank">
          <div className="aspect-minitest-reader-bank-title"><div><span className="eyebrow">{data.bankTitle}</span><strong>Numéros à placer</strong></div><Button type="button" variant="secondary" onClick={restart} aria-label="Recommencer"><RotateCcw size={17} /></Button></div>
          <div
            className="aspect-minitest-reader-token-bank"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const phraseId = event.dataTransfer.getData("text/aspect-phrase");
              if (phraseId) assign(phraseId, undefined);
            }}
          >
            {unplaced.map((phrase) => {
              const number = phraseNumber(data, phrase.id);
              return <button key={phrase.id} type="button" className={`aspect-minitest-token ${selectedPhraseId === phrase.id ? "is-selected" : ""}`} draggable onDragStart={(event) => event.dataTransfer.setData("text/aspect-phrase", phrase.id)} onClick={() => setSelectedPhraseId((current) => current === phrase.id ? undefined : phrase.id)}>{number}</button>;
            })}
            {!unplaced.length && <span className="aspect-minitest-reader-bank-empty">Tous les numéros sont placés.</span>}
          </div>
          <div className="aspect-minitest-reader-phrases">
            {phrases.map((phrase) => <p key={phrase.id}><strong>{phraseNumber(data, phrase.id)})</strong><span>{phrase.text}</span></p>)}
          </div>
        </aside>

        <main className="aspect-minitest-reader-board">
          <div className="aspect-minitest-reader-tip"><strong>{data.tipTitle}</strong><span>{data.tipText}</span></div>
          <div className="aspect-minitest-reader-aspects">
            {data.aspects.map((aspect) => {
              const placed = phrases.filter((phrase) => placements[phrase.id] === aspect.id);
              return (
                <div
                  key={aspect.id}
                  className={`aspect-minitest-reader-aspect ${selectedPhraseId ? "is-drop-ready" : ""}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropOnAspect(event, aspect.id)}
                  onClick={() => { if (selectedPhraseId) assign(selectedPhraseId, aspect.id); }}
                >
                  <div className="aspect-minitest-reader-aspect-heading">
                    <AspectIcon aspectKey={aspect.key} />
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
                          onDragStart={(event) => event.dataTransfer.setData("text/aspect-phrase", phrase.id)}
                          onClick={(event) => { event.stopPropagation(); assign(phrase.id, undefined); }}
                        >
                          {phraseNumber(data, phrase.id)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <footer className="aspect-minitest-reader-actions">
        <p>{feedback}</p>
        <Button
          type="button"
          disabled={(stage === "placing" && !allPlaced) || stage === "complete"}
          onClick={stage === "first-result" ? retry : stage === "second-result" ? reveal : validate}
        >
          {stage === "complete" && <CheckCircle2 size={18} />}{actionLabel}
        </Button>
      </footer>
    </div>
  );
}
