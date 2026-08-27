"use client";

/* eslint-disable @next/next/no-img-element */
import type { HistorySourceDocument } from "@/types";

type Props = {
  document?: HistorySourceDocument;
};

export function HistoryDocumentContent({ document }: Props) {
  if (!document) return <span className="history-document-empty">Document</span>;

  const visibleTitle = document.showTitle ? (document.displayTitle?.trim() || document.title) : "";
  const visibleCaption = document.showCaption ? document.caption?.trim() : "";
  const visibleSource = document.showSource ? document.source?.trim() : "";
  const hasDetails = Boolean(visibleCaption || visibleSource);

  return (
    <span className={`history-document-content${visibleTitle ? " has-title" : ""}${hasDetails ? " has-details" : ""}`}>
      {visibleTitle && <strong className="history-document-visible-title">{visibleTitle}</strong>}
      <span className="history-document-content-media">
        {document.src ? <img src={document.src} alt={visibleTitle || document.title} /> : <span>{document.text || "Document texte"}</span>}
      </span>
      {hasDetails && (
        <small className="history-document-visible-details">
          {visibleCaption && <span>{visibleCaption}</span>}
          {visibleSource && <span>{visibleSource}</span>}
        </small>
      )}
    </span>
  );
}
