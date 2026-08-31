import type {
  AspectMinitestAspect,
  AspectMinitestAspectKey,
  AspectMinitestData,
  AspectMinitestPhrase,
  Sentence
} from "../types";

export const aspectMinitestAspectDefaults: ReadonlyArray<{
  key: AspectMinitestAspectKey;
  label: string;
  total: number;
}> = [
  { key: "society", label: "Social", total: 2 },
  { key: "politics", label: "Politique", total: 4 },
  { key: "economy", label: "Économique", total: 3 },
  { key: "culture", label: "Culturel", total: 5 },
  { key: "territory", label: "Territorial", total: 3 },
  { key: "science", label: "Scientifique", total: 3 }
];

export function createAspectMinitestAspects(): AspectMinitestAspect[] {
  return aspectMinitestAspectDefaults.map((aspect) => ({
    ...aspect,
    id: crypto.randomUUID()
  }));
}

export function createAspectMinitestPhrase(text = ""): AspectMinitestPhrase {
  return { id: crypto.randomUUID(), text };
}

export function createAspectMinitestData(): AspectMinitestData {
  return {
    headerLabel: "Corrigé",
    nameLabel: "NOM",
    groupLabel: "GROUPE",
    dateLabel: "",
    chapterLabel: "CHAPITRE 5 — La christianisation de l’Occident",
    bannerTitle: "Test sur les aspects – La christianisation de l’Occident",
    sectionTitle: "L’Europe chrétienne au Moyen Âge",
    instructionTitle: "Aspects de société",
    instructions: "Pour chaque aspect de société, écris le numéro de la phrase qui correspond à la bonne réalité sociale ci-dessous.",
    tipTitle: "PSST !",
    tipText: "VA VOIR LA DESCRIPTION DES ASPECTS DE SOCIÉTÉ À LA PAGE 3 DE TON CAHIER D’HISTOIRE ET N’OUBLIE PAS D’UTILISER LA BANQUE DE PHRASES À LA PAGE 2 DE CE CAHIER.",
    bankTitle: "Banque de phrases",
    aspects: createAspectMinitestAspects(),
    phrases: [createAspectMinitestPhrase()]
  };
}

export function getAspectMinitestPointTotal(sentence: Sentence): number {
  const data = sentence.aspectMinitest;
  if (!data) return 0;
  return data.aspects.reduce((sum, aspect) => sum + aspect.total, 0);
}

export function getAspectMinitestPhraseCount(sentence: Sentence): number {
  return sentence.aspectMinitest?.phrases.filter((phrase) => phrase.text.trim()).length ?? 0;
}

export function aspectMinitestConfigured(data: AspectMinitestData): boolean {
  const aspectIds = new Set(data.aspects.map((aspect) => aspect.id));
  return data.phrases
    .filter((phrase) => phrase.text.trim())
    .every((phrase) => Boolean(phrase.aspectId && aspectIds.has(phrase.aspectId)));
}
