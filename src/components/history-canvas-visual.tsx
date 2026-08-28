import {
  Amphora, Anchor, Anvil, ArrowBigDown, ArrowBigLeft, ArrowBigRight, ArrowBigUp,
  Atom, Axe, BadgeDollarSign, Bell, Bird, Bone, BookOpen, BriefcaseBusiness, Building2,
  Bus, CalendarDays, Camera, Castle, ChartNoAxesColumnIncreasing, Check, Church,
  CircleArrowDown, CircleArrowLeft, CircleArrowRight, CircleArrowUp, CircleDollarSign,
  CircleHelp, Clock3, Cloud, Coins, Compass, Crown, Dog, Drama, Droplets, Earth,
  Factory, Feather, Fish, Flag, Flame, Footprints, Gem, Globe2, GraduationCap,
  Hammer, Handshake, Heart, HeartHandshake, House, KeyRound, Landmark, LandPlot,
  Languages, LibraryBig, Lightbulb, Map as MapIcon, MapPin, Megaphone, Microscope, Moon,
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
  key: KeyRound, landmark: Landmark, lightbulb: Lightbulb, map: MapIcon, pin: MapPin,
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

const baseHistoryVisualLibrary: HistoryVisualLibraryItem[] = [
  { id: "bone", label: "Os", kind: "icon", value: "bone", category: "prehistoire", keywords: "os fossile préhistoire" },
  { id: "footprints", label: "Empreintes", kind: "icon", value: "footprints", category: "prehistoire", keywords: "empreintes déplacement nomade" },
  { id: "flame", label: "Feu", kind: "icon", value: "flame", category: "prehistoire", keywords: "feu foyer découverte" },
  { id: "tent", label: "Campement", kind: "icon", value: "tent", category: "prehistoire", keywords: "tente campement nomade" },
  { id: "prehistoire-gem", label: "Pierre taillée", kind: "icon", value: "gem", category: "prehistoire", keywords: "pierre silex outil préhistoire" },
  { id: "prehistoire-axe", label: "Outil de pierre", kind: "icon", value: "axe", category: "prehistoire", keywords: "hache pierre outil préhistoire" },
  { id: "prehistoire-wheat", label: "Premières cultures", kind: "icon", value: "wheat", category: "prehistoire", keywords: "agriculture néolithique céréales" },
  { id: "prehistoire-house", label: "Habitat", kind: "icon", value: "house", category: "prehistoire", keywords: "habitat village maison" },
  { id: "amphora", label: "Amphore", kind: "icon", value: "amphora", category: "antiquite", keywords: "amphore antiquité commerce" },
  { id: "landmark", label: "Temple", kind: "icon", value: "landmark", category: "antiquite", keywords: "temple monument démocratie" },
  { id: "scroll", label: "Parchemin", kind: "icon", value: "scroll", category: "antiquite", keywords: "écriture loi parchemin" },
  { id: "coins", label: "Monnaie", kind: "icon", value: "coins", category: "antiquite", keywords: "monnaie commerce économie" },
  { id: "antiquite-crown", label: "Souverain", kind: "icon", value: "crown", category: "antiquite", keywords: "roi pouvoir empire" },
  { id: "antiquite-globe", label: "Monde connu", kind: "icon", value: "globe", category: "antiquite", keywords: "monde empire territoire" },
  { id: "antiquite-scale", label: "Droit", kind: "icon", value: "scale", category: "antiquite", keywords: "droit justice loi rome" },
  { id: "antiquite-book", label: "Écrits", kind: "icon", value: "book", category: "antiquite", keywords: "écriture livre histoire" },
  { id: "castle", label: "Château", kind: "icon", value: "castle", category: "moyen-age", keywords: "château seigneur moyen âge" },
  { id: "shield", label: "Bouclier", kind: "icon", value: "shield", category: "moyen-age", keywords: "bouclier chevalier guerre" },
  { id: "swords", label: "Épées", kind: "icon", value: "swords", category: "moyen-age", keywords: "épées chevalerie combat" },
  { id: "church", label: "Église", kind: "icon", value: "church", category: "moyen-age", keywords: "église religion clergé" },
  { id: "medieval-anvil", label: "Forge", kind: "icon", value: "anvil", category: "moyen-age", keywords: "forge artisan métier" },
  { id: "medieval-coins", label: "Impôt", kind: "icon", value: "coins", category: "moyen-age", keywords: "impôt économie seigneur" },
  { id: "medieval-scroll", label: "Charte", kind: "icon", value: "scroll", category: "moyen-age", keywords: "charte texte droit" },
  { id: "medieval-house", label: "Bourg", kind: "icon", value: "house", category: "moyen-age", keywords: "bourg village population" },
  { id: "ship", label: "Navire", kind: "icon", value: "ship", category: "moderne", keywords: "navire exploration colonisation" },
  { id: "compass", label: "Boussole", kind: "icon", value: "compass", category: "moderne", keywords: "boussole exploration navigation" },
  { id: "telescope", label: "Télescope", kind: "icon", value: "telescope", category: "moderne", keywords: "science astronomie" },
  { id: "crown", label: "Couronne", kind: "icon", value: "crown", category: "moderne", keywords: "roi monarchie pouvoir" },
  { id: "moderne-feather", label: "Plume", kind: "icon", value: "feather", category: "moderne", keywords: "humanisme écriture auteur" },
  { id: "moderne-globe", label: "Globe", kind: "icon", value: "globe", category: "moderne", keywords: "exploration monde carte" },
  { id: "moderne-anchor", label: "Port", kind: "icon", value: "anchor", category: "moderne", keywords: "port navigation commerce" },
  { id: "moderne-map", label: "Nouvelle carte", kind: "icon", value: "map", category: "moderne", keywords: "cartographie exploration" },
  { id: "factory", label: "Usine", kind: "icon", value: "factory", category: "contemporaine", keywords: "usine industrialisation travail" },
  { id: "train", label: "Train", kind: "icon", value: "train", category: "contemporaine", keywords: "train transport chemin de fer" },
  { id: "radio", label: "Radio", kind: "icon", value: "radio", category: "contemporaine", keywords: "radio communication média" },
  { id: "vote", label: "Vote", kind: "icon", value: "vote", category: "contemporaine", keywords: "vote démocratie politique" },
  { id: "contemp-building", label: "Ville", kind: "icon", value: "building", category: "contemporaine", keywords: "urbanisation ville population" },
  { id: "contemp-briefcase", label: "Emploi", kind: "icon", value: "briefcase", category: "contemporaine", keywords: "emploi travail économie" },
  { id: "contemp-megaphone", label: "Média", kind: "icon", value: "megaphone", category: "contemporaine", keywords: "média information communication" },
  { id: "contemp-chart", label: "Statistiques", kind: "icon", value: "chart", category: "contemporaine", keywords: "statistiques évolution société" },
  { id: "wheat", label: "Céréales", kind: "icon", value: "wheat", category: "sedentarisation", keywords: "blé céréales agriculture" },
  { id: "sprout", label: "Culture", kind: "icon", value: "sprout", category: "sedentarisation", keywords: "plante culture agriculture" },
  { id: "house", label: "Village", kind: "icon", value: "house", category: "sedentarisation", keywords: "maison village sédentaire" },
  { id: "tractor", label: "Agriculture", kind: "icon", value: "tractor", category: "sedentarisation", keywords: "agriculture ferme élevage" },
  { id: "sed-village", label: "Village", kind: "emoji", value: "🏘️", category: "sedentarisation", keywords: "village habitation sédentaire" },
  { id: "sed-sheaf", label: "Récolte", kind: "emoji", value: "🌾", category: "sedentarisation", keywords: "récolte moisson agriculture" },
  { id: "sed-cow", label: "Élevage", kind: "emoji", value: "🐄", category: "sedentarisation", keywords: "élevage animaux agriculture" },
  { id: "sed-pot", label: "Poterie", kind: "emoji", value: "🏺", category: "sedentarisation", keywords: "poterie artisanat néolithique" },
  { id: "fleurdelis", label: "Fleur de lys", kind: "emoji", value: "⚜️", category: "quebec", keywords: "québec fleur lys symbole" },
  { id: "snowflake", label: "Hiver", kind: "icon", value: "snowflake", category: "quebec", keywords: "québec hiver neige climat" },
  { id: "tree", label: "Forêt", kind: "icon", value: "tree", category: "quebec", keywords: "québec forêt ressources" },
  { id: "pin", label: "Lieu", kind: "icon", value: "pin", category: "quebec", keywords: "québec lieu territoire" },
  { id: "quebec-map", label: "Carte du Québec", kind: "icon", value: "map", category: "quebec", keywords: "québec carte territoire" },
  { id: "quebec-language", label: "Francophonie", kind: "icon", value: "languages", category: "quebec", keywords: "québec langue français culture" },
  { id: "quebec-river", label: "Fleuve", kind: "icon", value: "waves", category: "quebec", keywords: "saint-laurent fleuve territoire" },
  { id: "quebec-anchor", label: "Port de Québec", kind: "icon", value: "anchor", category: "quebec", keywords: "québec port commerce" },
  { id: "axe", label: "Hache", kind: "icon", value: "axe", category: "outils", keywords: "hache outil défricher" },
  { id: "hammer", label: "Marteau", kind: "icon", value: "hammer", category: "outils", keywords: "marteau outil construction" },
  { id: "pickaxe", label: "Pioche", kind: "icon", value: "pickaxe", category: "outils", keywords: "pioche outil mine" },
  { id: "anvil", label: "Enclume", kind: "icon", value: "anvil", category: "outils", keywords: "enclume forge métal" },
  { id: "tools-pencil", label: "Instrument d’écriture", kind: "icon", value: "pencil", category: "outils", keywords: "crayon écriture outil" },
  { id: "tools-key", label: "Mécanique", kind: "icon", value: "key", category: "outils", keywords: "clé mécanique outil" },
  { id: "tools-compass", label: "Mesure", kind: "icon", value: "compass", category: "outils", keywords: "compas mesure instrument" },
  { id: "tools-light", label: "Invention", kind: "icon", value: "lightbulb", category: "outils", keywords: "invention technique idée" },
  { id: "map", label: "Carte", kind: "icon", value: "map", category: "territoire", keywords: "carte territoire géographie" },
  { id: "globe", label: "Monde", kind: "icon", value: "globe", category: "territoire", keywords: "globe monde géographie" },
  { id: "mountain", label: "Relief", kind: "icon", value: "mountain", category: "territoire", keywords: "montagne relief territoire" },
  { id: "wheel", label: "Navigation", kind: "icon", value: "wheel", category: "territoire", keywords: "navigation déplacement mer" },
  { id: "territory-route", label: "Itinéraire", kind: "icon", value: "route", category: "territoire", keywords: "route déplacement territoire" },
  { id: "territory-pin", label: "Repère", kind: "icon", value: "pin", category: "territoire", keywords: "lieu carte repère" },
  { id: "territory-globe", label: "Planète", kind: "icon", value: "globe", category: "territoire", keywords: "planète monde géographie" },
  { id: "territory-flag", label: "Frontière", kind: "icon", value: "flag", category: "territoire", keywords: "frontière état territoire" },
  { id: "users", label: "Population", kind: "icon", value: "users", category: "societe", keywords: "population société groupe" },
  { id: "scale", label: "Justice", kind: "icon", value: "scale", category: "societe", keywords: "justice droit pouvoir" },
  { id: "palette", label: "Culture", kind: "icon", value: "palette", category: "societe", keywords: "culture art société" },
  { id: "graduation", label: "Éducation", kind: "icon", value: "graduation", category: "societe", keywords: "éducation école société" },
  { id: "society-handshake", label: "Coopération", kind: "icon", value: "handshake", category: "societe", keywords: "coopération relations société" },
  { id: "society-work", label: "Métier", kind: "icon", value: "briefcase", category: "societe", keywords: "métier travail société" },
  { id: "society-voice", label: "Opinion", kind: "icon", value: "megaphone", category: "societe", keywords: "opinion mouvement société" },
  { id: "society-money", label: "Inégalités", kind: "icon", value: "circleDollar", category: "societe", keywords: "richesse inégalités économie" },
  { id: "check", label: "Confirmation", kind: "icon", value: "check", category: "symboles", keywords: "oui correct validation" },
  { id: "x", label: "Refus", kind: "icon", value: "x", category: "symboles", keywords: "non erreur supprimer" },
  { id: "star", label: "Étoile", kind: "icon", value: "star", category: "symboles", keywords: "étoile important favori" },
  { id: "help", label: "Question", kind: "icon", value: "help", category: "symboles", keywords: "question aide" },
  { id: "book", label: "Livre", kind: "icon", value: "book", category: "symboles", keywords: "livre document lecture" },
  { id: "lightbulb", label: "Idée", kind: "icon", value: "lightbulb", category: "symboles", keywords: "idée comprendre" },
  { id: "symbol-heart", label: "À retenir", kind: "icon", value: "heart", category: "symboles", keywords: "important retenir" },
  { id: "symbol-clock", label: "Temps", kind: "icon", value: "clock", category: "symboles", keywords: "temps date chronologie" },
  { id: "symbol-money", label: "Économie", kind: "icon", value: "circleDollar", category: "symboles", keywords: "argent économie" },
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
  { id: "education-book", label: "Lecture", kind: "icon", value: "book", category: "education", keywords: "livre lecture éducation" },
  { id: "education-idea", label: "Comprendre", kind: "icon", value: "lightbulb", category: "education", keywords: "idée comprendre apprendre" },
  { id: "atom", label: "Atome", kind: "icon", value: "atom", category: "sciences", keywords: "atome science" },
  { id: "microscope", label: "Microscope", kind: "icon", value: "microscope", category: "sciences", keywords: "microscope recherche science" },
  { id: "zap", label: "Énergie", kind: "icon", value: "zap", category: "sciences", keywords: "énergie électricité" },
  { id: "droplets", label: "Eau", kind: "icon", value: "droplets", category: "sciences", keywords: "eau ressources" },
  { id: "wind", label: "Vent", kind: "icon", value: "wind", category: "sciences", keywords: "vent climat" },
  { id: "earth", label: "Terre", kind: "icon", value: "earth", category: "sciences", keywords: "terre planète environnement" },
  { id: "science-sun", label: "Soleil", kind: "icon", value: "sun", category: "sciences", keywords: "soleil énergie astronomie" },
  { id: "science-moon", label: "Lune", kind: "icon", value: "moon", category: "sciences", keywords: "lune astronomie" },
  { id: "science-cloud", label: "Nuage", kind: "icon", value: "cloud", category: "sciences", keywords: "nuage météo climat" },
  { id: "science-waves", label: "Ondes", kind: "icon", value: "waves", category: "sciences", keywords: "ondes eau science" },
  { id: "briefcase", label: "Travail", kind: "icon", value: "briefcase", category: "economie", keywords: "travail métier emploi" },
  { id: "building", label: "Entreprise", kind: "icon", value: "building", category: "economie", keywords: "entreprise ville économie" },
  { id: "basket", label: "Marché", kind: "icon", value: "basket", category: "economie", keywords: "marché commerce aliments" },
  { id: "chart", label: "Croissance", kind: "icon", value: "chart", category: "economie", keywords: "graphique économie croissance" },
  { id: "circle-dollar", label: "Argent", kind: "icon", value: "circleDollar", category: "economie", keywords: "argent monnaie économie" },
  { id: "handshake", label: "Échange", kind: "icon", value: "handshake", category: "economie", keywords: "échange commerce entente" },
  { id: "economy-coins", label: "Richesse", kind: "icon", value: "coins", category: "economie", keywords: "richesse monnaie économie" },
  { id: "economy-chart", label: "Production", kind: "icon", value: "chart", category: "economie", keywords: "production croissance économie" },
  { id: "bus", label: "Autobus", kind: "icon", value: "bus", category: "transport", keywords: "autobus transport route" },
  { id: "plane", label: "Avion", kind: "icon", value: "plane", category: "transport", keywords: "avion transport voyage" },
  { id: "sailboat", label: "Voilier", kind: "icon", value: "sailboat", category: "transport", keywords: "voilier navigation exploration" },
  { id: "anchor", label: "Ancre", kind: "icon", value: "anchor", category: "transport", keywords: "ancre bateau port" },
  { id: "route", label: "Route", kind: "icon", value: "route", category: "transport", keywords: "route trajet déplacement" },
  { id: "tower", label: "Aéroport", kind: "icon", value: "tower", category: "transport", keywords: "aéroport transport" },
  { id: "transport-ship", label: "Bateau", kind: "icon", value: "ship", category: "transport", keywords: "bateau transport navigation" },
  { id: "transport-train", label: "Chemin de fer", kind: "icon", value: "train", category: "transport", keywords: "train rail industrialisation" },
  { id: "trees", label: "Boisé", kind: "icon", value: "trees", category: "nature", keywords: "arbres forêt nature" },
  { id: "land", label: "Terre agricole", kind: "icon", value: "land", category: "nature", keywords: "terre agriculture territoire" },
  { id: "waves", label: "Cours d’eau", kind: "icon", value: "waves", category: "nature", keywords: "eau fleuve rivière" },
  { id: "fish", label: "Poisson", kind: "icon", value: "fish", category: "nature", keywords: "poisson pêche alimentation" },
  { id: "bird", label: "Oiseau", kind: "icon", value: "bird", category: "nature", keywords: "oiseau nature" },
  { id: "dog", label: "Animal domestique", kind: "icon", value: "dog", category: "nature", keywords: "animal domestication" },
  { id: "nature-sun", label: "Climat", kind: "icon", value: "sun", category: "nature", keywords: "soleil climat milieu" },
  { id: "nature-cloud", label: "Météo", kind: "icon", value: "cloud", category: "nature", keywords: "météo climat nature" },
  { id: "nature-mountain", label: "Montagne", kind: "icon", value: "mountain", category: "nature", keywords: "montagne relief nature" },
  { id: "nature-sprout", label: "Végétation", kind: "icon", value: "sprout", category: "nature", keywords: "plante végétation environnement" },
  { id: "emoji-people", label: "Personnes", kind: "emoji", value: "👥", category: "illustrations", keywords: "personnes groupe population" },
  { id: "emoji-farmer", label: "Agriculteur", kind: "emoji", value: "🧑‍🌾", category: "illustrations", keywords: "agriculteur paysan ferme" },
  { id: "emoji-house", label: "Maison", kind: "emoji", value: "🏠", category: "illustrations", keywords: "maison habitation village" },
  { id: "emoji-earth", label: "Terre", kind: "emoji", value: "🌎", category: "illustrations", keywords: "terre monde planète" },
  { id: "emoji-book", label: "Livre", kind: "emoji", value: "📖", category: "illustrations", keywords: "livre lecture document" },
  { id: "emoji-tools", label: "Outils", kind: "emoji", value: "🛠️", category: "illustrations", keywords: "outils technique" },
  { id: "emoji-factory", label: "Usine", kind: "emoji", value: "🏭", category: "illustrations", keywords: "usine industrie" },
  { id: "emoji-ship", label: "Navire", kind: "emoji", value: "⛵", category: "illustrations", keywords: "navire voyage exploration" }
];

type HistoryVisualCategoryId = typeof historyVisualCategories[number]["id"];

const curatedVisualThemes = {
  prehistoire: {
    icons: ["flame", "bone", "footprints", "tent", "gem", "axe", "hammer", "wheat", "sprout", "house", "fish", "trees", "mountain", "sun", "moon"],
    emojis: ["🪨", "🔥", "🏕️", "🛖", "🌾", "🌱", "🏺", "🦴", "🦬", "🦣", "🐟", "🫐", "🌰", "🪵", "☀️", "🌙", "🏞️", "👣", "🧺", "⚒️"],
    terms: ["Foyer", "Silex", "Campement", "Abri", "Cueillette", "Chasse", "Pêche", "Peinture rupestre", "Nomadisme", "Hutte", "Outil poli", "Première récolte", "Foyer commun", "Trace", "Pierre taillée"]
  },
  antiquite: {
    icons: ["amphora", "landmark", "scroll", "coins", "crown", "globe", "scale", "book", "shield", "swords", "ship", "map", "sun", "users", "vote"],
    emojis: ["🏛️", "🏺", "📜", "👑", "⚖️", "🪙", "🛡️", "⚔️", "🗺️", "🌍", "⛵", "📖", "🧱", "🏟️", "🕯️", "🦅", "🏹", "🧭", "⭐", "🔥"],
    terms: ["Temple", "Cité", "Empire", "Droit", "Écriture", "Monnaie", "Commerce", "Armée", "Pharaon", "Sénat", "Forum", "Mythologie", "Aqueduc", "Colonies", "Route antique"]
  },
  "moyen-age": {
    icons: ["castle", "shield", "swords", "church", "anvil", "coins", "scroll", "house", "crown", "wheat", "hammer", "flag", "book", "land", "users"],
    emojis: ["🏰", "🛡️", "⚔️", "⛪", "👑", "📜", "🌾", "🏘️", "🔨", "🕯️", "🧵", "🐎", "🧱", "🪙", "🗝️", "🍞", "🏹", "📖", "🛖", "🚩"],
    terms: ["Seigneurie", "Château", "Chevalerie", "Église", "Bourg", "Fief", "Impôt", "Forge", "Charte", "Moulin", "Rempart", "Marché", "Vassal", "Moine", "Terre"]
  },
  moderne: {
    icons: ["ship", "compass", "telescope", "crown", "feather", "globe", "anchor", "map", "landmark", "scroll", "book", "scale", "palette", "sailboat", "route"],
    emojis: ["⛵", "🧭", "🔭", "👑", "🪶", "🌍", "⚓", "🗺️", "📜", "📖", "🏛️", "🎨", "🖋️", "🪙", "🚢", "🌊", "⭐", "🏰", "💡", "🕯️"],
    terms: ["Exploration", "Cartographie", "Navigation", "Monarchie", "Humanisme", "Imprimerie", "Colonie", "Port", "Commerce maritime", "Découverte", "Traité", "Savants", "Renaissance", "Empire colonial", "Traversée"]
  },
  contemporaine: {
    icons: ["factory", "train", "radio", "vote", "building", "briefcase", "megaphone", "chart", "bus", "plane", "zap", "globe", "users", "school", "camera"],
    emojis: ["🏭", "🚂", "📻", "🗳️", "🏢", "💼", "📣", "📈", "🚌", "✈️", "⚡", "🌐", "👥", "🏫", "📷", "📰", "🏙️", "🚧", "📺", "💡"],
    terms: ["Industrialisation", "Usine", "Ville", "Démocratie", "Média", "Travail", "Syndicat", "Transport", "Électricité", "Guerre mondiale", "Urbanisation", "Manifestation", "Innovation", "Statistique", "Actualité"]
  },
  sedentarisation: {
    icons: ["wheat", "sprout", "house", "tractor", "land", "waves", "basket", "hammer", "anvil", "fish", "dog", "sun", "droplets", "trees", "utensils"],
    emojis: ["🌾", "🌱", "🏘️", "🏠", "🐄", "🐑", "🐐", "🏺", "🧺", "🌽", "🍞", "💧", "🪵", "🛖", "🥣", "🐟", "🧑‍🌾", "🌻", "⚒️", "☀️"],
    terms: ["Agriculture", "Élevage", "Village", "Récolte", "Céréales", "Poterie", "Grenier", "Irrigation", "Domestication", "Champ", "Moisson", "Stockage", "Habitat fixe", "Artisanat", "Four"]
  },
  quebec: {
    icons: ["map", "pin", "waves", "tree", "snowflake", "languages", "anchor", "landmark", "house", "ship", "flag", "users", "school", "book", "building"],
    emojis: ["⚜️", "🍁", "❄️", "🌲", "🌊", "🗺️", "📍", "⛪", "🏠", "🚢", "🛶", "🦫", "🏒", "📚", "🏛️", "🧣", "🌉", "🪵", "🎼", "🏫"],
    terms: ["Fleur de lys", "Saint-Laurent", "Forêt", "Hiver", "Nouvelle-France", "Seigneurie", "Ville de Québec", "Montréal", "Territoire", "Francophonie", "Autochtones", "Fourrures", "Patrimoine", "Institutions", "Fleuve"]
  },
  outils: {
    icons: ["axe", "hammer", "pickaxe", "anvil", "pencil", "key", "compass", "lightbulb", "scale", "camera", "microscope", "telescope", "notebook", "calendar", "book"],
    emojis: ["🛠️", "🔨", "🪓", "⛏️", "⚒️", "✏️", "🖊️", "🧭", "🔑", "💡", "🔬", "🔭", "📏", "⚖️", "📷", "🧰", "🪛", "🧱", "📓", "🪚"],
    terms: ["Hache", "Marteau", "Pioche", "Enclume", "Crayon", "Compas", "Instrument", "Invention", "Mesure", "Écriture", "Observation", "Construction", "Technique", "Atelier", "Réparation"]
  },
  territoire: {
    icons: ["map", "globe", "mountain", "wheel", "route", "pin", "flag", "waves", "compass", "ship", "anchor", "land", "trees", "building", "house"],
    emojis: ["🗺️", "🌍", "🏔️", "📍", "🚩", "🧭", "🛣️", "🌊", "⛰️", "🏞️", "🏝️", "🏜️", "🏙️", "🌲", "🚢", "⚓", "🏠", "🌉", "🧱", "☀️"],
    terms: ["Carte", "Frontière", "Relief", "Région", "Route", "Itinéraire", "Fleuve", "Village", "Ville", "Port", "Paysage", "Climat", "Ressource", "Lieu", "Distance"]
  },
  societe: {
    icons: ["users", "scale", "palette", "graduation", "handshake", "briefcase", "megaphone", "circleDollar", "heartHandshake", "school", "vote", "house", "building", "church", "music"],
    emojis: ["👥", "🤝", "⚖️", "🎨", "🎓", "💼", "📣", "💰", "🏠", "🏢", "🗳️", "⛪", "🎭", "🎵", "📚", "👩‍🏫", "🧑‍🌾", "👨‍👩‍👧‍👦", "❤️", "⭐"],
    terms: ["Population", "Famille", "Culture", "Éducation", "Justice", "Pouvoir", "Métier", "Échange", "Religion", "Opinion", "Droits", "Communauté", "Inégalités", "Tradition", "Vie quotidienne"]
  },
  symboles: {
    icons: ["check", "x", "star", "help", "book", "lightbulb", "heart", "clock", "circleDollar", "bell", "flag", "key", "shield", "circleArrowRight", "circleArrowLeft"],
    emojis: ["✅", "❌", "⭐", "❓", "💡", "❤️", "🔔", "⏰", "📌", "📍", "🚩", "🔑", "🛡️", "⚠️", "➕", "➖", "🔎", "📖", "🧩", "🎯"],
    terms: ["Correct", "Erreur", "Important", "Question", "Idée", "Alerte", "Temps", "Repère", "Indice", "Objectif", "À retenir", "Attention", "Ajouter", "Comparer", "Valider"]
  },
  fleches: {
    icons: ["arrowRight", "arrowLeft", "arrowUp", "arrowDown", "circleArrowRight", "circleArrowLeft", "circleArrowUp", "circleArrowDown", "route", "compass", "corner", "map", "pin", "flag", "chevron"],
    emojis: ["➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "🔁", "🔄", "⤴️", "⤵️", "↪️", "↩️", "🔀", "⏩", "⏪", "⏫", "⏬", "🔼", "🔽", "📍", "🚩", "🧭", "🛣️", "🎯"],
    terms: ["Droite", "Gauche", "Haut", "Bas", "Lien", "Retour", "Étape suivante", "Déplacement", "Cause", "Conséquence", "Parcours", "Comparer", "Repère", "Direction", "Connexion"]
  },
  education: {
    icons: ["school", "library", "notebook", "pencil", "calendar", "languages", "book", "lightbulb", "graduation", "users", "clipboard", "clock", "help", "check", "palette"],
    emojis: ["🎓", "🏫", "📚", "📖", "📓", "✏️", "🖊️", "🗓️", "💡", "🧠", "🔎", "✅", "❓", "🧑‍🏫", "👩‍🏫", "📌", "📝", "🧩", "🎯", "🏛️", "📐", "📎", "🖍️", "🧮"],
    terms: ["École", "Livre", "Cahier", "Recherche", "Apprendre", "Consigne", "Calendrier", "Langue", "Lecture", "Idée", "Classe", "Exercice", "Savoir", "Bibliothèque", "Objectif"]
  },
  sciences: {
    icons: ["atom", "microscope", "zap", "droplets", "wind", "earth", "sun", "moon", "cloud", "waves", "telescope", "lightbulb", "scale", "chart", "factory"],
    emojis: ["🔬", "⚛️", "⚡", "💧", "🌬️", "🌍", "☀️", "🌙", "☁️", "🌊", "🔭", "💡", "🧪", "🌡️", "🧲", "🧬", "📈", "🌋", "🪐", "⭐"],
    terms: ["Observation", "Expérience", "Énergie", "Eau", "Vent", "Planète", "Soleil", "Lune", "Climat", "Ondes", "Astronomie", "Mesure", "Découverte", "Données", "Technologie"]
  },
  economie: {
    icons: ["briefcase", "building", "basket", "chart", "circleDollar", "handshake", "coins", "factory", "tractor", "ship", "train", "landmark", "users", "scale", "shopping"],
    emojis: ["💰", "🪙", "💼", "🏢", "🛒", "📈", "🤝", "🏭", "🌾", "🚢", "🚂", "⚖️", "📊", "🏦", "🧺", "🍞", "🧑‍🌾", "🔨", "📦", "🧾"],
    terms: ["Commerce", "Marché", "Travail", "Production", "Richesse", "Échange", "Monnaie", "Usine", "Agriculture", "Transport", "Impôt", "Prix", "Ressource", "Entreprise", "Métier"]
  },
  transport: {
    icons: ["bus", "plane", "sailboat", "anchor", "route", "tower", "ship", "train", "compass", "map", "wheel", "waves", "flag", "globe", "arrowRight"],
    emojis: ["🚌", "✈️", "⛵", "⚓", "🛣️", "🚢", "🚂", "🚗", "🚲", "🛶", "🧭", "🗺️", "🌊", "🚩", "🌍", "🚧", "🏁", "↗️", "📍", "🛤️"],
    terms: ["Route", "Train", "Bateau", "Port", "Navigation", "Avion", "Autobus", "Voyage", "Trajet", "Exploration", "Déplacement", "Rail", "Fleuve", "Aéroport", "Frontière"]
  },
  nature: {
    icons: ["trees", "land", "waves", "fish", "bird", "dog", "sun", "cloud", "mountain", "sprout", "wheat", "droplets", "wind", "flame", "moon"],
    emojis: ["🌲", "🌳", "🌾", "🌱", "🌊", "🐟", "🦌", "🐄", "☀️", "☁️", "🏔️", "💧", "🌬️", "🔥", "🌙", "🍂", "🌻", "🏞️", "🪵", "🍃"],
    terms: ["Forêt", "Champ", "Rivière", "Pêche", "Faune", "Climat", "Montagne", "Végétation", "Récolte", "Ressource", "Saison", "Sol", "Eau", "Milieu", "Paysage"]
  },
  illustrations: {
    icons: ["star", "smile", "palette", "camera", "book", "heart", "bell", "lightbulb", "check", "help", "flag", "map", "sun", "cloud", "music"],
    emojis: ["🎨", "🖼️", "⭐", "✅", "❌", "❓", "💡", "❤️", "🔔", "📌", "📍", "🧩", "🎯", "📣", "📚", "🏛️", "🗺️", "🌈", "✨", "🖊️", "💬", "🗨️", "🏷️", "🪄", "🟦", "🟩", "🟨", "🟧", "🟥", "🔷", "🔶", "🔸", "🔹"],
    terms: ["Illustration", "Accent", "Repère", "Badge", "Étiquette", "Indice", "Décoration", "Mise en valeur", "Signal", "Annotation", "Marqueur", "Support visuel", "Icône colorée", "Bulle", "Point clé"]
  }
} satisfies Record<HistoryVisualCategoryId, { icons: string[]; emojis: string[]; terms: string[] }>;

const validIconIds = new Set(Object.keys(visualIcons));
const usedVisualIds = new Set(baseHistoryVisualLibrary.map((item) => item.id));

const iconLabels: Record<string, string> = {
  amphora: "Amphore", anchor: "Ancre", anvil: "Enclume", arrowDown: "Flèche bas",
  arrowLeft: "Flèche gauche", arrowRight: "Flèche droite", arrowUp: "Flèche haut",
  atom: "Atome", axe: "Hache", basket: "Marché", bell: "Cloche", bird: "Oiseau",
  bone: "Os", book: "Livre", briefcase: "Travail", building: "Bâtiment",
  bus: "Autobus", calendar: "Calendrier", camera: "Image", castle: "Château",
  chart: "Graphique", check: "Validation", church: "Église", circleArrowDown: "Direction bas",
  circleArrowLeft: "Direction gauche", circleArrowRight: "Direction droite", circleArrowUp: "Direction haut",
  circleDollar: "Argent", cloud: "Nuage", coins: "Monnaie", compass: "Boussole",
  crown: "Couronne", dog: "Animal domestique", droplets: "Eau", earth: "Terre",
  factory: "Usine", feather: "Plume", fish: "Poisson", flag: "Drapeau",
  flame: "Foyer", footprints: "Empreintes", gem: "Pierre", globe: "Globe",
  graduation: "Diplôme", hammer: "Marteau", handshake: "Échange", heart: "Coeur",
  heartHandshake: "Solidarité", house: "Maison", key: "Clé", landmark: "Monument",
  land: "Terre", languages: "Langues", library: "Bibliothèque", lightbulb: "Idée",
  map: "Carte", microscope: "Microscope", moon: "Lune", mountain: "Montagne",
  music: "Musique", notebook: "Cahier", palette: "Culture", pencil: "Crayon",
  pickaxe: "Pioche", plane: "Avion", radio: "Radio", route: "Route",
  sailboat: "Voilier", scale: "Justice", school: "École", scroll: "Parchemin",
  shield: "Bouclier", ship: "Navire", smile: "Sourire", snowflake: "Hiver",
  sprout: "Pousse", star: "Étoile", sun: "Soleil", swords: "Épées",
  telescope: "Télescope", tent: "Campement", tower: "Aéroport", tractor: "Agriculture",
  train: "Train", tree: "Forêt", trees: "Boisé", users: "Population",
  utensils: "Alimentation", vote: "Vote", waves: "Cours d’eau", wheat: "Céréales",
  wind: "Vent", wheel: "Navigation", x: "Erreur", zap: "Énergie"
};

const emojiLabels: Record<string, string> = {
  "✅": "Validation", "❌": "Erreur", "❓": "Question", "❤️": "À retenir", "⭐": "Étoile",
  "🔥": "Feu", "🪨": "Pierre", "🏕️": "Campement", "🛖": "Habitation", "🌾": "Céréales",
  "🌱": "Culture", "🏺": "Poterie", "🦴": "Os", "🦬": "Chasse", "🦣": "Préhistoire",
  "🐟": "Pêche", "🫐": "Cueillette", "🌰": "Ressource", "🪵": "Bois", "☀️": "Soleil",
  "🌙": "Lune", "🏞️": "Paysage", "👣": "Trace", "🧺": "Panier", "⚒️": "Outils",
  "🏛️": "Monument", "📜": "Texte ancien", "👑": "Pouvoir", "⚖️": "Justice", "🪙": "Monnaie",
  "🛡️": "Bouclier", "⚔️": "Conflit", "🗺️": "Carte", "🌍": "Monde", "⛵": "Navigation",
  "📖": "Livre", "🧱": "Construction", "🏟️": "Lieu public", "🕯️": "Époque ancienne", "🏰": "Château",
  "⛪": "Église", "🔨": "Marteau", "🧵": "Textile", "🐎": "Cheval", "🍞": "Pain",
  "🏹": "Arc", "🚩": "Repère", "🧭": "Boussole", "🔭": "Observation", "🪶": "Plume",
  "⚓": "Port", "🎨": "Art", "🖋️": "Écriture", "🚢": "Navire", "🌊": "Eau",
  "💡": "Idée", "🏭": "Usine", "🚂": "Train", "📻": "Radio", "🗳️": "Vote",
  "🏢": "Ville", "💼": "Travail", "📣": "Annonce", "📈": "Croissance", "🚌": "Transport",
  "✈️": "Avion", "⚡": "Électricité", "🌐": "Monde connecté", "👥": "Groupe", "🏫": "École",
  "📷": "Image", "📰": "Journal", "🏙️": "Ville", "🚧": "Chantier", "📺": "Média",
  "🐄": "Élevage", "🐑": "Troupeau", "🐐": "Élevage", "🌽": "Culture", "💧": "Eau",
  "🥣": "Alimentation", "🧑‍🌾": "Agriculture", "🌻": "Plante", "⚜️": "Fleur de lys",
  "🍁": "Québec", "❄️": "Hiver", "🌲": "Forêt", "📍": "Lieu", "🛶": "Canot",
  "🦫": "Fourrures", "🏒": "Culture québécoise", "📚": "Livres", "🌉": "Pont", "🎼": "Musique",
  "🛠️": "Outils", "🪓": "Hache", "⛏️": "Pioche", "✏️": "Crayon", "🖊️": "Écriture",
  "🔑": "Clé", "🔬": "Microscope", "📏": "Mesure", "🧰": "Atelier", "🪛": "Tournevis",
  "📓": "Cahier", "🪚": "Scie", "🏔️": "Montagne", "⛰️": "Relief", "🏝️": "Île",
  "🏜️": "Désert", "🏠": "Habitation", "🤝": "Échange", "🎓": "Éducation", "🎭": "Culture",
  "🎵": "Musique", "👩‍🏫": "Enseignement", "👨‍👩‍👧‍👦": "Famille", "⏰": "Temps", "📌": "Repère",
  "⚠️": "Attention", "➕": "Ajouter", "➖": "Retirer", "🔎": "Observer", "🧩": "Lien",
  "🎯": "Objectif", "➡️": "Droite", "⬅️": "Gauche", "⬆️": "Haut", "⬇️": "Bas",
  "↗️": "Diagonale haut", "↘️": "Diagonale bas", "↙️": "Diagonale retour", "↖️": "Diagonale haut gauche",
  "🔁": "Répéter", "🔄": "Recommencer", "⤴️": "Monter", "⤵️": "Descendre", "↪️": "Étape suivante",
  "↩️": "Retour", "🔀": "Mélanger", "🛣️": "Route", "📝": "Notes", "🧠": "Comprendre",
  "⏩": "Avancer vite", "⏪": "Reculer vite", "⏫": "Monter vite", "⏬": "Descendre vite",
  "🔼": "Monter", "🔽": "Descendre", "📐": "Équerre", "📎": "Attache", "🖍️": "Crayon couleur",
  "🧮": "Calcul", "💬": "Bulle", "🗨️": "Dialogue", "🏷️": "Étiquette", "🪄": "Accent magique",
  "🟦": "Carré bleu", "🟩": "Carré vert", "🟨": "Carré jaune", "🟧": "Carré orange", "🟥": "Carré rouge",
  "🔷": "Losange bleu", "🔶": "Losange orange", "🔸": "Petit losange", "🔹": "Petit repère",
  "🧑‍🏫": "Enseignement", "🌬️": "Vent", "🧪": "Expérience", "🌡️": "Température",
  "🧲": "Aimant", "🧬": "Science", "🌋": "Relief", "🪐": "Espace", "📊": "Données",
  "🏦": "Banque", "📦": "Produit", "🧾": "Reçu", "🚗": "Voiture", "🚲": "Vélo",
  "🏁": "Arrivée", "🛤️": "Rail", "🌳": "Arbre", "🦌": "Faune", "🍂": "Automne",
  "🍃": "Feuille", "🖼️": "Illustration", "🌈": "Couleur", "✨": "Accent"
};

function expandedVisualItems() {
  const items: HistoryVisualLibraryItem[] = [];
  historyVisualCategories.forEach((category) => {
    const theme = curatedVisualThemes[category.id];
    const usedKeys = new Set(baseHistoryVisualLibrary.filter((item) => item.category === category.id).map((item) => `${item.kind}:${item.value}`));
    let added = 0;
    for (let index = 0; added < 35 && index < 80; index += 1) {
      const isEmoji = category.id === "illustrations" || index % 2 === 0;
      const kind = isEmoji ? "emoji" : "icon";
      const pool = isEmoji ? theme.emojis : theme.icons.filter((icon) => validIconIds.has(icon));
      const poolIndex = isEmoji ? Math.floor(index / 2) : Math.floor(index / 2);
      const value = pool[poolIndex % pool.length];
      const key = `${kind}:${value}`;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);
      const id = `expanded-${category.id}-${added + 1}`;
      if (usedVisualIds.has(id)) continue;
      const term = isEmoji
        ? emojiLabels[value] ?? `${category.label} coloré`
        : iconLabels[value] ?? theme.terms[poolIndex % theme.terms.length];
      items.push({
        id,
        label: term,
        kind,
        value,
        category: category.id,
        keywords: `${category.label} ${term} histoire élément visuel ${value}`
      });
      added += 1;
    }
  });
  return items;
}

export const historyVisualLibrary: HistoryVisualLibraryItem[] = [
  ...baseHistoryVisualLibrary,
  ...expandedVisualItems()
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
