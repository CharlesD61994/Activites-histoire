import {
  Amphora, Anchor, Anvil, ArrowBigDown, ArrowBigLeft, ArrowBigRight, ArrowBigUp,
  Atom, Axe, BadgeDollarSign, Bell, Bird, Bone, BookOpen, BriefcaseBusiness, Building2,
  Bus, CalendarDays, Camera, Castle, ChartNoAxesColumnIncreasing, Check, Church,
  CircleArrowDown, CircleArrowLeft, CircleArrowRight, CircleArrowUp, CircleDollarSign,
  CircleHelp, Clock3, Cloud, Coins, Compass, Crown, Dog, Drama, Droplets, Earth,
  Factory, Feather, Fish, Flag, Flame, Footprints, Gem, Globe2, GraduationCap,
  Hammer, Handshake, Heart, HeartHandshake, House, KeyRound, Landmark, LandPlot,
  Languages, LibraryBig, Lightbulb, Map, MapPin, Megaphone, Microscope, Moon,
  Mountain, Music, NotebookPen, Palette, Pencil, Pickaxe, Plane, Radio, Rabbit,
  Route, Sailboat, Scale, School, ScrollText, Shield, Ship, ShipWheel, ShoppingBasket,
  Smile, Snowflake, Sprout, Star, Sun, Swords, Telescope, TentTree, TowerControl,
  Tractor, Train, TreePine, Trees, Users, Utensils, Vote, Waves, Wheat, Wind, X, Zap,
  type LucideIcon
} from "lucide-react";
/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import type { HistoryCanvasBlock } from "@/types";

const visualIcons: Record<string, LucideIcon> = {
  amphora: Amphora, anchor: Anchor, anvil: Anvil, arrowDown: ArrowBigDown,
  arrowLeft: ArrowBigLeft, arrowRight: ArrowBigRight, arrowUp: ArrowBigUp,
  circleArrowDown: CircleArrowDown, circleArrowLeft: CircleArrowLeft,
  circleArrowRight: CircleArrowRight, circleArrowUp: CircleArrowUp,
  atom: Atom, axe: Axe, badgeDollar: BadgeDollarSign, bell: Bell, bird: Bird, bone: Bone,
  book: BookOpen, camera: Camera, castle: Castle, check: Check, church: Church,
  briefcase: BriefcaseBusiness, building: Building2, bus: Bus, calendar: CalendarDays,
  chart: ChartNoAxesColumnIncreasing, circleDollar: CircleDollarSign, clock: Clock3,
  dog: Dog, drama: Drama, droplets: Droplets, earth: Earth, fish: Fish, flag: Flag,
  handshake: Handshake, heartHandshake: HeartHandshake, land: LandPlot,
  languages: Languages, library: LibraryBig, megaphone: Megaphone, plane: Plane,
  rabbit: Rabbit, route: Route, sailboat: Sailboat, school: School,
  basket: ShoppingBasket, trees: Trees, utensils: Utensils, waves: Waves, wind: Wind,
  tower: TowerControl, zap: Zap, help: CircleHelp, cloud: Cloud, coins: Coins,
  compass: Compass, crown: Crown, factory: Factory, feather: Feather, flame: Flame,
  footprints: Footprints, gem: Gem,
  globe: Globe2, graduation: GraduationCap, hammer: Hammer, heart: Heart, house: House,
  key: KeyRound, landmark: Landmark, lightbulb: Lightbulb, map: Map, pin: MapPin,
  microscope: Microscope, moon: Moon, mountain: Mountain, music: Music,
  notebook: NotebookPen, palette: Palette, pencil: Pencil, pickaxe: Pickaxe,
  radio: Radio, scale: Scale, scroll: ScrollText, shield: Shield, ship: Ship,
  wheel: ShipWheel, smile: Smile, snowflake: Snowflake, sprout: Sprout, star: Star,
  sun: Sun, swords: Swords, telescope: Telescope, tent: TentTree, tractor: Tractor,
  train: Train, tree: TreePine, users: Users, vote: Vote, wheat: Wheat, x: X
};

export type HistoryVisualLibraryItem = {
  id: string;
  label: string;
  kind: "icon" | "emoji";
  value: string;
  category: string;
  keywords: string;
};

export const historyVisualCategories = [
  { id: "prehistoire", label: "Préhistoire", symbol: "🪨", description: "Nomadisme, feu et premiers outils" },
  { id: "antiquite", label: "Antiquité", symbol: "🏛️", description: "Civilisations, pouvoir et écriture" },
  { id: "moyen-age", label: "Moyen Âge", symbol: "🏰", description: "Seigneuries, religion et chevalerie" },
  { id: "moderne", label: "Époque moderne", symbol: "⛵", description: "Explorations, sciences et monarchies" },
  { id: "contemporaine", label: "Époque contemporaine", symbol: "🏭", description: "Industrialisation et société moderne" },
  { id: "sedentarisation", label: "Sédentarisation", symbol: "🌾", description: "Agriculture, élevage et villages" },
  { id: "quebec", label: "Québec", symbol: "⚜️", description: "Territoire, culture et institutions" },
  { id: "outils", label: "Outils", symbol: "🛠️", description: "Objets, techniques et inventions" },
  { id: "territoire", label: "Territoire", symbol: "🗺️", description: "Cartes, lieux et déplacements" },
  { id: "societe", label: "Société", symbol: "👥", description: "Population, économie et pouvoir" },
  { id: "symboles", label: "Symboles", symbol: "⭐", description: "Repères visuels et annotations" },
  { id: "fleches", label: "Flèches", symbol: "➡️", description: "Directions, liens et déplacements" },
  { id: "education", label: "Éducation", symbol: "🎓", description: "École, lecture et apprentissage" },
  { id: "sciences", label: "Sciences", symbol: "🔬", description: "Découvertes, nature et technologie" },
  { id: "economie", label: "Économie", symbol: "💰", description: "Commerce, travail et production" },
  { id: "transport", label: "Transports", symbol: "🚂", description: "Routes, navigation et voyages" },
  { id: "nature", label: "Nature", symbol: "🌲", description: "Milieux, ressources et agriculture" },
  { id: "illustrations", label: "Illustrations", symbol: "🎨", description: "Éléments colorés et emojis" }
] as const;

export const historyVisualLibrary: HistoryVisualLibraryItem[] = [
  { id: "bone", label: "Os", kind: "icon", value: "bone", category: "prehistoire", keywords: "os fossile préhistoire" },
  { id: "footprints", label: "Empreintes", kind: "icon", value: "footprints", category: "prehistoire", keywords: "empreintes déplacement nomade" },
  { id: "flame", label: "Feu", kind: "icon", value: "flame", category: "prehistoire", keywords: "feu foyer découverte" },
  { id: "tent", label: "Campement", kind: "icon", value: "tent", category: "prehistoire", keywords: "tente campement nomade" },
  { id: "amphora", label: "Amphore", kind: "icon", value: "amphora", category: "antiquite", keywords: "amphore antiquité commerce" },
  { id: "landmark", label: "Temple", kind: "icon", value: "landmark", category: "antiquite", keywords: "temple monument démocratie" },
  { id: "scroll", label: "Parchemin", kind: "icon", value: "scroll", category: "antiquite", keywords: "écriture loi parchemin" },
  { id: "coins", label: "Monnaie", kind: "icon", value: "coins", category: "antiquite", keywords: "monnaie commerce économie" },
  { id: "castle", label: "Château", kind: "icon", value: "castle", category: "moyen-age", keywords: "château seigneur moyen âge" },
  { id: "shield", label: "Bouclier", kind: "icon", value: "shield", category: "moyen-age", keywords: "bouclier chevalier guerre" },
  { id: "swords", label: "Épées", kind: "icon", value: "swords", category: "moyen-age", keywords: "épées chevalerie combat" },
  { id: "church", label: "Église", kind: "icon", value: "church", category: "moyen-age", keywords: "église religion clergé" },
  { id: "ship", label: "Navire", kind: "icon", value: "ship", category: "moderne", keywords: "navire exploration colonisation" },
  { id: "compass", label: "Boussole", kind: "icon", value: "compass", category: "moderne", keywords: "boussole exploration navigation" },
  { id: "telescope", label: "Télescope", kind: "icon", value: "telescope", category: "moderne", keywords: "science astronomie" },
  { id: "crown", label: "Couronne", kind: "icon", value: "crown", category: "moderne", keywords: "roi monarchie pouvoir" },
  { id: "factory", label: "Usine", kind: "icon", value: "factory", category: "contemporaine", keywords: "usine industrialisation travail" },
  { id: "train", label: "Train", kind: "icon", value: "train", category: "contemporaine", keywords: "train transport chemin de fer" },
  { id: "radio", label: "Radio", kind: "icon", value: "radio", category: "contemporaine", keywords: "radio communication média" },
  { id: "vote", label: "Vote", kind: "icon", value: "vote", category: "contemporaine", keywords: "vote démocratie politique" },
  { id: "wheat", label: "Céréales", kind: "icon", value: "wheat", category: "sedentarisation", keywords: "blé céréales agriculture" },
  { id: "sprout", label: "Culture", kind: "icon", value: "sprout", category: "sedentarisation", keywords: "plante culture agriculture" },
  { id: "house", label: "Village", kind: "icon", value: "house", category: "sedentarisation", keywords: "maison village sédentaire" },
  { id: "tractor", label: "Agriculture", kind: "icon", value: "tractor", category: "sedentarisation", keywords: "agriculture ferme élevage" },
  { id: "fleurdelis", label: "Fleur de lys", kind: "emoji", value: "⚜️", category: "quebec", keywords: "québec fleur lys symbole" },
  { id: "snowflake", label: "Hiver", kind: "icon", value: "snowflake", category: "quebec", keywords: "québec hiver neige climat" },
  { id: "tree", label: "Forêt", kind: "icon", value: "tree", category: "quebec", keywords: "québec forêt ressources" },
  { id: "pin", label: "Lieu", kind: "icon", value: "pin", category: "quebec", keywords: "québec lieu territoire" },
  { id: "axe", label: "Hache", kind: "icon", value: "axe", category: "outils", keywords: "hache outil défricher" },
  { id: "hammer", label: "Marteau", kind: "icon", value: "hammer", category: "outils", keywords: "marteau outil construction" },
  { id: "pickaxe", label: "Pioche", kind: "icon", value: "pickaxe", category: "outils", keywords: "pioche outil mine" },
  { id: "anvil", label: "Enclume", kind: "icon", value: "anvil", category: "outils", keywords: "enclume forge métal" },
  { id: "map", label: "Carte", kind: "icon", value: "map", category: "territoire", keywords: "carte territoire géographie" },
  { id: "globe", label: "Monde", kind: "icon", value: "globe", category: "territoire", keywords: "globe monde géographie" },
  { id: "mountain", label: "Relief", kind: "icon", value: "mountain", category: "territoire", keywords: "montagne relief territoire" },
  { id: "wheel", label: "Navigation", kind: "icon", value: "wheel", category: "territoire", keywords: "navigation déplacement mer" },
  { id: "users", label: "Population", kind: "icon", value: "users", category: "societe", keywords: "population société groupe" },
  { id: "scale", label: "Justice", kind: "icon", value: "scale", category: "societe", keywords: "justice droit pouvoir" },
  { id: "palette", label: "Culture", kind: "icon", value: "palette", category: "societe", keywords: "culture art société" },
  { id: "graduation", label: "Éducation", kind: "icon", value: "graduation", category: "societe", keywords: "éducation école société" },
  { id: "check", label: "Confirmation", kind: "icon", value: "check", category: "symboles", keywords: "oui correct validation" },
  { id: "x", label: "Refus", kind: "icon", value: "x", category: "symboles", keywords: "non erreur supprimer" },
  { id: "star", label: "Étoile", kind: "icon", value: "star", category: "symboles", keywords: "étoile important favori" },
  { id: "help", label: "Question", kind: "icon", value: "help", category: "symboles", keywords: "question aide" },
  { id: "book", label: "Livre", kind: "icon", value: "book", category: "symboles", keywords: "livre document lecture" },
  { id: "lightbulb", label: "Idée", kind: "icon", value: "lightbulb", category: "symboles", keywords: "idée comprendre" },
  { id: "arrow-right", label: "Flèche droite", kind: "icon", value: "arrowRight", category: "fleches", keywords: "flèche droite direction suivant" },
  { id: "arrow-left", label: "Flèche gauche", kind: "icon", value: "arrowLeft", category: "fleches", keywords: "flèche gauche direction retour" },
  { id: "arrow-up", label: "Flèche haut", kind: "icon", value: "arrowUp", category: "fleches", keywords: "flèche haut direction" },
  { id: "arrow-down", label: "Flèche bas", kind: "icon", value: "arrowDown", category: "fleches", keywords: "flèche bas direction" },
  { id: "circle-arrow-right", label: "Direction droite", kind: "icon", value: "circleArrowRight", category: "fleches", keywords: "flèche cercle droite" },
  { id: "circle-arrow-left", label: "Direction gauche", kind: "icon", value: "circleArrowLeft", category: "fleches", keywords: "flèche cercle gauche" },
  { id: "circle-arrow-up", label: "Direction haut", kind: "icon", value: "circleArrowUp", category: "fleches", keywords: "flèche cercle haut" },
  { id: "circle-arrow-down", label: "Direction bas", kind: "icon", value: "circleArrowDown", category: "fleches", keywords: "flèche cercle bas" },
  { id: "school", label: "École", kind: "icon", value: "school", category: "education", keywords: "école éducation classe" },
  { id: "library", label: "Bibliothèque", kind: "icon", value: "library", category: "education", keywords: "bibliothèque livre recherche" },
  { id: "notebook", label: "Cahier", kind: "icon", value: "notebook", category: "education", keywords: "cahier écrire notes" },
  { id: "pencil", label: "Crayon", kind: "icon", value: "pencil", category: "education", keywords: "crayon écrire" },
  { id: "calendar", label: "Calendrier", kind: "icon", value: "calendar", category: "education", keywords: "calendrier date temps" },
  { id: "languages", label: "Langues", kind: "icon", value: "languages", category: "education", keywords: "langue communication français" },
  { id: "atom", label: "Atome", kind: "icon", value: "atom", category: "sciences", keywords: "atome science" },
  { id: "microscope", label: "Microscope", kind: "icon", value: "microscope", category: "sciences", keywords: "microscope recherche science" },
  { id: "zap", label: "Énergie", kind: "icon", value: "zap", category: "sciences", keywords: "énergie électricité" },
  { id: "droplets", label: "Eau", kind: "icon", value: "droplets", category: "sciences", keywords: "eau ressources" },
  { id: "wind", label: "Vent", kind: "icon", value: "wind", category: "sciences", keywords: "vent climat" },
  { id: "earth", label: "Terre", kind: "icon", value: "earth", category: "sciences", keywords: "terre planète environnement" },
  { id: "briefcase", label: "Travail", kind: "icon", value: "briefcase", category: "economie", keywords: "travail métier emploi" },
  { id: "building", label: "Entreprise", kind: "icon", value: "building", category: "economie", keywords: "entreprise ville économie" },
  { id: "basket", label: "Marché", kind: "icon", value: "basket", category: "economie", keywords: "marché commerce aliments" },
  { id: "chart", label: "Croissance", kind: "icon", value: "chart", category: "economie", keywords: "graphique économie croissance" },
  { id: "circle-dollar", label: "Argent", kind: "icon", value: "circleDollar", category: "economie", keywords: "argent monnaie économie" },
  { id: "handshake", label: "Échange", kind: "icon", value: "handshake", category: "economie", keywords: "échange commerce entente" },
  { id: "bus", label: "Autobus", kind: "icon", value: "bus", category: "transport", keywords: "autobus transport route" },
  { id: "plane", label: "Avion", kind: "icon", value: "plane", category: "transport", keywords: "avion transport voyage" },
  { id: "sailboat", label: "Voilier", kind: "icon", value: "sailboat", category: "transport", keywords: "voilier navigation exploration" },
  { id: "anchor", label: "Ancre", kind: "icon", value: "anchor", category: "transport", keywords: "ancre bateau port" },
  { id: "route", label: "Route", kind: "icon", value: "route", category: "transport", keywords: "route trajet déplacement" },
  { id: "tower", label: "Aéroport", kind: "icon", value: "tower", category: "transport", keywords: "aéroport transport" },
  { id: "trees", label: "Boisé", kind: "icon", value: "trees", category: "nature", keywords: "arbres forêt nature" },
  { id: "land", label: "Terre agricole", kind: "icon", value: "land", category: "nature", keywords: "terre agriculture territoire" },
  { id: "waves", label: "Cours d’eau", kind: "icon", value: "waves", category: "nature", keywords: "eau fleuve rivière" },
  { id: "fish", label: "Poisson", kind: "icon", value: "fish", category: "nature", keywords: "poisson pêche alimentation" },
  { id: "bird", label: "Oiseau", kind: "icon", value: "bird", category: "nature", keywords: "oiseau nature" },
  { id: "dog", label: "Animal domestique", kind: "icon", value: "dog", category: "nature", keywords: "animal domestication" },
  { id: "emoji-people", label: "Personnes", kind: "emoji", value: "👥", category: "illustrations", keywords: "personnes groupe population" },
  { id: "emoji-farmer", label: "Agriculteur", kind: "emoji", value: "🧑‍🌾", category: "illustrations", keywords: "agriculteur paysan ferme" },
  { id: "emoji-house", label: "Maison", kind: "emoji", value: "🏠", category: "illustrations", keywords: "maison habitation village" },
  { id: "emoji-earth", label: "Terre", kind: "emoji", value: "🌎", category: "illustrations", keywords: "terre monde planète" },
  { id: "emoji-book", label: "Livre", kind: "emoji", value: "📖", category: "illustrations", keywords: "livre lecture document" },
  { id: "emoji-tools", label: "Outils", kind: "emoji", value: "🛠️", category: "illustrations", keywords: "outils technique" },
  { id: "emoji-factory", label: "Usine", kind: "emoji", value: "🏭", category: "illustrations", keywords: "usine industrie" },
  { id: "emoji-ship", label: "Navire", kind: "emoji", value: "⛵", category: "illustrations", keywords: "navire voyage exploration" }
];

function alphaHex(color: string, opacity: number) {
  const normalized = /^#[0-9a-f]{6}$/i.test(color) ? color : "#ffffff";
  return `${normalized}${Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, "0")}`;
}

export function HistoryCanvasVisual(block: HistoryCanvasBlock) {
  const Icon = block.visualKind === "icon" ? visualIcons[block.visualId ?? ""] : undefined;
  const backgroundShape = block.visualBackgroundShape ?? "rounded";
  const style = {
    "--visual-color": block.visualColor ?? "#0b4a6f",
    "--visual-opacity": block.visualOpacity ?? 1,
    "--visual-background": block.visualBackgroundEnabled
      ? alphaHex(block.visualBackgroundColor ?? "#ffffff", block.visualBackgroundOpacity ?? 1)
      : "transparent",
    "--visual-border": block.visualBackgroundEnabled && (block.visualBorderWidth ?? 0) > 0
      ? `${block.visualBorderWidth}px solid ${block.visualBorderColor ?? "#0b4a6f"}`
      : "0 solid transparent"
  } as CSSProperties;
  const contentStyle = {
    transform: `rotate(${block.visualRotation ?? 0}deg) scaleX(${block.visualFlipX ? -1 : 1}) scaleY(${block.visualFlipY ? -1 : 1})`
  } as CSSProperties;

  return (
    <div className={`history-canvas-visual background-${backgroundShape}`} style={style} aria-label={block.visualLabel}>
      <div className="history-canvas-visual-content" style={contentStyle}>
        {Icon ? <Icon strokeWidth={1.8} /> : block.visualKind === "image" && block.visualSrc
          ? <img src={block.visualSrc} alt={block.visualLabel ?? ""} />
          : <span aria-hidden="true">{block.visualSrc || block.visualId || "⭐"}</span>}
      </div>
    </div>
  );
}
