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
    activityType: "history",
    levelId: "sec-2",
    title: "Établir un fait : bataille des plaines d’Abraham",
    originalText: "Quel énoncé établit correctement un fait historique?",
    difficulty: "medium",
    tags: ["établir des faits", "Nouvelle-France", "chronologie"],
    corrections: [],
    historyActivity: {
      operation: "establish_facts",
      aspects: ["politics", "territory"],
      documents: [{ id: "doc-plaines", title: "Repère historique", kind: "text", text: "La bataille des plaines d’Abraham se déroule près de Québec en 1759.", source: "Donnée de démonstration" }],
      questions: [{ id: "q-plaines", prompt: "Quel énoncé établit correctement le fait?", action: "choice_single", documentIds: ["doc-plaines"], points: 1, choices: [{ id: "a", text: "La bataille a lieu près de Québec en 1759.", isCorrect: true }, { id: "b", text: "La bataille a lieu à Montréal en 1760.", isCorrect: false }, { id: "c", text: "La bataille a lieu avant l’arrivée des Européens.", isCorrect: false }] }]
    },
    assignedGroupIds: ["groupe-201"],
    showCorrectionCount: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-2",
    activityType: "history",
    levelId: "sec-1",
    title: "Repérer une date dans un énoncé",
    originalText: "Remets les événements dans l’ordre chronologique.",
    difficulty: "easy",
    tags: ["établir des faits", "chronologie", "régime britannique"],
    corrections: [],
    historyActivity: {
      operation: "situate_time",
      aspects: ["politics"],
      documents: [],
      questions: [{ id: "q-ordre-constitutionnel", prompt: "Place ces événements du Régime britannique du plus ancien au plus récent.", action: "chronological_order", documentIds: [], points: 2, timelineEvents: [{ id: "e-1763", text: "Proclamation royale", dateLabel: "1763", correctOrder: 1 }, { id: "e-1774", text: "Acte de Québec", dateLabel: "1774", correctOrder: 2 }, { id: "e-1791", text: "Acte constitutionnel", dateLabel: "1791", correctOrder: 3 }] }]
    },
    assignedGroupIds: ["groupe-101", "groupe-102"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-3",
    activityType: "history",
    levelId: "sec-4",
    title: "Identifier un changement économique",
    originalText: "Classe les éléments en changements ou continuités.",
    difficulty: "hard",
    tags: ["changements et continuités", "économie", "Bas-Canada"],
    corrections: [],
    historyActivity: {
      operation: "changes_continuities",
      aspects: ["economy", "territory"],
      documents: [],
      questions: [{ id: "q-bois", prompt: "Classe chaque élément dans la bonne catégorie.", action: "classification", documentIds: [], points: 3, categories: [{ id: "cat-changement", label: "Changement" }, { id: "cat-continuite", label: "Continuité" }], classificationItems: [{ id: "item-bois", text: "Le commerce du bois prend de l’importance au 19e siècle.", correctCategoryId: "cat-changement" }, { id: "item-agri", text: "L’agriculture demeure présente dans la vallée du Saint-Laurent.", correctCategoryId: "cat-continuite" }] }]
    },
    assignedGroupIds: ["groupe-401"],
    showCorrectionCount: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-4",
    activityType: "history",
    levelId: "sec-1",
    title: "Associer un événement à son contexte",
    originalText: "Associe l’événement à son contexte.",
    difficulty: "easy",
    tags: ["établir des faits", "relations", "Autochtones"],
    corrections: [],
    historyActivity: {
      operation: "relate_facts",
      aspects: ["relations", "power"],
      documents: [{ id: "doc-paix", title: "Contexte", kind: "text", text: "En 1701, la Grande Paix de Montréal officialise une alliance entre la France et plusieurs nations autochtones." }],
      questions: [{ id: "q-paix", prompt: "Associe chaque élément à la bonne information.", action: "matching", documentIds: ["doc-paix"], points: 2, matchingTargets: [{ id: "target-date", text: "1701" }, { id: "target-lieu", text: "Montréal" }], matchingPrompts: [{ id: "prompt-date", prompt: "Année de la Grande Paix", correctTargetId: "target-date" }, { id: "prompt-lieu", prompt: "Lieu de signature", correctTargetId: "target-lieu" }] }]
    },
    assignedGroupIds: ["groupe-101"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-5",
    activityType: "history",
    levelId: "sec-2",
    title: "Distinguer cause et conséquence",
    originalText: "Distingue les causes et les conséquences.",
    difficulty: "medium",
    tags: ["causes et conséquences", "économie", "territoire"],
    corrections: [],
    historyActivity: {
      operation: "causes_consequences",
      aspects: ["economy", "territory"],
      documents: [],
      questions: [{ id: "q-cause-consequence", prompt: "Classe chaque carte comme cause ou conséquence.", action: "classification", documentIds: [], points: 2, categories: [{ id: "cat-cause", label: "Cause" }, { id: "cat-consequence", label: "Conséquence" }], classificationItems: [{ id: "item-demande", text: "La demande britannique en bois augmente.", correctCategoryId: "cat-cause" }, { id: "item-transport", text: "Les réseaux de transport se développent.", correctCategoryId: "cat-consequence" }] }]
    },
    assignedGroupIds: ["groupe-201"],
    showCorrectionCount: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "activite-6",
    activityType: "history",
    levelId: "sec-4",
    title: "Comparer deux sociétés",
    originalText: "Compare deux sociétés à partir d’aspects précis.",
    difficulty: "medium",
    tags: ["différences et similitudes", "politique", "économie"],
    corrections: [],
    historyActivity: {
      operation: "differences_similarities",
      aspects: ["politics", "economy"],
      documents: [],
      questions: [{ id: "q-comparer", prompt: "Quels éléments représentent des différences entre les deux périodes?", action: "choice_multiple", documentIds: [], points: 2, choices: [{ id: "c1", text: "Le pouvoir politique change après 1760.", isCorrect: true }, { id: "c2", text: "L’économie conserve uniquement les mêmes activités.", isCorrect: false }, { id: "c3", text: "Le cadre impérial passe de français à britannique.", isCorrect: true }] }]
    },
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
