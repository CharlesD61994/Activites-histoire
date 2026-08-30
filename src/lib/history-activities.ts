import type { HistoryInteractiveAction, HistoryOperation, HistorySocietyAspect, Sentence } from "@/types";
import { historyQuestionMaxPoints } from "./history-scoring";

export const historyOperationLabels: Record<HistoryOperation, string> = {
  establish_facts: "Établir des faits",
  causality_links: "Établir des liens de causalité",
  situate_time: "Situer dans le temps",
  situate_space: "Situer dans l’espace",
  relate_facts: "Mettre en relation des faits",
  causes_consequences: "Déterminer des causes et des conséquences",
  differences_similarities: "Dégager des différences et des similitudes",
  changes_continuities: "Déterminer des changements et des continuités"
};

export const historyActionLabels: Record<HistoryInteractiveAction, string> = {
  choice_single: "Choix unique",
  choice_multiple: "Choix multiples",
  true_false: "Vrai ou faux",
  image_selection: "Sélection d’image",
  classification: "Classement",
  sort_categories: "Trier par catégories",
  matching: "Association",
  table_fill: "Tableau à compléter",
  chronological_order: "Ordre chronologique",
  arrange_order: "Cartes à ordonner",
  timeline: "Repères sur une ligne du temps",
  document_hotspot: "Zone cliquable sur document",
  reference_point: "Repère à compléter",
  cloze_choice: "Texte à compléter",
  short_text: "Réponse courte"
};

export const historyActionDescriptions: Record<HistoryInteractiveAction, string> = {
  choice_single: "Une bonne réponse parmi quelques propositions.",
  choice_multiple: "Plusieurs faits ou éléments à sélectionner.",
  true_false: "Une affirmation à juger vraie ou fausse.",
  image_selection: "Une ou plusieurs images à choisir parmi des cartes visuelles.",
  classification: "Des cartes à ranger dans les bonnes catégories.",
  sort_categories: "Des affirmations à trier dans les bonnes zones.",
  matching: "Des éléments à associer deux par deux.",
  table_fill: "Des cases de tableau à compléter avec la bonne réponse.",
  chronological_order: "Des événements à remettre dans le bon ordre.",
  arrange_order: "Des cartes à placer dans un ordre logique.",
  timeline: "Des repères datés à placer ou ordonner.",
  document_hotspot: "Une image ou une carte à observer, puis une zone à cliquer.",
  reference_point: "Une réponse à placer avant, après ou autour d’un repère.",
  cloze_choice: "Un court énoncé à compléter avec des choix fermés.",
  short_text: "Un mot ou une courte phrase à écrire, validé avec une liste de réponses acceptées."
};

export const historySocietyAspectLabels: Record<HistorySocietyAspect, string> = {
  politics: "Politique",
  economy: "Économie",
  territory: "Territoire",
  culture: "Culture",
  society: "Société",
  power: "Pouvoir",
  techniques: "Techniques",
  population: "Population",
  relations: "Relations"
};

export const historyActionsByOperation: Record<HistoryOperation, HistoryInteractiveAction[]> = {
  establish_facts: ["choice_single", "true_false", "short_text", "choice_multiple", "image_selection", "document_hotspot", "cloze_choice", "table_fill"],
  causality_links: ["matching", "sort_categories", "arrange_order", "chronological_order", "cloze_choice", "choice_single", "true_false", "short_text"],
  situate_time: ["chronological_order", "timeline", "reference_point", "arrange_order", "table_fill", "choice_single", "true_false", "short_text"],
  situate_space: ["document_hotspot", "image_selection", "matching", "table_fill", "choice_single", "true_false", "short_text"],
  relate_facts: ["matching", "classification", "sort_categories", "table_fill", "image_selection", "choice_single", "true_false", "short_text"],
  causes_consequences: ["classification", "sort_categories", "matching", "arrange_order", "choice_single", "true_false"],
  differences_similarities: ["classification", "sort_categories", "matching", "choice_multiple", "image_selection", "table_fill"],
  changes_continuities: ["classification", "sort_categories", "chronological_order", "arrange_order", "choice_multiple", "true_false"]
};

export const allHistoryOperations = Object.keys(historyOperationLabels) as HistoryOperation[];
export const allHistorySocietyAspects = Object.keys(historySocietyAspectLabels) as HistorySocietyAspect[];

export function getInitialHistoryAction(operation: HistoryOperation, savedAction?: HistoryInteractiveAction): HistoryInteractiveAction {
  const allowedActions = historyActionsByOperation[operation];
  return savedAction && allowedActions.includes(savedAction) ? savedAction : allowedActions[0];
}

export function getHistoryActivityPointTotal(sentence: Sentence): number {
  return sentence.historyActivity?.questions.reduce((sum, question) => sum + historyQuestionMaxPoints(question), 0) ?? 0;
}

export function getHistoryActivitySummary(sentence: Sentence) {
  const activity = sentence.historyActivity;
  if (!activity) return null;
  const firstQuestion = activity.questions[0];
  return {
    operation: historyOperationLabels[activity.operation],
    action: firstQuestion ? historyActionLabels[firstQuestion.action] : "Action à choisir",
    documentCount: activity.documents.length,
    questionCount: activity.questions.length,
    points: getHistoryActivityPointTotal(sentence)
  };
}
