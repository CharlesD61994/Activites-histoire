"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  allHistoryOperations,
  allHistorySocietyAspects,
  historyActionDescriptions,
  historyActionLabels,
  historyActionsByOperation,
  historyOperationLabels,
  historySocietyAspectLabels
} from "@/lib/history-activities";
import type {
  HistoryActivityData,
  HistoryChoiceOption,
  HistoryClassificationItem,
  HistoryHotspot,
  HistoryInteractiveAction,
  HistoryMatchingPrompt,
  HistoryOperation,
  HistoryQuestion,
  HistorySocietyAspect,
  HistorySourceDocument,
  HistoryTimelineEvent,
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

function makeChoice(text: string, isCorrect = false): HistoryChoiceOption {
  return { id: crypto.randomUUID(), text, isCorrect };
}

function defaultQuestion(action: HistoryInteractiveAction): HistoryQuestion {
  const id = crypto.randomUUID();
  return {
    id,
    prompt: "Quelle réponse permet de répondre à la consigne?",
    action,
    documentIds: [],
    points: 1,
    choices: [makeChoice("Réponse A", true), makeChoice("Réponse B"), makeChoice("Réponse C")],
    categories: [
      { id: crypto.randomUUID(), label: "Catégorie 1" },
      { id: crypto.randomUUID(), label: "Catégorie 2" }
    ],
    classificationItems: [],
    matchingPrompts: [],
    matchingTargets: [],
    timelineEvents: [],
    clozeText: "La réponse est [[1]].",
    clozeBlanks: [{ id: crypto.randomUUID(), label: "1", options: [makeChoice("bon choix", true), makeChoice("autre choix")] }]
  };
}

function normalizeQuestion(question: HistoryQuestion, action: HistoryInteractiveAction): HistoryQuestion {
  const next = { ...defaultQuestion(action), ...question, action };
  if (!next.choices?.length) next.choices = [makeChoice("Réponse A", true), makeChoice("Réponse B")];
  if (!next.categories?.length) next.categories = [{ id: crypto.randomUUID(), label: "Causes" }, { id: crypto.randomUUID(), label: "Conséquences" }];
  if (!next.classificationItems?.length) {
    next.classificationItems = [{ id: crypto.randomUUID(), text: "Élément à classer", correctCategoryId: next.categories[0].id }];
  }
  if (!next.matchingTargets?.length) next.matchingTargets = [{ id: crypto.randomUUID(), text: "Réponse associée" }];
  if (!next.matchingPrompts?.length) next.matchingPrompts = [{ id: crypto.randomUUID(), prompt: "Élément de départ", correctTargetId: next.matchingTargets[0].id }];
  if (!next.timelineEvents?.length) next.timelineEvents = [{ id: crypto.randomUUID(), text: "Événement 1", correctOrder: 1 }, { id: crypto.randomUUID(), text: "Événement 2", correctOrder: 2 }];
  if (!next.clozeBlanks?.length) next.clozeBlanks = [{ id: crypto.randomUUID(), label: "1", options: [makeChoice("bon choix", true), makeChoice("autre choix")] }];
  return next;
}

export function HistoryActivityEditor({ initialSentence, levels, onSave }: Props) {
  const initialHistory = initialSentence?.historyActivity;
  const [title, setTitle] = useState(initialSentence?.title ?? "Nouvelle activité d’histoire");
  const [levelId, setLevelId] = useState(initialSentence?.levelId ?? levels[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>(initialSentence?.difficulty ?? "easy");
  const [tagInput, setTagInput] = useState(initialSentence?.tags.join(", ") ?? "");
  const [operation, setOperation] = useState<HistoryOperation>(initialHistory?.operation ?? "establish_facts");
  const [aspects, setAspects] = useState<HistorySocietyAspect[]>(initialHistory?.aspects ?? ["society"]);
  const [documents, setDocuments] = useState<HistorySourceDocument[]>(initialHistory?.documents ?? []);
  const [question, setQuestion] = useState<HistoryQuestion>(() => normalizeQuestion(initialHistory?.questions[0] ?? defaultQuestion(historyActionsByOperation[initialHistory?.operation ?? "establish_facts"][0]), historyActionsByOperation[initialHistory?.operation ?? "establish_facts"][0]));

  const allowedActions = historyActionsByOperation[operation];
  const imageDocuments = documents.filter((document) => document.kind === "image" || document.kind === "map");

  useEffect(() => {
    if (!allowedActions.includes(question.action)) {
      setQuestion((current) => normalizeQuestion(current, allowedActions[0]));
    }
  }, [allowedActions, question.action]);

  function updateQuestion(patch: Partial<HistoryQuestion>) {
    setQuestion((current) => ({ ...current, ...patch }));
  }

  function addDocument(kind: HistorySourceDocument["kind"]) {
    setDocuments((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        title: kind === "text" ? "Document texte" : "Document image",
        kind,
        text: kind === "text" ? "Ajoute ici un court extrait ou une description." : undefined,
        caption: "",
        source: ""
      }
    ]);
  }

  function updateDocument(id: string, patch: Partial<HistorySourceDocument>) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function loadDocumentImage(id: string, file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDocument(id, { src: String(reader.result), title: documents.find((doc) => doc.id === id)?.title || file.name.replace(/\.[^.]+$/, "") });
    reader.readAsDataURL(file);
  }

  function save() {
    const activity: HistoryActivityData = {
      operation,
      aspects,
      documents,
      questions: [normalizeQuestion(question, question.action)]
    };
    const sentence: Sentence = {
      id: initialSentence?.id ?? crypto.randomUUID(),
      activityType: "history",
      levelId,
      title: title.trim() || "Activité d’histoire",
      originalText: question.prompt,
      difficulty,
      tags: tagInput.split(",").map((tag) => tag.trim()).filter(Boolean),
      corrections: [],
      historyActivity: activity,
      assignedGroupIds: initialSentence?.assignedGroupIds ?? [],
      competitionEnabled: initialSentence?.competitionEnabled,
      assignmentStatusByGroup: initialSentence?.assignmentStatusByGroup,
      assignmentProgressByGroup: initialSentence?.assignmentProgressByGroup,
      showCorrectionCount: false,
      createdAt: initialSentence?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(sentence);
  }

  function setChoice(id: string, patch: Partial<HistoryChoiceOption>) {
    updateQuestion({ choices: question.choices?.map((choice) => choice.id === id ? { ...choice, ...patch } : choice) });
  }

  function setCategory(id: string, label: string) {
    updateQuestion({ categories: question.categories?.map((category) => category.id === id ? { ...category, label } : category) });
  }

  function setClassificationItem(id: string, patch: Partial<HistoryClassificationItem>) {
    updateQuestion({ classificationItems: question.classificationItems?.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function setMatchingTarget(id: string, text: string) {
    updateQuestion({ matchingTargets: question.matchingTargets?.map((target) => target.id === id ? { ...target, text } : target) });
  }

  function setMatchingPrompt(id: string, patch: Partial<HistoryMatchingPrompt>) {
    updateQuestion({ matchingPrompts: question.matchingPrompts?.map((prompt) => prompt.id === id ? { ...prompt, ...patch } : prompt) });
  }

  function setTimelineEvent(id: string, patch: Partial<HistoryTimelineEvent>) {
    updateQuestion({ timelineEvents: question.timelineEvents?.map((event) => event.id === id ? { ...event, ...patch } : event) });
  }

  function setHotspot(patch: Partial<HistoryHotspot>) {
    updateQuestion({ hotspot: { documentId: imageDocuments[0]?.id ?? "", x: 50, y: 50, radius: 10, ...question.hotspot, ...patch } });
  }

  const activeHotspotDocument = imageDocuments.find((document) => document.id === (question.hotspot?.documentId ?? imageDocuments[0]?.id));

  const actionEditor = (() => {
    if (question.action === "choice_single" || question.action === "choice_multiple") {
      return (
        <section className="history-editor-panel">
          <h3>Réponses</h3>
          {(question.choices ?? []).map((choice) => (
            <div className="history-inline-row" key={choice.id}>
              <input value={choice.text} onChange={(event) => setChoice(choice.id, { text: event.target.value })} />
              <label className="history-check"><input type="checkbox" checked={choice.isCorrect} onChange={(event) => setChoice(choice.id, { isCorrect: event.target.checked })} /> Bonne réponse</label>
              <button type="button" onClick={() => updateQuestion({ choices: question.choices?.filter((item) => item.id !== choice.id) })} aria-label="Supprimer"><Trash2 size={16} /></button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => updateQuestion({ choices: [...(question.choices ?? []), makeChoice("Nouvelle réponse")] })}><Plus size={16} /> Ajouter une réponse</Button>
        </section>
      );
    }

    if (question.action === "classification") {
      return (
        <section className="history-editor-panel">
          <h3>Catégories et cartes</h3>
          <div className="history-two-columns">
            <div>
              <h4>Catégories</h4>
              {(question.categories ?? []).map((category) => <input key={category.id} value={category.label} onChange={(event) => setCategory(category.id, event.target.value)} />)}
            </div>
            <div>
              <h4>Cartes à classer</h4>
              {(question.classificationItems ?? []).map((item) => (
                <div className="history-inline-row" key={item.id}>
                  <input value={item.text} onChange={(event) => setClassificationItem(item.id, { text: event.target.value })} />
                  <select value={item.correctCategoryId} onChange={(event) => setClassificationItem(item.id, { correctCategoryId: event.target.value })}>
                    {(question.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => updateQuestion({ classificationItems: [...(question.classificationItems ?? []), { id: crypto.randomUUID(), text: "Nouvelle carte", correctCategoryId: question.categories?.[0]?.id ?? "" }] })}><Plus size={16} /> Ajouter une carte</Button>
            </div>
          </div>
        </section>
      );
    }

    if (question.action === "matching") {
      return (
        <section className="history-editor-panel">
          <h3>Associations</h3>
          <div className="history-two-columns">
            <div>
              <h4>Réponses possibles</h4>
              {(question.matchingTargets ?? []).map((target) => <input key={target.id} value={target.text} onChange={(event) => setMatchingTarget(target.id, event.target.value)} />)}
              <Button type="button" variant="secondary" onClick={() => updateQuestion({ matchingTargets: [...(question.matchingTargets ?? []), { id: crypto.randomUUID(), text: "Nouvelle réponse" }] })}><Plus size={16} /> Ajouter</Button>
            </div>
            <div>
              <h4>Éléments à associer</h4>
              {(question.matchingPrompts ?? []).map((prompt) => (
                <div className="history-inline-row" key={prompt.id}>
                  <input value={prompt.prompt} onChange={(event) => setMatchingPrompt(prompt.id, { prompt: event.target.value })} />
                  <select value={prompt.correctTargetId} onChange={(event) => setMatchingPrompt(prompt.id, { correctTargetId: event.target.value })}>
                    {(question.matchingTargets ?? []).map((target) => <option key={target.id} value={target.id}>{target.text}</option>)}
                  </select>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => updateQuestion({ matchingPrompts: [...(question.matchingPrompts ?? []), { id: crypto.randomUUID(), prompt: "Nouvel élément", correctTargetId: question.matchingTargets?.[0]?.id ?? "" }] })}><Plus size={16} /> Ajouter</Button>
            </div>
          </div>
        </section>
      );
    }

    if (question.action === "chronological_order" || question.action === "timeline") {
      return (
        <section className="history-editor-panel">
          <h3>Événements</h3>
          {(question.timelineEvents ?? []).map((event) => (
            <div className="history-inline-row" key={event.id}>
              <input value={event.text} onChange={(input) => setTimelineEvent(event.id, { text: input.target.value })} />
              <input value={event.dateLabel ?? ""} onChange={(input) => setTimelineEvent(event.id, { dateLabel: input.target.value })} placeholder="Date ou période" />
              <input type="number" min={1} value={event.correctOrder} onChange={(input) => setTimelineEvent(event.id, { correctOrder: Number(input.target.value) })} />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => updateQuestion({ timelineEvents: [...(question.timelineEvents ?? []), { id: crypto.randomUUID(), text: "Nouvel événement", correctOrder: (question.timelineEvents?.length ?? 0) + 1 }] })}><Plus size={16} /> Ajouter un événement</Button>
        </section>
      );
    }

    if (question.action === "document_hotspot") {
      return (
        <section className="history-editor-panel">
          <h3>Zone cliquable</h3>
          <select value={activeHotspotDocument?.id ?? ""} onChange={(event) => setHotspot({ documentId: event.target.value })}>
            <option value="">Choisir une image ou une carte</option>
            {imageDocuments.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
          </select>
          {activeHotspotDocument?.src ? (
            <button type="button" className="history-hotspot-editor" onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setHotspot({ documentId: activeHotspotDocument.id, x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
            }}>
              <img src={activeHotspotDocument.src} alt={activeHotspotDocument.title} />
              <span style={{ left: `${question.hotspot?.x ?? 50}%`, top: `${question.hotspot?.y ?? 50}%`, width: `${(question.hotspot?.radius ?? 10) * 2}%`, height: `${(question.hotspot?.radius ?? 10) * 2}%` }} />
            </button>
          ) : <p>Ajoute une image ou une carte dans les documents, puis clique dessus pour placer la bonne zone.</p>}
          <label>Rayon de tolérance (%)<input type="number" min={2} max={30} value={question.hotspot?.radius ?? 10} onChange={(event) => setHotspot({ radius: Number(event.target.value) })} /></label>
        </section>
      );
    }

    return (
      <section className="history-editor-panel">
        <h3>Texte à compléter</h3>
        <textarea value={question.clozeText ?? ""} onChange={(event) => updateQuestion({ clozeText: event.target.value })} />
        {(question.clozeBlanks ?? []).map((blank) => (
          <div className="history-cloze-editor" key={blank.id}>
            <strong>Blanc {blank.label}</strong>
            {blank.options.map((option) => (
              <div className="history-inline-row" key={option.id}>
                <input value={option.text} onChange={(event) => updateQuestion({ clozeBlanks: question.clozeBlanks?.map((item) => item.id === blank.id ? { ...item, options: item.options.map((candidate) => candidate.id === option.id ? { ...candidate, text: event.target.value } : candidate) } : item) })} />
                <label className="history-check"><input type="checkbox" checked={option.isCorrect} onChange={(event) => updateQuestion({ clozeBlanks: question.clozeBlanks?.map((item) => item.id === blank.id ? { ...item, options: item.options.map((candidate) => candidate.id === option.id ? { ...candidate, isCorrect: event.target.checked } : candidate) } : item) })} /> Bon choix</label>
              </div>
            ))}
          </div>
        ))}
      </section>
    );
  })();

  return (
    <div className="history-editor">
      <Card className="history-editor-panel">
        <div className="history-editor-heading">
          <div>
            <span className="eyebrow">Activité d’histoire</span>
            <h2>Créer une activité interactive</h2>
          </div>
          <Button onClick={save}><Save size={17} /> Enregistrer</Button>
        </div>
        <div className="history-form-grid">
          <label>Titre<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Niveau<select value={levelId} onChange={(event) => setLevelId(event.target.value)}>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
          <label>Difficulté<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as SentenceDifficulty)}>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Tags<input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="sédentarisation, néolithique" /></label>
        </div>
      </Card>

      <Card className="history-editor-panel">
        <h3>Opération intellectuelle</h3>
        <div className="history-action-grid">
          {allHistoryOperations.map((item) => <button key={item} type="button" className={operation === item ? "active" : ""} onClick={() => setOperation(item)}>{historyOperationLabels[item]}</button>)}
        </div>
        <h3>Aspects de société</h3>
        <div className="history-chip-grid">
          {allHistorySocietyAspects.map((aspect) => <label key={aspect} className={aspects.includes(aspect) ? "active" : ""}><input type="checkbox" checked={aspects.includes(aspect)} onChange={(event) => setAspects((current) => event.target.checked ? [...current, aspect] : current.filter((item) => item !== aspect))} />{historySocietyAspectLabels[aspect]}</label>)}
        </div>
      </Card>

      <Card className="history-editor-panel">
        <div className="history-editor-heading">
          <h3>Documents</h3>
          <div className="history-inline-actions">
            <Button type="button" variant="secondary" onClick={() => addDocument("image")}><ImagePlus size={16} /> Image</Button>
            <Button type="button" variant="secondary" onClick={() => addDocument("map")}><ImagePlus size={16} /> Carte</Button>
            <Button type="button" variant="secondary" onClick={() => addDocument("text")}><Plus size={16} /> Texte</Button>
          </div>
        </div>
        <div className="history-document-grid">
          {documents.map((document) => (
            <div className="history-document-card" key={document.id}>
              <input value={document.title} onChange={(event) => updateDocument(document.id, { title: event.target.value })} />
              <select value={document.kind} onChange={(event) => updateDocument(document.id, { kind: event.target.value as HistorySourceDocument["kind"] })}><option value="image">Image</option><option value="map">Carte</option><option value="text">Texte</option></select>
              {document.kind === "text" ? <textarea value={document.text ?? ""} onChange={(event) => updateDocument(document.id, { text: event.target.value })} /> : <><input type="file" accept="image/*" onChange={(event) => loadDocumentImage(document.id, event.target.files?.[0])} />{document.src && <img src={document.src} alt={document.title} />}</>}
              <input value={document.caption ?? ""} onChange={(event) => updateDocument(document.id, { caption: event.target.value })} placeholder="Légende" />
              <input value={document.source ?? ""} onChange={(event) => updateDocument(document.id, { source: event.target.value })} placeholder="Source" />
              <button type="button" onClick={() => setDocuments((items) => items.filter((item) => item.id !== document.id))}><Trash2 size={16} /> Supprimer</button>
            </div>
          ))}
          {documents.length === 0 && <p>Aucun document pour l’instant. Plusieurs opérations peuvent fonctionner sans document.</p>}
        </div>
      </Card>

      <Card className="history-editor-panel">
        <h3>Action interactive</h3>
        <div className="history-action-grid">
          {allowedActions.map((action) => <button key={action} type="button" className={question.action === action ? "active" : ""} onClick={() => setQuestion((current) => normalizeQuestion(current, action))}><strong>{historyActionLabels[action]}</strong><span>{historyActionDescriptions[action]}</span></button>)}
        </div>
        <label>Consigne<textarea value={question.prompt} onChange={(event) => updateQuestion({ prompt: event.target.value })} /></label>
        <label>Points<input type="number" min={1} max={20} value={question.points} onChange={(event) => updateQuestion({ points: Number(event.target.value) })} /></label>
      </Card>

      {actionEditor}
    </div>
  );
}
