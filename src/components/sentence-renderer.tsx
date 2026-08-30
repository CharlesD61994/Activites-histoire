import { wordClassLabels } from "@/lib/activity-types";
import { getHistoryActivitySummary, historyOperationLabels, historyOperationStyle } from "@/lib/history-activities";
import type { Sentence } from "@/types";

type Props = {
  sentence: Sentence;
  highlightErrors?: boolean;
  showCorrected?: boolean;
};

export function SentenceRenderer({ sentence, highlightErrors = true, showCorrected = false }: Props) {
  if (sentence.activityType === "history") {
    const summary = getHistoryActivitySummary(sentence);
    return (
      <div className="sentence-preview worksheet-bank-preview history-bank-preview">
        <strong>Séquence d’histoire</strong>
        <span>
          {(summary?.questionCount ?? 0)} question{(summary?.questionCount ?? 0) > 1 ? "s" : ""} · {(summary?.points ?? 0)} point{(summary?.points ?? 0) > 1 ? "s" : ""} · {(summary?.documentCount ?? 0)} document{(summary?.documentCount ?? 0) > 1 ? "s" : ""}
        </span>
        <span className="history-operation-pill-row">
          {(summary?.operations ?? []).slice(0, 3).map((operation) => (
            <small className="history-operation-pill" style={historyOperationStyle(operation)} key={operation}>
              {historyOperationLabels[operation]}
            </small>
          ))}
          {(summary?.operations.length ?? 0) > 3 && <small className="history-operation-pill more">+{(summary?.operations.length ?? 0) - 3}</small>}
        </span>
      </div>
    );
  }

  if (sentence.activityType === "worksheet") {
    const pageCount = sentence.treeAnalysisDocumentPages?.length ?? 1;
    const interactiveCount = (sentence.worksheetAnswerLines?.length ?? 0) + (sentence.treeAnalysisTables?.filter((table) => table.cells.some((cell) => cell.isCorrect || Boolean(cell.answer?.trim()))).length ?? 0);
    return <div className="sentence-preview worksheet-bank-preview"><strong>{pageCount} page{pageCount > 1 ? "s" : ""} en portrait</strong><span>{interactiveCount} élément{interactiveCount > 1 ? "s" : ""} interactif{interactiveCount > 1 ? "s" : ""}</span></div>;
  }

  if (sentence.activityType === "word_classes") {
    const targets = [...(sentence.wordClassTargets ?? [])].sort(
      (a, b) => a.start - b.start
    );
    const pieces: React.ReactNode[] = [];
    let cursor = 0;

    targets.forEach((target) => {
      if (target.start > cursor) {
        pieces.push(
          <span key={`text-${cursor}`}>
            {sentence.originalText.slice(cursor, target.start)}
          </span>
        );
      }

      pieces.push(
        <span
          className="word-class-bank-highlight"
          title={wordClassLabels[target.wordClass]}
          key={target.id}
        >
          {target.text}
        </span>
      );
      cursor = target.end;
    });

    if (cursor < sentence.originalText.length) {
      pieces.push(
        <span key={`tail-${cursor}`}>
          {sentence.originalText.slice(cursor)}
        </span>
      );
    }

    return (
      <p className="sentence-preview sentence-preview-preserve-lines">
        {pieces}
      </p>
    );
  }

  const corrections = [...sentence.corrections].sort((a, b) => a.start - b.start);
  const pieces: React.ReactNode[] = [];
  let cursor = 0;

  corrections.forEach((correction) => {
    if (correction.start > cursor) {
      pieces.push(<span key={`text-${cursor}`}>{sentence.originalText.slice(cursor, correction.start)}</span>);
    }
    pieces.push(
      <span
        key={correction.id}
        className={highlightErrors ? "error-highlight" : ""}
        title={correction.explanation}
      >
        {showCorrected ? correction.correctedText : correction.originalText}
      </span>
    );
    cursor = correction.end;
  });

  if (cursor < sentence.originalText.length) {
    pieces.push(<span key={`text-${cursor}`}>{sentence.originalText.slice(cursor)}</span>);
  }

  return <p className="sentence-preview sentence-preview-preserve-lines">{pieces}</p>;
}
