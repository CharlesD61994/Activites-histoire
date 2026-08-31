"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TreeAnalysisEditor } from "@/components/tree-analysis-editor";
import { MixedActivityEditor } from "@/components/mixed-activity-editor";
import { HistoryActivityEditor } from "@/components/history-activity-editor";
import { WorksheetEditor } from "@/components/worksheet-editor";
import { AspectMinitestEditor } from "@/components/aspect-minitest-editor";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";

export default function EditSentencePage({ params }: { params: Promise<{ sentenceId: string }> }) {
  const { sentenceId } = use(params);
  const router = useRouter();
  const { data, saveSentence } = useAppStore();
  const sentence = data.sentences.find((item) => item.id === sentenceId);

  if (!sentence) {
    return <div className="page"><Card><h1>Activité introuvable</h1><Link href="/phrases">Retour aux activités</Link></Card></div>;
  }

  const isTreeAnalysisActivity = sentence.activityType === "tree_analysis";
  const isHistoryActivity = sentence.activityType === "history";
  const isWorksheetActivity = sentence.activityType === "worksheet";
  const isAspectMinitestActivity = sentence.activityType === "aspect_minitest";

  return (
    <div className="page">
      <Link className="back-link" href="/phrases"><ArrowLeft size={17} /> Retour aux activités</Link>
      <div className="page-header">
        <span className="eyebrow">Modification</span>
        <h1>{sentence.title}</h1>
        <p>
          {isTreeAnalysisActivity
            ? "Modifie la phrase et sa mise en page d’analyse en arbre."
            : isHistoryActivity ? "Modifie l’opération, les documents, la consigne et les réponses de l’activité d’histoire."
            : isWorksheetActivity ? "Modifie la mise en page, les réponses et le déroulement de la feuille."
            : isAspectMinitestActivity ? "Modifie la fiche, la banque de phrases, les totaux et le corrigé des aspects."
            : "Modifie le contenu, les réponses et le déroulement dans l’éditeur grammatical unifié."}
        </p>
      </div>
      {isTreeAnalysisActivity ? (
        <TreeAnalysisEditor
          initialSentence={sentence}
          levels={data.levels}
          groups={data.groups}
          onSave={(updated) => {
            saveSentence(updated);
            router.push("/phrases");
          }}
        />
      ) : isWorksheetActivity ? (
        <WorksheetEditor initialSentence={sentence} levels={data.levels} onSave={(updated) => { saveSentence(updated); router.push("/phrases"); }}/>
      ) : isAspectMinitestActivity ? (
        <AspectMinitestEditor initialSentence={sentence} levels={data.levels} onSave={(updated) => { saveSentence(updated); router.push("/phrases"); }}/>
      ) : isHistoryActivity ? (
        <HistoryActivityEditor initialSentence={sentence} levels={data.levels} onSave={(updated) => { saveSentence(updated); router.push("/phrases"); }}/>
      ) : (
        <MixedActivityEditor
          initialSentence={sentence}
          levels={data.levels}
          correctionCodes={data.correctionCodes}
          onSave={(updated) => {
            saveSentence(updated);
            router.push("/phrases");
          }}
        />
      )}
    </div>
  );
}
