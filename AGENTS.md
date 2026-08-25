# Guide agent — Alinéa - Activités d’histoire

Ce fichier sert de contexte durable pour les futures conversations Codex. Le code courant est toujours la source de vérité : si ce guide contredit le dépôt, inspecter le dépôt et corriger le guide.

## Objectif du projet

Alinéa - Activités d’histoire est une adaptation progressive de “Alinéa - Activités de français”. L’objectif est de conserver les fondations utiles de l’application originale, puis de remplacer graduellement le coeur grammatical par des activités d’histoire centrées sur les opérations intellectuelles et les aspects de société.

Fondations à préserver :

- portail enseignant et portail élève;
- groupes, niveaux et années scolaires;
- séances, collections et assignations;
- banque d’activités;
- points et compétitions;
- lecteur interactif;
- stockage local et Supabase optionnel;
- créateur de feuilles d’activités, à adapter plus tard.

## Architecture actuelle

- Framework : Next.js 15, React 19, TypeScript.
- État principal : `src/store/app-store.tsx`.
- Modèle central hérité : `Sentence` dans `src/types/index.ts`.
- Persistance locale : `src/lib/storage.ts`.
- Persistance Supabase optionnelle : `src/lib/repository/supabase-repository.ts`.
- Données de départ : `src/data/demo-data.ts`.
- Styles globaux : `src/app/globals.css` et `src/app/reader-system.css`.

Pour l’instant, les routes comme `/phrases` et plusieurs noms internes hérités restent en place. Ne pas lancer un renommage transversal sans demande explicite : il faudra le faire en étape dédiée.

## Direction pédagogique

Les opérations intellectuelles à prévoir progressivement :

- établir des faits;
- établir des liens de causalité;
- situer dans le temps;
- situer dans l’espace;
- mettre en relation des faits;
- déterminer des causes et des conséquences;
- dégager des différences et des similitudes;
- déterminer des changements et des continuités.

Les aspects de société devront pouvoir être associés aux activités, par exemple : politique, économie, territoire, culture, société, pouvoir, techniques, population, relations.

## Étapes de transformation

1. Adapter la base du projet pour l’histoire : nom, interface, vocabulaire, données de démo.
2. Créer un modèle de données pour les activités d’histoire : documents sources, consignes, réponses attendues, corrigé, grille de correction, opération intellectuelle, aspects de société.
3. Créer un premier éditeur générique d’activité d’histoire.
4. Implémenter les opérations intellectuelles une par une, en commençant par “Établir des faits”.
5. Adapter ensuite le créateur de feuilles d’activités pour l’histoire.

## Invariants

- Nom produit : utiliser “Alinéa - Activités d’histoire”.
- Ne pas supprimer les bases utiles de l’app actuelle.
- Ne pas reconstruire le portail ou le lecteur de zéro si une adaptation progressive suffit.
- Garder Supabase disponible pour plus tard.
- Préserver les données utilisateur et les changements non liés dans le dépôt.
- Le stockage local de cette copie utilise une clé distincte de l’app de français.
- Les mécaniques grammaticales avancées sont héritées et doivent rester stables tant qu’elles servent de transition ou de base technique.

## Zones à risque

- `Sentence` contient encore des champs de français et de grammaire. Ajouter les champs d’histoire progressivement sans supprimer les champs legacy.
- Les portails et statistiques utilisent encore les noms `sentences`, `sentenceIds` et `sentenceCount`.
- Les routes `/phrases` sont encore les routes de banque et d’édition d’activités.
- Le lecteur mixte et l’éditeur mixte restent liés aux mécaniques de correction grammaticale; ne pas les casser avant d’avoir un lecteur/éditeur d’histoire dédié.
- Feuille d’activité partage des champs `treeAnalysis*`; attention à ne pas casser Analyse en arbre en adaptant les feuilles.

## Vérifications après modification

Minimum avant livraison :

```bash
npm run build
git diff --check
```

Selon la zone touchée :

- modèle/types : lancer `npm run typecheck`;
- données/migration/stockage : vérifier que les données de démo se chargent et que la clé locale reste distincte;
- lecteur ou éditeur : tester visuellement le flux touché;
- CSS/layout : vérifier les écrans concernés, pas seulement le build.
