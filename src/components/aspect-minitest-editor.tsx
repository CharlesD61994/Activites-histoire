"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Printer, Save, Trash2, X } from "lucide-react";
import { AspectMinitestSheet } from "@/components/aspect-minitest-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  aspectMinitestConfigured,
  createAspectMinitestData,
  createAspectMinitestPhrase
} from "@/lib/aspect-minitest";
import type {
  AspectMinitestData,
  SchoolLevel,
  Sentence,
  SentenceDifficulty
} from "@/types";

type Props = {
  initialSentence?: Sentence;
  levels: SchoolLevel[];
  onSave: (sentence: Sentence) => void;
};

const difficultyLabels: Record<SentenceDifficulty, string> = {
  easy: "Facile",
  medium: "Moyenne",
  hard: "Difficile"
};

export function AspectMinitestEditor({ initialSentence, levels, onSave }: Props) {
  const [title, setTitle] = useState(initialSentence?.title ?? "Minitest sur les aspects");
  const [levelId, setLevelId] = useState(initialSentence?.levelId ?? levels[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>(initialSentence?.difficulty ?? "medium");
  const [tags, setTags] = useState(initialSentence?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [data, setData] = useState<AspectMinitestData>(() => initialSentence?.aspectMinitest ?? createAspectMinitestData());
  const [previewMode, setPreviewMode] = useState<"student" | "answer">("student");
  const [isPrinting, setIsPrinting] = useState(false);
  const [aspectPhraseId, setAspectPhraseId] = useState<string>();
  const [message, setMessage] = useState("");

  const placements = useMemo(
    () => Object.fromEntries(data.phrases.filter((phrase) => phrase.aspectId).map((phrase) => [phrase.id, phrase.aspectId!])),
    [data.phrases]
  );
  const authoredPhrases = data.phrases.filter((phrase) => phrase.text.trim());

  function patchData(patch: Partial<AspectMinitestData>) {
    setData((current) => ({ ...current, ...patch }));
  }

  function addTag() {
    const next = tagInput.trim();
    if (!next || tags.includes(next)) return;
    setTags((current) => [...current, next]);
    setTagInput("");
  }

  function updatePhrase(id: string, text: string) {
    patchData({ phrases: data.phrases.map((phrase) => phrase.id === id ? { ...phrase, text } : phrase) });
  }

  function insertPhraseAfter(id: string, focusTarget: "manual" | "sheet" = "manual") {
    const index = data.phrases.findIndex((phrase) => phrase.id === id);
    const next = createAspectMinitestPhrase();
    const phrases = [...data.phrases];
    phrases.splice(index + 1, 0, next);
    patchData({ phrases });
    requestAnimationFrame(() => {
      const selector = focusTarget === "sheet"
        ? `[data-minitest-bank-phrase-id="${next.id}"]`
        : `[data-minitest-phrase-id="${next.id}"]`;
      document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)?.focus();
    });
  }

  function removePhrase(id: string) {
    const phrases = data.phrases.filter((phrase) => phrase.id !== id);
    patchData({ phrases: phrases.length ? phrases : [createAspectMinitestPhrase()] });
  }

  function assignPhrase(phraseId: string, aspectId?: string) {
    patchData({
      phrases: data.phrases.map((phrase) => phrase.id === phraseId ? { ...phrase, aspectId } : phrase)
    });
  }

  function save() {
    if (!title.trim() || !levelId) {
      setMessage("Ajoute un titre et choisis un niveau.");
      return;
    }
    if (!authoredPhrases.length) {
      setMessage("Ajoute au moins une phrase à la banque.");
      return;
    }
    if (!aspectMinitestConfigured(data)) {
      setMessage("Place chaque numéro dans le bon aspect avant d’enregistrer le corrigé.");
      setPreviewMode("answer");
      return;
    }

    const now = new Date().toISOString();
    onSave({
      id: initialSentence?.id ?? crypto.randomUUID(),
      activityType: "aspect_minitest",
      levelId,
      title: title.trim(),
      originalText: data.instructions,
      difficulty,
      tags,
      corrections: initialSentence?.corrections ?? [],
      aspectMinitest: {
        ...data,
        phrases: data.phrases.filter((phrase) => phrase.text.trim())
      },
      assignedGroupIds: initialSentence?.assignedGroupIds ?? [],
      competitionEnabled: initialSentence?.competitionEnabled,
      assignmentStatusByGroup: initialSentence?.assignmentStatusByGroup ?? {},
      assignmentProgressByGroup: initialSentence?.assignmentProgressByGroup ?? {},
      showCorrectionCount: false,
      createdAt: initialSentence?.createdAt ?? now,
      updatedAt: now
    });
  }

  function print(variant: "student" | "answer") {
    setPreviewMode(variant);
    setIsPrinting(true);
    window.addEventListener("afterprint", () => setIsPrinting(false), { once: true });
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  const aspectPhrase = aspectPhraseId ? data.phrases.find((phrase) => phrase.id === aspectPhraseId) : undefined;
  const aspectPhraseNumber = aspectPhraseId ? data.phrases.findIndex((phrase) => phrase.id === aspectPhraseId) + 1 : 0;

  return (
    <div className="aspect-minitest-editor">
      <Card className="aspect-minitest-editor-shell">
        <div className="aspect-minitest-editor-topbar">
          <div className="aspect-minitest-preview-toggle" aria-label="Version affichée">
            <button type="button" className={previewMode === "student" ? "active" : ""} onClick={() => setPreviewMode("student")}>Version élève</button>
            <button type="button" className={previewMode === "answer" ? "active" : ""} onClick={() => setPreviewMode("answer")}><Check size={16} /> Corrigé</button>
          </div>
          <div>
            <Button type="button" variant="secondary" onClick={() => print("student")}><Printer size={17} /> Imprimer élève</Button>
            <Button type="button" variant="secondary" onClick={() => print("answer")}><Printer size={17} /> Imprimer corrigé</Button>
            <Button type="button" onClick={save}><Save size={17} /> Enregistrer</Button>
          </div>
        </div>

        <div className="aspect-minitest-editor-settings">
          <label>Titre de l’activité<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Niveau<select value={levelId} onChange={(event) => setLevelId(event.target.value)}>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
          <label>Difficulté<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as SentenceDifficulty)}>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="aspect-minitest-tag-input"><label>Tags<input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /></label><Button type="button" variant="secondary" onClick={addTag}>Ajouter</Button></div>
          {tags.length > 0 && <div className="aspect-minitest-tags">{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags((current) => current.filter((item) => item !== tag))}>{tag}<X size={13} /></button>)}</div>}
        </div>

        <div className="aspect-minitest-content-editor">
          <section>
            <h3>Entête et bandeau</h3>
            <div className="aspect-minitest-form-grid">
              <label>Type<input value={data.headerLabel} onChange={(event) => patchData({ headerLabel: event.target.value })} /></label>
              <label>Nom<input value={data.nameLabel} onChange={(event) => patchData({ nameLabel: event.target.value })} /></label>
              <label>Groupe<input value={data.groupLabel} onChange={(event) => patchData({ groupLabel: event.target.value })} /></label>
              <label>Date<input value={data.dateLabel} onChange={(event) => patchData({ dateLabel: event.target.value })} /></label>
              <label className="wide">Chapitre<input value={data.chapterLabel ?? ""} onChange={(event) => patchData({ chapterLabel: event.target.value })} /></label>
              <label className="wide">Titre du bandeau<input value={data.bannerTitle} onChange={(event) => patchData({ bannerTitle: event.target.value })} /></label>
              <label className="wide">Sous-titre du tableau<input value={data.sectionTitle ?? ""} onChange={(event) => patchData({ sectionTitle: event.target.value })} /></label>
            </div>
          </section>
          <section>
            <h3>Consigne et bulle</h3>
            <div className="aspect-minitest-form-grid">
              <label>Titre du bloc<input value={data.instructionTitle} onChange={(event) => patchData({ instructionTitle: event.target.value })} /></label>
              <label>Titre de la bulle<input value={data.tipTitle} onChange={(event) => patchData({ tipTitle: event.target.value })} /></label>
              <label className="wide">Consigne<textarea value={data.instructions} onChange={(event) => patchData({ instructions: event.target.value })} /></label>
              <label className="wide">Texte de la bulle<textarea value={data.tipText} onChange={(event) => patchData({ tipText: event.target.value })} /></label>
            </div>
          </section>
          <section>
            <h3>Total de chaque aspect</h3>
            <div className="aspect-minitest-aspect-inputs">
              {data.aspects.map((aspect) => (
                <label key={aspect.id}><input value={aspect.label} onChange={(event) => patchData({ aspects: data.aspects.map((item) => item.id === aspect.id ? { ...item, label: event.target.value } : item) })} /><span>/</span><input type="number" min="0" value={aspect.total} onChange={(event) => patchData({ aspects: data.aspects.map((item) => item.id === aspect.id ? { ...item, total: Math.max(0, Number(event.target.value) || 0) } : item) })} /></label>
              ))}
            </div>
          </section>
        </div>

        <section className="aspect-minitest-phrase-editor">
          <div><h3>Banque de phrases</h3><label>Titre<input value={data.bankTitle} onChange={(event) => patchData({ bankTitle: event.target.value })} /></label></div>
          <p>Écris une phrase, puis appuie sur Entrée pour créer automatiquement le numéro suivant.</p>
          <div className="aspect-minitest-phrase-editor-list">
            {data.phrases.map((phrase, index) => (
              <div key={phrase.id}>
                <strong>{index + 1})</strong>
                <input
                  data-minitest-phrase-id={phrase.id}
                  value={phrase.text}
                  onChange={(event) => updatePhrase(phrase.id, event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); insertPhraseAfter(phrase.id); } }}
                  placeholder="Écris la phrase..."
                />
                <select value={phrase.aspectId ?? ""} onChange={(event) => assignPhrase(phrase.id, event.target.value || undefined)} aria-label={`Corrigé de la phrase ${index + 1}`}>
                  <option value="">Aspect...</option>
                  {data.aspects.map((aspect) => <option key={aspect.id} value={aspect.id}>{aspect.label}</option>)}
                </select>
                <button type="button" onClick={() => removePhrase(phrase.id)} aria-label={`Supprimer la phrase ${index + 1}`}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={() => patchData({ phrases: [...data.phrases, createAspectMinitestPhrase()] })}><Plus size={17} /> Ajouter une phrase</Button>
        </section>

        {message && <p className="aspect-minitest-editor-message">{message}</p>}

        <div className="aspect-minitest-preview-heading">
          <div><span className="eyebrow">Aperçu Lettre</span><h2>{previewMode === "answer" ? "Corrigé" : "Version élève"}</h2></div>
          {previewMode === "answer" && <p>Glisse les numéros dans les aspects. Ils s’alignent automatiquement, trois par ligne.</p>}
        </div>
        <AspectMinitestSheet
          className="aspect-minitest-print-target"
          data={data}
          variant={previewMode}
          placements={placements}
          interactiveCorrection={previewMode === "answer"}
          editableBank={!isPrinting && previewMode === "student"}
          onAssign={assignPhrase}
          onPhraseChange={updatePhrase}
          onInsertPhraseAfter={(phraseId) => insertPhraseAfter(phraseId, "sheet")}
          onSelectPhraseAspect={setAspectPhraseId}
        />

        {aspectPhrase && (
          <div className="modal-backdrop aspect-minitest-aspect-modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAspectPhraseId(undefined);
          }}>
            <Card className="modal-card aspect-minitest-aspect-modal" role="dialog" aria-modal="true" aria-label={`Attribuer la phrase ${aspectPhraseNumber}`}>
              <div className="modal-heading">
                <div><span className="eyebrow">Phrase {aspectPhraseNumber}</span><h3>Choisir l’aspect</h3></div>
                <button type="button" onClick={() => setAspectPhraseId(undefined)} aria-label="Fermer"><X size={18} /></button>
              </div>
              <p>{aspectPhrase.text.trim() || "Écris d’abord la phrase, puis choisis son aspect."}</p>
              <div className="aspect-minitest-aspect-modal-options">
                {data.aspects.map((aspect) => (
                  <button
                    key={aspect.id}
                    type="button"
                    className={aspectPhrase.aspectId === aspect.id ? "active" : ""}
                    onClick={() => { assignPhrase(aspectPhrase.id, aspect.id); setAspectPhraseId(undefined); }}
                  >
                    {aspect.label}<span>/{aspect.total}</span>
                  </button>
                ))}
              </div>
              {aspectPhrase.aspectId && <Button type="button" variant="secondary" onClick={() => { assignPhrase(aspectPhrase.id, undefined); setAspectPhraseId(undefined); }}>Retirer l’attribution</Button>}
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
