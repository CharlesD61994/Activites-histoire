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
  { key: "society", label: "Social", total: 5 },
  { key: "politics", label: "Politique", total: 3 },
  { key: "economy", label: "Économique", total: 5 },
  { key: "culture", label: "Culturel", total: 2 },
  { key: "science", label: "Scientifique", total: 2 },
  { key: "territory", label: "Territorial", total: 3 }
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
    headerLabel: "MINITEST",
    nameLabel: "Nom :",
    groupLabel: "Groupe :",
    dateLabel: "Date :",
    bannerTitle: "Test sur les aspects",
    instructionTitle: "Aspects de société",
    instructions: "Pour chaque aspect de société, place le numéro de la phrase qui correspond à la bonne réalité sociale.",
    tipTitle: "Psst!",
    tipText: "Consulte la banque de phrases pour classer chaque réalité dans le bon aspect de société.",
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
