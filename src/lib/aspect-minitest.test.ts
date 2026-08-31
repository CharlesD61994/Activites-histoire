import { describe, expect, it } from "vitest";
import { aspectMinitestConfigured, getAspectMinitestPointTotal } from "./aspect-minitest";
import type { AspectMinitestData, Sentence } from "../types";

const data: AspectMinitestData = {
  headerLabel: "MINITEST",
  nameLabel: "Nom :",
  groupLabel: "Groupe :",
  dateLabel: "Date :",
  bannerTitle: "Les aspects",
  instructionTitle: "Aspects de société",
  instructions: "Classe les phrases.",
  tipTitle: "Psst!",
  tipText: "Un indice.",
  bankTitle: "Banque de phrases",
  aspects: [{ id: "social", key: "society", label: "Social", total: 2 }],
  phrases: [
    { id: "one", text: "Première phrase", aspectId: "social" },
    { id: "two", text: "Deuxième phrase", aspectId: "social" },
    { id: "blank", text: "" }
  ]
};

describe("aspect minitest", () => {
  it("uses the configurable aspect totals", () => {
    expect(getAspectMinitestPointTotal({ aspectMinitest: data } as Sentence)).toBe(2);
    expect(aspectMinitestConfigured(data)).toBe(true);
  });

  it("detects an unassigned authored phrase", () => {
    expect(aspectMinitestConfigured({
      ...data,
      phrases: [...data.phrases, { id: "three", text: "Troisième phrase" }]
    })).toBe(false);
  });
});
