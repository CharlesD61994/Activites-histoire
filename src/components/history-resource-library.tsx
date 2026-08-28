"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import {
  ArrowLeft, Circle, Image as ImageIcon, Images, Minus, Palette, Plus,
  RectangleHorizontal, Search, Shapes, Square, Triangle, Upload, X
} from "lucide-react";
import { HistoryCanvasVisual, historyVisualCategories, historyVisualLibrary, type HistoryVisualLibraryItem } from "@/components/history-canvas-visual";
import { historyBackgroundPresets } from "@/components/history-canvas-background";
import type { HistoryActivityCanvas, HistoryCanvasShapeKind } from "@/types";

type Section = "home" | "shapes" | "visuals" | "background";

const shapeOptions = [
  { kind: "rectangle", label: "Rectangle", icon: Square },
  { kind: "rounded_rectangle", label: "Rectangle arrondi", icon: RectangleHorizontal },
  { kind: "circle", label: "Cercle", icon: Circle },
  { kind: "triangle", label: "Triangle", icon: Triangle },
  { kind: "line", label: "Ligne", icon: Minus },
  { kind: "arrow", label: "Flèche", icon: ArrowLeft }
] satisfies Array<{ kind: HistoryCanvasShapeKind; label: string; icon: typeof Square }>;

type Props = {
  canvas: HistoryActivityCanvas;
  onCanvasChange: (patch: Partial<HistoryActivityCanvas>) => void;
  onAddShape: (kind: HistoryCanvasShapeKind) => void;
  onAddVisual: (item: HistoryVisualLibraryItem) => void;
  onImportVisual: (file?: File) => void;
  onClose: () => void;
};

export function HistoryResourceLibrary({ canvas, onCanvasChange, onAddShape, onAddVisual, onImportVisual, onClose }: Props) {
  const [section, setSection] = useState<Section>("home");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-CA");
  const visualItems = useMemo(() => historyVisualLibrary.filter((item) => {
    if (category && item.category !== category) return false;
    if (!normalizedQuery) return true;
    return `${item.label} ${item.keywords}`.toLocaleLowerCase("fr-CA").includes(normalizedQuery);
  }), [category, normalizedQuery]);

  function goBack() {
    if (category) {
      setCategory("");
      setQuery("");
    } else {
      setSection("home");
    }
  }

  function importBackground(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCanvasChange({ backgroundImage: String(reader.result), backgroundImageOpacity: 1 });
    reader.readAsDataURL(file);
  }

  return (
    <div className="history-resource-library" role="dialog" aria-label="Bibliothèque de ressources">
      <header className="history-resource-library-header">
        {section !== "home" || category ? <button type="button" onClick={goBack} aria-label="Retour"><ArrowLeft size={19} /></button> : <span className="history-resource-library-mark"><Shapes size={19} /></span>}
        <div>
          <strong>{category ? historyVisualCategories.find((item) => item.id === category)?.label : section === "shapes" ? "Formes" : section === "visuals" ? "Éléments visuels" : section === "background" ? "Arrière-plan" : "Ressources"}</strong>
          <span>{category ? "Choisis un élément à déposer" : section === "home" ? "Ajoute et personnalise le contenu du tableau" : "Les modifications apparaissent aussi dans le lecteur"}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
      </header>

      {section === "home" && (
        <div className="history-resource-home-grid">
          <button type="button" onClick={() => setSection("shapes")}><Shapes size={25} /><strong>Formes</strong><span>Cadres, lignes, flèches et formes géométriques</span></button>
          <button type="button" onClick={() => setSection("visuals")}><Images size={25} /><strong>Éléments visuels</strong><span>Icônes, emojis, illustrations et images personnelles</span></button>
          <button type="button" onClick={() => setSection("background")}><Palette size={25} /><strong>Arrière-plan</strong><span>Couleur ou image appliquée à toute la surface</span></button>
        </div>
      )}

      {section === "shapes" && (
        <div className="history-resource-item-grid compact">
          {shapeOptions.map(({ kind, label, icon: Icon }) => (
            <button type="button" key={kind} onClick={() => onAddShape(kind)} title={`Ajouter : ${label}`}>
              <Icon size={30} strokeWidth={1.7} />
              <strong>{label}</strong>
            </button>
          ))}
        </div>
      )}

      {section === "visuals" && (
        <>
          <label className="history-resource-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un élément" />
          </label>
          {!category && !normalizedQuery && (
            <>
              <label className="history-resource-upload">
                <Upload size={22} />
                <span><strong>Mes images</strong><small>Importer une image personnelle</small></span>
                <Plus size={18} />
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => onImportVisual(event.target.files?.[0])} />
              </label>
              <div className="history-resource-category-heading"><strong>Histoire et thèmes</strong><span>{historyVisualCategories.length} catégories</span></div>
              <div className="history-resource-category-grid">
                {historyVisualCategories.map((item) => (
                  <button type="button" key={item.id} onClick={() => setCategory(item.id)}>
                    <span aria-hidden="true">{item.symbol}</span>
                    <div><strong>{item.label}</strong><small>{item.description}</small><small>{historyVisualLibrary.filter((visual) => visual.category === item.id).length} choix</small></div>
                  </button>
                ))}
              </div>
            </>
          )}
          {(category || normalizedQuery) && (
            <div className="history-resource-item-grid">
              {visualItems.map((item) => (
                <button type="button" key={item.id} onClick={() => onAddVisual(item)} title={`Ajouter : ${item.label}`}>
                  <span className="history-resource-visual-preview"><HistoryCanvasVisual {...{ id: item.id, type: "visual" as const, x: 0, y: 0, width: 100, height: 100, visualKind: item.kind, visualId: item.kind === "icon" ? item.value : undefined, visualSrc: item.kind === "emoji" ? item.value : undefined, visualLabel: item.label }} /></span>
                  <strong>{item.label}</strong>
                </button>
              ))}
              {visualItems.length === 0 && <p className="history-resource-empty">Aucun élément ne correspond à cette recherche.</p>}
            </div>
          )}
        </>
      )}

      {section === "background" && (
        <div className="history-background-controls">
          <div className="history-resource-category-heading"><strong>Fonds prêts à utiliser</strong><span>{historyBackgroundPresets.length} choix</span></div>
          <div className="history-background-preset-grid">
            {historyBackgroundPresets.map((preset) => (
              <button type="button" key={preset.id} className={canvas.background === preset.color && (canvas.backgroundPattern ?? "none") === preset.pattern && !canvas.backgroundImage ? "active" : ""} onClick={() => onCanvasChange({ background: preset.color, backgroundPattern: preset.pattern, backgroundImage: undefined, backgroundImageOpacity: undefined })}>
                <span className={`history-background-swatch preset-${preset.pattern}`} style={{ backgroundColor: preset.color }} />
                <strong>{preset.label}</strong>
              </button>
            ))}
          </div>
          <label className="history-inspector-color-field"><span>Couleur personnalisée</span><input type="color" value={canvas.background || "#ffffff"} onChange={(event) => onCanvasChange({ background: event.target.value })} /></label>
          <label className="history-resource-upload">
            <ImageIcon size={22} />
            <span><strong>Image d’arrière-plan</strong><small>Importer une image depuis l’appareil</small></span>
            <Plus size={18} />
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => importBackground(event.target.files?.[0])} />
          </label>
          {canvas.backgroundImage && (
            <>
              <div className="history-background-preview" style={{ backgroundColor: canvas.background || "#fff" }}><img src={canvas.backgroundImage} alt="Aperçu de l’arrière-plan" style={{ opacity: canvas.backgroundImageOpacity ?? 1, objectFit: canvas.backgroundImageFit === "stretch" ? "fill" : canvas.backgroundImageFit ?? "cover" }} /></div>
              <label className="history-inspector-field"><span>Ajustement</span><select value={canvas.backgroundImageFit ?? "cover"} onChange={(event) => onCanvasChange({ backgroundImageFit: event.target.value as HistoryActivityCanvas["backgroundImageFit"] })}><option value="cover">Remplir</option><option value="contain">Ajuster</option><option value="stretch">Étirer</option></select></label>
              <label className="history-inspector-range-field"><span>Opacité <strong>{Math.round((canvas.backgroundImageOpacity ?? 1) * 100)} %</strong></span><input type="range" min="10" max="100" step="5" value={(canvas.backgroundImageOpacity ?? 1) * 100} onChange={(event) => onCanvasChange({ backgroundImageOpacity: Number(event.target.value) / 100 })} /></label>
              <button type="button" className="history-background-remove" onClick={() => onCanvasChange({ backgroundImage: undefined, backgroundImageOpacity: undefined })}><X size={17} /> Retirer l’image</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
