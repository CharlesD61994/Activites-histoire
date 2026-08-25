import type { AppData, CorrectionCode, Sentence } from "@/types";

export const correctionCodes: CorrectionCode[] = [
  { id: "code-fait", code: "FAIT", name: "Fait historique", category: "other", color: "#2563eb", isActive: true },
  { id: "code-date", code: "DATE", name: "Repère chronologique", category: "other", color: "#7c3aed", isActive: true },
  { id: "code-lieu", code: "LIEU", name: "Repère spatial", category: "other", color: "#0891b2", isActive: true },
  { id: "code-cause", code: "CAUSE", name: "Cause ou conséquence", category: "other", color: "#dc2626", isActive: true },
  { id: "code-source", code: "SRC", name: "Information tirée d’une source", category: "other", color: "#059669", isActive: true },
  { id: "code-concept", code: "CONC", name: "Concept historique", category: "other", color: "#ea580c", isActive: true }
];

const now = "2026-08-04T12:00:00.000Z";

const demoSentences: Sentence[] = [
  {
    id: "activite-1",
    activityType: "sentence_correction",
    levelId: "sec-2",
    title: "Établir un fait : bataille des plaines d’Abraham",
    originalText: "La bataille des plaines d'Abraham a lieu en 1760 près de Québec.",
    difficulty: "medium",
    tags: ["établir des faits", "Nouvelle-France", "chronologie"],
    corrections: [
      {
        id: "corr-fait-1",
        start: 44,
        end: 48,
        originalText: "1760",
        correctedText: "1759",
        correctionCodeId: "code-date",
        points: 1,
        revealOrder: 1
      }
    ],
    assignedGroupIds: ["groupe-201"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-2",
    activityType: "sentence_correction",
    levelId: "sec-1",
    title: "Repérer une date dans un énoncé",
    originalText: "L'Acte constitutionnel de 1774 divise la province de Québec en Haut-Canada et Bas-Canada.",
    difficulty: "easy",
    tags: ["établir des faits", "chronologie", "régime britannique"],
    corrections: [
      {
        id: "corr-fait-2",
        start: 26,
        end: 30,
        originalText: "1774",
        correctedText: "1791",
        correctionCodeId: "code-date",
        points: 1,
        revealOrder: 1
      }
    ],
    assignedGroupIds: ["groupe-101", "groupe-102"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-3",
    activityType: "sentence_correction",
    levelId: "sec-4",
    title: "Identifier un changement économique",
    originalText: "Le commerce du bois devient important au début du 18e siècle au Bas-Canada.",
    difficulty: "hard",
    tags: ["changements et continuités", "économie", "Bas-Canada"],
    corrections: [
      {
        id: "corr-fait-3",
        start: 50,
        end: 60,
        originalText: "18e siècle",
        correctedText: "19e siècle",
        correctionCodeId: "code-date",
        points: 1,
        revealOrder: 1
      }
    ],
    assignedGroupIds: ["groupe-401"],
    showCorrectionCount: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-4",
    activityType: "sentence_correction",
    levelId: "sec-1",
    title: "Associer un événement à son contexte",
    originalText: "La Grande Paix de Montréal est signée en 1700 entre la France et plusieurs nations autochtones.",
    difficulty: "easy",
    tags: ["établir des faits", "relations", "Autochtones"],
    corrections: [
      {
        id: "corr-fait-4",
        start: 41,
        end: 45,
        originalText: "1700",
        correctedText: "1701",
        correctionCodeId: "code-date",
        points: 1,
        revealOrder: 1
      }
    ],
    assignedGroupIds: ["groupe-101"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-5",
    activityType: "text_correction",
    levelId: "sec-2",
    title: "Distinguer cause et conséquence",
    originalText: "La croissance du commerce du bois transforme les emplois, les transports et l’occupation du territoire.",
    difficulty: "medium",
    tags: ["causes et conséquences", "économie", "territoire"],
    corrections: [],
    assignedGroupIds: ["groupe-201"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-6",
    activityType: "text_correction",
    levelId: "sec-4",
    title: "Comparer deux sociétés",
    originalText: "Compare deux aspects de société : le pouvoir politique et l’économie dans la colonie avant et après 1760.",
    difficulty: "medium",
    tags: ["différences et similitudes", "politique", "économie"],
    corrections: [],
    assignedGroupIds: ["groupe-401"],
    showCorrectionCount: false,
    createdAt: now,
    updatedAt: now
  }
];

export const demoData: AppData = {
  dataVersion: 21,
  schoolYears: [
    { id: "year-2026-2027", name: "Année scolaire 2026-2027", order: 1 }
  ],
  levels: [
    { id: "sec-1", name: "Secondaire 1", order: 1 },
    { id: "sec-2", name: "Secondaire 2", order: 2 },
    { id: "sec-4", name: "Secondaire 4", order: 4 }
  ],
  groups: [
    { id: "groupe-101", levelId: "sec-1", schoolYearId: "year-2026-2027", name: "Groupe 101", description: "Premier cycle", accentColor: "#2878df", shieldLabel: "101", totalPoints: 145, sentenceCount: 12, studentPortalEnabled: true, studentAccessCode: "1010" },
    { id: "groupe-102", levelId: "sec-1", schoolYearId: "year-2026-2027", name: "Groupe 102", description: "Premier cycle", accentColor: "#0f9f91", shieldLabel: "102", totalPoints: 132, sentenceCount: 10, studentPortalEnabled: true },
    { id: "groupe-201", levelId: "sec-2", schoolYearId: "year-2026-2027", name: "Groupe 201", description: "Consolidation", accentColor: "#7757cf", shieldLabel: "201", totalPoints: 98, sentenceCount: 8, studentPortalEnabled: true, studentAccessCode: "2010" },
    { id: "groupe-401", levelId: "sec-4", schoolYearId: "year-2026-2027", name: "Groupe 401", description: "Deuxième cycle", accentColor: "#e6921b", shieldLabel: "401", totalPoints: 176, sentenceCount: 15, studentPortalEnabled: true }
  ],
  teams: [
    { id: "team-101-a", groupId: "groupe-101", name: "Équipe A", icon: "A", points: 48, members: ["Alex", "Maya", "Émile"] },
    { id: "team-101-b", groupId: "groupe-101", name: "Équipe B", icon: "B", points: 52, members: ["Léa", "Thomas"] },
    { id: "team-101-c", groupId: "groupe-101", name: "Équipe C", icon: "C", points: 45, members: [] },
    { id: "team-201-a", groupId: "groupe-201", name: "Équipe A", icon: "A", points: 49, members: [] },
    { id: "team-201-b", groupId: "groupe-201", name: "Équipe B", icon: "B", points: 49, members: [] }
  ],
  correctionCodes,
  sentences: demoSentences,
  collections: [
    {
      id: "collection-sec1-faits",
      levelId: "sec-1",
      name: "Établir des faits historiques",
      description: "Courte collection de démarrage pour valider des dates et des événements.",
      sentenceIds: ["activite-2", "activite-4"],
      assignedGroupIds: ["groupe-101"],
      scheduledDate: "2026-08-10",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "collection-sec2-nouvelle-france",
      levelId: "sec-2",
      name: "Nouvelle-France et régime britannique",
      description: "Faits, repères chronologiques et premiers liens de causalité.",
      sentenceIds: ["activite-1", "activite-5"],
      assignedGroupIds: ["groupe-201"],
      scheduledDate: "2026-08-12",
      createdAt: now,
      updatedAt: now
    }
  ],
  plannedSessions: [
    {
      id: "session-plan-101",
      groupId: "groupe-101",
      title: "Repères du lundi",
      scheduledDate: "2026-08-10",
      sentenceIds: ["activite-2", "activite-4"],
      status: "planned",
      currentSentenceIndex: 0,
      createdAt: now,
      updatedAt: now
    }
  ],
  reviewStates: [
    {
      id: "review-201-activite-1",
      groupId: "groupe-201",
      sentenceId: "activite-1",
      markedForReview: true,
      difficultyScore: 3,
      nextReviewAt: "2026-08-12"
    }
  ],
  scoreEvents: [],
  competitionResults: [],
  dashboardTitle: "Année scolaire 2026-2027",
  dashboardSectionLabel: "Mes groupes"
};
