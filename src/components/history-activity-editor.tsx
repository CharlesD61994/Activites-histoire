"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HistoryCanvasEditor, createDefaultHistoryCanvas } from "@/components/history-canvas-editor";
import { HistoryClozeAuthoringEditor } from "@/components/history-cloze-authoring-editor";
import { normalizeHistoryCanvasLayout, resizeHistoryInteractionBlocks } from "@/lib/history-canvas";
import { historyQuestionMaxPoints } from "@/lib/history-scoring";
import {
  allHistoryOperations,
  allHistorySocietyAspects,
  getInitialHistoryAction,
  historyActionsByOperation,
  historyOperationLabels,
  historySocietyAspectLabels
} from "@/lib/history-activities";
import type {
  HistoryActivityData,
  HistoryActivityCanvas,
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

function isChoiceAction(action: HistoryInteractiveAction) {
  return action === "choice_single" || action === "choice_multiple" || action === "true_false" || action === "image_selection" || action === "reference_point";
}

function isSingleChoiceAction(action: HistoryInteractiveAction) {
  return action === "choice_single" || action === "true_false" || action === "reference_point";
}

function defaultQuestion(action: HistoryInteractiveAction): HistoryQuestion {
  const id = crypto.randomUUID();
  return {
    id,
    prompt: "Quelle réponse permet de répondre à la consigne?",
    operation: undefined,
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
    clozeBlanks: [{ id: crypto.randomUUID(), label: "1", options: [makeChoice("bon choix", true)] }],
    clozeDistractors: ["autre choix"],
    clozeTextStyle: { fontSize: 26 },
    acceptedTextAnswers: ["réponse acceptée"],
    textAnswerCaseSensitive: false
  };
}

function normalizeQuestion(question: HistoryQuestion, action: HistoryInteractiveAction): HistoryQuestion {
  const next = { ...defaultQuestion(action), ...question, action };
  if (!next.choices?.length) next.choices = [makeChoice("Réponse A", true), makeChoice("Réponse B")];
  if (action === "true_false") {
    next.choices = [
      { ...(next.choices[0] ?? makeChoice("Vrai", true)), text: "Vrai", isCorrect: next.choices?.[0]?.isCorrect ?? true },
      { ...(next.choices[1] ?? makeChoice("Faux")), text: "Faux", isCorrect: next.choices?.[1]?.isCorrect ?? false }
    ];
    if (!next.choices.some((choice) => choice.isCorrect)) next.choices[0].isCorrect = true;
  }
  if (action === "reference_point") {
    next.choices = [
      { ...(next.choices[0] ?? makeChoice("Avant", true)), text: next.choices?.[0]?.text || "Avant", isCorrect: next.choices?.[0]?.isCorrect ?? true },
      { ...(next.choices[1] ?? makeChoice("Après")), text: next.choices?.[1]?.text || "Après", isCorrect: next.choices?.[1]?.isCorrect ?? false }
    ];
    if (!next.choices.some((choice) => choice.isCorrect)) next.choices[0].isCorrect = true;
    next.acceptedTextAnswers = next.acceptedTextAnswers?.length ? next.acceptedTextAnswers : ["-10 000"];
  }
  if (!next.categories?.length) next.categories = [{ id: crypto.randomUUID(), label: "Causes" }, { id: crypto.randomUUID(), label: "Conséquences" }];
  if (!next.classificationItems?.length) {
    next.classificationItems = [{ id: crypto.randomUUID(), text: "Élément à classer", correctCategoryId: next.categories[0].id }];
  }
  if (!next.matchingTargets?.length) next.matchingTargets = [{ id: crypto.randomUUID(), text: "Réponse associée" }];
  if (!next.matchingPrompts?.length) next.matchingPrompts = [{ id: crypto.randomUUID(), prompt: "Élément de départ", correctTargetId: next.matchingTargets[0].id }];
  if (!next.timelineEvents?.length) next.timelineEvents = [{ id: crypto.randomUUID(), text: "Événement 1", correctOrder: 1 }, { id: crypto.randomUUID(), text: "Événement 2", correctOrder: 2 }];
  if (!next.clozeBlanks?.length) next.clozeBlanks = [{ id: crypto.randomUUID(), label: "1", options: [makeChoice("bon choix", true), makeChoice("autre choix")] }];
  if (question.clozeDistractors === undefined) {
    next.clozeDistractors = [...new Set((question.clozeBlanks ?? []).flatMap((blank) => blank.options.filter((option) => !option.isCorrect).map((option) => option.text.trim())).filter(Boolean))];
  }
  if (!next.acceptedTextAnswers?.length) next.acceptedTextAnswers = ["réponse acceptée"];
  return next;
}

export function HistoryActivityEditor({ initialSentence, levels, onSave }: Props) {
  const initialHistory = initialSentence?.historyActivity;
  const initialOperation = initialHistory?.operation ?? "establish_facts";
  const [title, setTitle] = useState(initialSentence?.title ?? "Nouvelle activité d’histoire");
  const [levelId, setLevelId] = useState(initialSentence?.levelId ?? levels[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>(initialSentence?.difficulty ?? "easy");
  const [tagInput, setTagInput] = useState(initialSentence?.tags.join(", ") ?? "");
  const [operation, setOperation] = useState<HistoryOperation>(initialOperation);
  const [aspects, setAspects] = useState<HistorySocietyAspect[]>(initialHistory?.aspects ?? ["society"]);
  const [documents, setDocuments] = useState<HistorySourceDocument[]>(initialHistory?.documents ?? []);
  const [questions, setQuestions] = useState<HistoryQuestion[]>(() => {
    const savedQuestions = initialHistory?.questions.length ? initialHistory.questions : undefined;
    return (savedQuestions ?? [undefined]).map((savedQuestion, index) => {
      const questionOperation = savedQuestion?.operation ?? initialOperation;
      const initialAction = getInitialHistoryAction(questionOperation, savedQuestion?.action);
      const normalized = normalizeQuestion(savedQuestion ?? defaultQuestion(initialAction), initialAction);
      normalized.operation = questionOperation;
      normalized.canvas = normalizeHistoryCanvasLayout(
        savedQuestion?.canvas ?? (index === 0 ? initialHistory?.canvas : undefined) ?? createDefaultHistoryCanvas(normalized, initialHistory?.documents ?? []),
        normalized
      );
      return normalized;
    });
  });
  const [activeQuestionId, setActiveQuestionId] = useState(questions[0]?.id ?? "");
  const activeQuestionIndex = Math.max(0, questions.findIndex((item) => item.id === activeQuestionId));
  const question = questions[activeQuestionIndex] ?? questions[0];
  const canvas = question.canvas ?? createDefaultHistoryCanvas(question, documents);

  const questionOperation = question.operation ?? operation;
  const allowedActions = historyActionsByOperation[questionOperation];
  const imageDocuments = documents.filter((document) => document.kind === "image" || document.kind === "map");
  const questionPointTotal = historyQuestionMaxPoints(question);

  const replaceQuestion = useCallback((nextQuestion: HistoryQuestion) => {
    setQuestions((items) => items.map((item) => item.id === nextQuestion.id ? nextQuestion : item));
  }, []);

  useEffect(() => {
    if (!allowedActions.includes(question.action)) {
      const nextQuestion = normalizeQuestion(question, allowedActions[0]);
      nextQuestion.operation = questionOperation;
      nextQuestion.canvas = resizeHistoryInteractionBlocks(canvas, nextQuestion);
      replaceQuestion(nextQuestion);
    }
  }, [allowedActions, canvas, question, questionOperation, replaceQuestion]);

  function selectInteractiveAction(action: HistoryInteractiveAction) {
    const nextQuestion = normalizeQuestion(question, action);
    nextQuestion.operation = questionOperation;
    nextQuestion.canvas = resizeHistoryInteractionBlocks(canvas, nextQuestion);
    replaceQuestion(nextQuestion);
  }

  function updateQuestion(patch: Partial<HistoryQuestion>) {
    replaceQuestion({ ...question, ...patch });
  }

  function updateQuestionCanvas(nextCanvas: HistoryActivityCanvas) {
    updateQuestion({ canvas: nextCanvas });
  }

  function selectOperation(nextOperation: HistoryOperation) {
    setOperation(nextOperation);
    const nextAction = getInitialHistoryAction(nextOperation, question.action);
    const nextQuestion = normalizeQuestion({ ...question, operation: nextOperation }, nextAction);
    nextQuestion.canvas = nextAction === question.action ? canvas : resizeHistoryInteractionBlocks(canvas, nextQuestion);
    replaceQuestion(nextQuestion);
  }

  function addQuestion() {
    const action = getInitialHistoryAction(questionOperation);
    const nextQuestion = normalizeQuestion(defaultQuestion(action), action);
    nextQuestion.operation = questionOperation;
    nextQuestion.prompt = `Question ${questions.length + 1}`;
    nextQuestion.canvas = createDefaultHistoryCanvas(nextQuestion, documents);
    setQuestions((items) => [...items, nextQuestion]);
    setActiveQuestionId(nextQuestion.id);
  }

  function deleteActiveQuestion() {
    if (questions.length <= 1) return;
    const nextQuestions = questions.filter((item) => item.id !== question.id);
    setQuestions(nextQuestions);
    setActiveQuestionId(nextQuestions[Math.min(activeQuestionIndex, nextQuestions.length - 1)]?.id ?? "");
  }

  function addDocument(document: HistorySourceDocument) {
    setDocuments((items) => [...items, document]);
  }

  function updateDocument(id: string, patch: Partial<HistorySourceDocument>) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function deleteDocument(id: string) {
    setDocuments((items) => items.filter((item) => item.id !== id));
    updateQuestion({ documentIds: question.documentIds.filter((documentId) => documentId !== id) });
  }

  function save() {
    const normalizedQuestions = questions.map((item) => {
      const normalizedQuestion = normalizeQuestion(item, item.action);
      normalizedQuestion.operation = item.operation ?? operation;
      normalizedQuestion.canvas = normalizeHistoryCanvasLayout(item.canvas ?? createDefaultHistoryCanvas(normalizedQuestion, documents), normalizedQuestion);
      return { ...normalizedQuestion, points: historyQuestionMaxPoints(normalizedQuestion) };
    });
    const activity: HistoryActivityData = {
      operation: normalizedQuestions[0]?.operation ?? operation,
      aspects,
      documents,
      questions: normalizedQuestions,
      canvas: normalizedQuestions[0]?.canvas
    };
    const sentence: Sentence = {
      id: initialSentence?.id ?? crypto.randomUUID(),
      activityType: "history",
      levelId,
      title: title.trim() || "Activité d’histoire",
      originalText: normalizedQuestions[0]?.prompt ?? question.prompt,
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
    if (isChoiceAction(question.action)) {
      const singleChoice = isSingleChoiceAction(question.action);
      const imageSelection = question.action === "image_selection";
      const referencePoint = question.action === "reference_point";
      return (
        <section className="history-editor-panel">
          <h3>{imageSelection ? "Images à sélectionner" : referencePoint ? "Repère et choix" : "Réponses"}</h3>
          {referencePoint && (
            <label>
              Repère affiché au centre
              <input value={question.acceptedTextAnswers?.[0] ?? ""} onChange={(event) => updateQuestion({ acceptedTextAnswers: [event.target.value] })} placeholder="-10 000" />
            </label>
          )}
          {(question.choices ?? []).map((choice) => (
            <div className="history-inline-row" key={choice.id}>
              <input value={choice.text} disabled={question.action === "true_false"} onChange={(event) => setChoice(choice.id, { text: event.target.value })} />
              {imageSelection && (
                <select value={choice.documentId ?? ""} onChange={(event) => setChoice(choice.id, { documentId: event.target.value })}>
                  <option value="">Choisir une image</option>
                  {imageDocuments.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
                </select>
              )}
              <label className="history-check">
                <input
                  type={singleChoice ? "radio" : "checkbox"}
                  name={`correct-${question.id}`}
                  checked={choice.isCorrect}
                  onChange={(event) => {
                    if (singleChoice) {
                      updateQuestion({ choices: (question.choices ?? []).map((item) => ({ ...item, isCorrect: item.id === choice.id })) });
                    } else {
                      setChoice(choice.id, { isCorrect: event.target.checked });
                    }
                  }}
                />
                Bonne réponse
              </label>
              {question.action !== "true_false" && <button type="button" onClick={() => updateQuestion({ choices: question.choices?.filter((item) => item.id !== choice.id) })} aria-label="Supprimer"><Trash2 size={16} /></button>}
            </div>
          ))}
          {!singleChoice && <Button type="button" variant="secondary" onClick={() => updateQuestion({ choices: [...(question.choices ?? []), makeChoice(imageSelection ? "Nouvelle image" : "Nouvelle réponse")] })}><Plus size={16} /> Ajouter une réponse</Button>}
        </section>
      );
    }

    if (question.action === "classification" || question.action === "sort_categories") {
      return (
        <section className="history-editor-panel">
          <h3>{question.action === "sort_categories" ? "Zones et affirmations à trier" : "Catégories et cartes"}</h3>
          <div className="history-two-columns">
            <div>
              <h4>Catégories</h4>
              {(question.categories ?? []).map((category) => <input key={category.id} value={category.label} onChange={(event) => setCategory(category.id, event.target.value)} />)}
            </div>
            <div>
              <h4>{question.action === "sort_categories" ? "Affirmations à trier" : "Cartes à classer"}</h4>
              {(question.classificationItems ?? []).map((item) => (
                <div className="history-inline-row" key={item.id}>
                  <input value={item.text} onChange={(event) => setClassificationItem(item.id, { text: event.target.value })} />
                  <select value={item.correctCategoryId} onChange={(event) => setClassificationItem(item.id, { correctCategoryId: event.target.value })}>
                    {(question.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => updateQuestion({ classificationItems: [...(question.classificationItems ?? []), { id: crypto.randomUUID(), text: question.action === "sort_categories" ? "Nouvelle affirmation" : "Nouvelle carte", correctCategoryId: question.categories?.[0]?.id ?? "" }] })}><Plus size={16} /> Ajouter</Button>
            </div>
          </div>
        </section>
      );
    }

    if (question.action === "matching" || question.action === "table_fill") {
      return (
        <section className="history-editor-panel">
          <h3>{question.action === "table_fill" ? "Tableau à compléter" : "Associations"}</h3>
          <div className="history-two-columns">
            <div>
              <h4>{question.action === "table_fill" ? "Réponses attendues" : "Réponses possibles"}</h4>
              {(question.matchingTargets ?? []).map((target) => <input key={target.id} value={target.text} onChange={(event) => setMatchingTarget(target.id, event.target.value)} />)}
              <Button type="button" variant="secondary" onClick={() => updateQuestion({ matchingTargets: [...(question.matchingTargets ?? []), { id: crypto.randomUUID(), text: "Nouvelle réponse" }] })}><Plus size={16} /> Ajouter</Button>
            </div>
            <div>
              <h4>{question.action === "table_fill" ? "Lignes du tableau" : "Éléments à associer"}</h4>
              {(question.matchingPrompts ?? []).map((prompt) => (
                <div className="history-inline-row" key={prompt.id}>
                  <input value={prompt.prompt} onChange={(event) => setMatchingPrompt(prompt.id, { prompt: event.target.value })} placeholder={question.action === "table_fill" ? "Libellé de la ligne" : "Élément de départ"} />
                  <select value={prompt.correctTargetId} onChange={(event) => setMatchingPrompt(prompt.id, { correctTargetId: event.target.value })}>
                    {(question.matchingTargets ?? []).map((target) => <option key={target.id} value={target.id}>{target.text}</option>)}
                  </select>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => updateQuestion({ matchingPrompts: [...(question.matchingPrompts ?? []), { id: crypto.randomUUID(), prompt: question.action === "table_fill" ? "Nouvelle ligne" : "Nouvel élément", correctTargetId: question.matchingTargets?.[0]?.id ?? "" }] })}><Plus size={16} /> Ajouter</Button>
            </div>
          </div>
        </section>
      );
    }

    if (question.action === "chronological_order" || question.action === "timeline" || question.action === "arrange_order") {
      return (
        <section className="history-editor-panel">
          <h3>{question.action === "arrange_order" ? "Cartes à ordonner" : "Événements"}</h3>
          {(question.timelineEvents ?? []).map((event) => (
            <div className="history-inline-row" key={event.id}>
              <input value={event.text} onChange={(input) => setTimelineEvent(event.id, { text: input.target.value })} placeholder={question.action === "arrange_order" ? "Texte de la carte" : "Événement"} />
              {question.action !== "arrange_order" && <input value={event.dateLabel ?? ""} onChange={(input) => setTimelineEvent(event.id, { dateLabel: input.target.value })} placeholder="Date ou période" />}
              <input type="number" min={1} value={event.correctOrder} onChange={(input) => setTimelineEvent(event.id, { correctOrder: Number(input.target.value) })} />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => updateQuestion({ timelineEvents: [...(question.timelineEvents ?? []), { id: crypto.randomUUID(), text: question.action === "arrange_order" ? "Nouvelle carte" : "Nouvel événement", correctOrder: (question.timelineEvents?.length ?? 0) + 1 }] })}><Plus size={16} /> Ajouter</Button>
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

    if (question.action === "short_text") {
      return (
        <section className="history-editor-panel">
          <h3>Réponses acceptées</h3>
          <p>Ajoute les variantes qui doivent être validées automatiquement. Les majuscules et les accents sont ignorés par défaut.</p>
          {(question.acceptedTextAnswers ?? []).map((answer, index) => (
            <div className="history-inline-row" key={index}>
              <input value={answer} onChange={(event) => updateQuestion({ acceptedTextAnswers: (question.acceptedTextAnswers ?? []).map((item, answerIndex) => answerIndex === index ? event.target.value : item) })} placeholder="Mot ou courte phrase" />
              <button type="button" onClick={() => updateQuestion({ acceptedTextAnswers: (question.acceptedTextAnswers ?? []).filter((_, answerIndex) => answerIndex !== index) })} aria-label="Supprimer"><Trash2 size={16} /></button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => updateQuestion({ acceptedTextAnswers: [...(question.acceptedTextAnswers ?? []), ""] })}><Plus size={16} /> Ajouter une réponse acceptée</Button>
          <label className="history-check">
            <input type="checkbox" checked={Boolean(question.textAnswerCaseSensitive)} onChange={(event) => updateQuestion({ textAnswerCaseSensitive: event.target.checked })} />
            Distinguer les majuscules/minuscules
          </label>
        </section>
      );
    }

    return (
      <section className="history-editor-panel">
        <h3>Texte à compléter</h3>
        <HistoryClozeAuthoringEditor question={question} onChange={updateQuestion} />
        <h3>Mots intrus</h3>
        <p>Ces mots seront proposés dans la banque, mais ne correspondent à aucune case.</p>
        {(question.clozeDistractors ?? []).map((word, index) => <div className="history-inline-row" key={index}><input value={word} onChange={(event) => updateQuestion({ clozeDistractors: (question.clozeDistractors ?? []).map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} /><button type="button" aria-label="Supprimer le mot intrus" onClick={() => updateQuestion({ clozeDistractors: (question.clozeDistractors ?? []).filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} /></button></div>)}
        <Button type="button" variant="secondary" onClick={() => updateQuestion({ clozeDistractors: [...(question.clozeDistractors ?? []), ""] })}><Plus size={16} /> Ajouter un mot intrus</Button>
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
          {allHistoryOperations.map((item) => <button key={item} type="button" className={questionOperation === item ? "active" : ""} onClick={() => selectOperation(item)}>{historyOperationLabels[item]}</button>)}
        </div>
        <h3>Aspects de société</h3>
        <div className="history-chip-grid">
          {allHistorySocietyAspects.map((aspect) => <label key={aspect} className={aspects.includes(aspect) ? "active" : ""}><input type="checkbox" checked={aspects.includes(aspect)} onChange={(event) => setAspects((current) => event.target.checked ? [...current, aspect] : current.filter((item) => item !== aspect))} />{historySocietyAspectLabels[aspect]}</label>)}
        </div>
      </Card>

      <div className="history-canvas-editor-section">
        <Card className="history-question-strip">
          <div className="history-question-tabs" role="tablist" aria-label="Questions de l’activité">
            {questions.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={item.id === question.id}
                className={item.id === question.id ? "active" : ""}
                key={item.id}
                onClick={() => setActiveQuestionId(item.id)}
              >
                <strong>Question {index + 1}</strong>
                <span>{historyQuestionMaxPoints(item)} pt{historyQuestionMaxPoints(item) > 1 ? "s" : ""}</span>
              </button>
            ))}
            <button type="button" className="history-question-add" onClick={addQuestion}>
              <Plus size={16} />
              Question
            </button>
          </div>
          <button type="button" className="history-question-delete" onClick={deleteActiveQuestion} disabled={questions.length <= 1}>
            <Trash2 size={16} />
            Supprimer la question
          </button>
        </Card>
        <HistoryCanvasEditor
          canvas={canvas}
          documents={documents}
          question={question}
          onChange={updateQuestionCanvas}
          onQuestionChange={replaceQuestion}
          availableActions={allowedActions}
          onActionChange={selectInteractiveAction}
          onAddDocument={addDocument}
          onUpdateDocument={updateDocument}
          onDeleteDocument={deleteDocument}
          contextPanel={(
            <>
              {actionEditor}
              <label>Points<input type="number" readOnly value={questionPointTotal} /></label>
            </>
          )}
        />
      </div>
    </div>
  );
}
