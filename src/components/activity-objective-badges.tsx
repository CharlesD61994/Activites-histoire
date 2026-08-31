import {
  getSecondaryObjectives,
  getSentenceObjective,
  grammarObjectiveLabels,
  grammarPhaseLabels
} from "@/lib/grammar-workflow";
import { historyOperationLabels, historyOperationStyle } from "@/lib/history-activities";
import type { Sentence } from "@/types";

type Props = {
  sentence: Sentence;
  secondaryOnly?: boolean;
  primaryOnly?: boolean;
};

export function getActivityObjectiveKey(sentence: Sentence) {
  return sentence.activityType === "tree_analysis"
    ? "tree_analysis" as const
    : sentence.activityType === "history"
      ? "history" as const
    : sentence.activityType === "worksheet"
      ? "worksheet" as const
    : sentence.activityType === "aspect_minitest"
      ? "aspect_minitest" as const
    : getSentenceObjective(sentence);
}

export function ActivityObjectiveBadges({
  sentence,
  secondaryOnly = false,
  primaryOnly = false
}: Props) {
  const secondaryObjectives =
    sentence.activityType === "tree_analysis" || sentence.activityType === "worksheet" || sentence.activityType === "history" || sentence.activityType === "aspect_minitest"
      ? []
      : getSecondaryObjectives(sentence);
  const primaryKey = getActivityObjectiveKey(sentence);
  const primaryLabel =
    primaryKey === "tree_analysis"
      ? "Analyse en arbre"
      : primaryKey === "history"
        ? sentence.historyActivity?.operation
          ? historyOperationLabels[sentence.historyActivity.operation]
          : "Activité d’histoire"
      : primaryKey === "worksheet"
        ? "Feuille d’activité"
      : primaryKey === "aspect_minitest"
        ? "Minitest sur les aspects"
      : grammarObjectiveLabels[primaryKey];

  return (
    <span className="activity-objective-badges">
      {!secondaryOnly && (
        <span
          className={`activity-type-badge objective-${primaryKey}`}
          style={sentence.activityType === "history" ? historyOperationStyle(sentence.historyActivity?.operation) : undefined}
        >
          {primaryLabel}
        </span>
      )}
      {!primaryOnly && secondaryObjectives.length > 0 && (
        <span className="activity-secondary-badges">
          {secondaryObjectives.map((objective) => (
            <span key={objective}>{grammarPhaseLabels[objective]}</span>
          ))}
        </span>
      )}
    </span>
  );
}
