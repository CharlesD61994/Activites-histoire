import type { HistoryInteractiveAction, HistoryOperation, HistorySocietyAspect, Sentence } from "@/types";

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
  classification: "Classement",
  matching: "Association",
  chronological_order: "Ordre chronologique",
  timeline: "Repères sur une ligne du temps",
  document_hotspot: "Zone cliquable sur document",
  cloze_choice: "Texte à compléter",
  short_text: "Réponse courte"
};

export const historyActionDescriptions: Record<HistoryInteractiveAction, string> = {
  choice_single: "Une bonne réponse parmi quelques propositions.",
  choice_multiple: "Plusieurs faits ou éléments à sélectionner.",
  classification: "Des cartes à ranger dans les bonnes catégories.",
  matching: "Des éléments à associer deux par deux.",
  chronological_order: "Des événements à remettre dans le bon ordre.",
  timeline: "Des repères datés à placer ou ordonner.",
  document_hotspot: "Une image ou une carte à observer, puis une zone à cliquer.",
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
  establish_facts: ["choice_single", "short_text", "choice_multiple", "document_hotspot", "cloze_choice"],
  causality_links: ["matching", "chronological_order", "cloze_choice", "choice_single", "short_text"],
  situate_time: ["chronological_order", "timeline", "choice_single", "short_text"],
  situate_space: ["document_hotspot", "matching", "choice_single", "short_text"],
  relate_facts: ["matching", "classification", "choice_single", "short_text"],
  causes_consequences: ["classification", "matching", "choice_single"],
  differences_similarities: ["classification", "matching", "choice_multiple"],
  changes_continuities: ["classification", "chronological_order", "choice_multiple"]
};

export const allHistoryOperations = Object.keys(historyOperationLabels) as HistoryOperation[];
export const allHistorySocietyAspects = Object.keys(historySocietyAspectLabels) as HistorySocietyAspect[];

export function getInitialHistoryAction(operation: HistoryOperation, savedAction?: HistoryInteractiveAction): HistoryInteractiveAction {
  const allowedActions = historyActionsByOperation[operation];
  return savedAction && allowedActions.includes(savedAction) ? savedAction : allowedActions[0];
}

export function getHistoryActivityPointTotal(sentence: Sentence): number {
  return sentence.historyActivity?.questions.reduce((sum, question) => sum + question.points, 0) ?? 0;
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
