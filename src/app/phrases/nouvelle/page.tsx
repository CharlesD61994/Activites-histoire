"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { HistoryActivityEditor } from "@/components/history-activity-editor";
import { WorksheetEditor } from "@/components/worksheet-editor";
import { useAppStore } from "@/store/app-store";

export default function NewSentencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, saveSentence } = useAppStore();

  const isWorksheet = searchParams.get("type") === "worksheet";
  const [worksheetTitle, setWorksheetTitle] = useState("");

  const saveAndReturn = (sentence: Parameters<typeof saveSentence>[0]) => {
    saveSentence(sentence);
    router.push("/phrases");
  };

  return (
    <div className="page">
      <Link className="back-link" href="/phrases">
        <ArrowLeft size={17} />
        Retour aux activités
      </Link>

      <div className="page-header">
        <span className="eyebrow">{isWorksheet ? "Feuille d’activité" : "Création"}</span>
        {isWorksheet ? (
          <input className="worksheet-page-title-input" value={worksheetTitle} onChange={(event) => setWorksheetTitle(event.target.value)} placeholder="Titre de la feuille" />
        ) : (
          <h1>Nouvelle activité d’histoire</h1>
        )}
        <p>
          {isWorksheet
              ? "Compose une feuille Lettre en portrait et ajoute des réponses révélables dans le lecteur."
              : "Choisis une opération intellectuelle, ajoute des documents au besoin, puis construis une question interactive autocorrigée."}
        </p>
      </div>

      {isWorksheet ? (
        <WorksheetEditor levels={data.levels} onSave={saveAndReturn} controlledTitle={worksheetTitle} onTitleChange={setWorksheetTitle}/>
      ) : (
        <HistoryActivityEditor levels={data.levels} onSave={saveAndReturn}/>
      )}
    </div>
  );
}
