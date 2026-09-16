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

## État récent du créateur d’activités d’histoire

Le créateur d’activités d’histoire évolue vers un éditeur de surface : le créateur place directement des blocs sur une surface qui doit correspondre le plus possible à la surface du lecteur. Les objets déposables comprennent notamment textes, documents, interactions, formes et éléments visuels. Le lecteur doit afficher les mêmes éléments, aux mêmes dimensions relatives, sans habillage d’édition.

Décisions importantes déjà prises :

- La surface d’édition est une surface libre de type tableau/Genially, avec objets déplaçables et redimensionnables.
- Le menu latéral gauche de l’application peut être caché pour donner à l’éditeur la même largeur utile que le lecteur.
- Le mode `Surface complète` est activé par défaut dans l’éditeur; le bouton permet de revenir à la hauteur normale. Ce n’est pas un vrai plein écran navigateur : seule la surface s’allonge en hauteur dans la page pour imiter la hauteur disponible dans le lecteur.
- Les documents placés sur la surface doivent s’afficher comme dans le lecteur : pas d’en-tête technique de bloc, image/document visible au complet par défaut, redimensionnement de toute la boîte, option d’afficher ou non un titre/légende/source.
- Dans le lecteur, cliquer un document ouvre une vue agrandie avec arrière-plan flou, zoom contrôlable, barre de contrôle indépendante du zoom et barre de défilement conservée quand nécessaire.
- Tous les objets interactifs déposables doivent suivre les mêmes conventions d’édition : cliquer-glisser n’importe où sur l’objet pour déplacer, sélection avec contour, poignées de redimensionnement discrètes, sélection multiple, déplacement au clavier, copier/coller/couper/dupliquer/supprimer.
- Le menu de configuration d’un objet s’ouvre au double-clic; les interactions qui peuvent être programmées directement sur l’objet devraient le permettre.
- Le menu clic droit de la surface contient Copier, Couper, Coller, Dupliquer, Premier plan, Arrière-plan et Supprimer; il doit rester visible dans la fenêtre même près des bords.
- La barre d’actions de l’éditeur est une barre épurée et collante qui contient notamment Texte, Ressources, Document, Interaction et le bouton de hauteur de surface. La barre d’édition de texte est intégrée dans cette barre quand un texte est actif.
- Les formes supportent remplissage opaque ou contour seulement, changement de couleur, opacité, disposition par plans et ombre projetée personnalisable. L’ombre doit venir d’une lumière en haut à gauche, donc se projeter vers la droite et le bas.
- Les documents supportent aussi l’ombre projetée.
- Les éléments visuels/ressources doivent être organisés par catégories riches, pertinentes et diversifiées, avec icônes, emojis, illustrations et choix d’arrière-plans. Les arrière-plans à motifs doivent conserver leurs lignes/motifs même avec une couleur foncée.

## Interactions d’histoire et pointage

Le système d’interactions vise à couvrir les formats proches de Genially et des tâches papier d’histoire. Les types actuels ou en cours d’intégration incluent :

- choix unique;
- choix multiples;
- vrai ou faux;
- sélection d’image;
- classement / tri par catégories;
- association;
- tableau à compléter;
- ordre chronologique;
- cartes à ordonner;
- repères sur une ligne du temps;
- zone cliquable sur document;
- repère à compléter;
- texte à compléter;
- réponse courte.

Pointage décidé :

- Une question vaut généralement un point par élément à réussir.
- Pour `Texte à compléter`, chaque mot/case caché vaut un point.
- Pour les interactions à plusieurs éléments, chaque élément correct vaut un point.
- Après une première validation avec erreurs, les bonnes réponses restent en place et sont indiquées en vert; les mauvaises sont indiquées en rouge.
- Le bouton `Valider` devient `Réessayer`.
- Quand l’élève clique `Réessayer`, seules les mauvaises réponses disparaissent; dans `Texte à compléter`, les mauvais mots retournent dans la banque et les bons restent verrouillés.
- Une bonne réponse trouvée à la deuxième chance vaut 0,5 point.
- Après une deuxième tentative échouée, les réponses restantes se révèlent.
- Les choix multiples et la sélection d’image doivent considérer une mauvaise option sélectionnée comme une erreur explicite, même si les bonnes options sont aussi sélectionnées.

## Décision UX à reprendre : cartes et couleurs

On veut améliorer les cartes de la Banque d’activités et les cartes du portail classe. La carte actuelle met trop en avant la consigne générique comme `Quelle réponse permet de répondre à la consigne?`, ce qui ne convient pas parce qu’une activité pourra bientôt contenir plusieurs questions.

Direction décidée :

- Une activité doit être présentée comme une séquence/thème, pas comme une seule question.
- Le titre principal doit être large et lisible, car il pourra contenir plusieurs thèmes.
- La carte doit afficher un résumé compact : nombre de questions, points, documents, groupes assignés et tags.
- Ne pas afficher la consigne générique comme texte principal dans la banque; elle peut rester dans l’éditeur comme valeur par défaut.
- Chaque opération intellectuelle garde une couleur stable.
- Si l’activité contient une seule opération, la carte peut prendre cette couleur comme accent principal.
- Si l’activité contient plusieurs questions avec une opération majoritaire, la carte peut utiliser la couleur de l’opération majoritaire.
- Si l’activité est vraiment mixte, utiliser une base neutre avec une bande colorée segmentée à gauche représentant les opérations présentes.
- Les pastilles d’opérations restent colorées et peuvent afficher les opérations présentes; s’il y en a trop, montrer les premières et `+N`.
- Les couleurs doivent aider à repérer rapidement les activités, sans prétendre qu’une activité mixte appartient à une seule opération.

Prochaine tâche probable :

- Corriger l’écart visuel `Vrai ou faux` entre éditeur et lecteur : les boutons dans l’éditeur doivent avoir le même rendu et les mêmes proportions que dans le lecteur.
- Centraliser les couleurs des opérations intellectuelles.
- Refaire les cartes de la Banque d’activités et du portail classe selon la logique activité/séquence, avec accents colorés et pastilles d’opérations.
- Revoir l’en-tête/présentation de l’activité elle-même pour préparer l’arrivée de plusieurs questions dans une même activité.

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

Préférence de livraison : après chaque modification terminée et vérifiée, committer et pousser sur `main`, puis vérifier que le déploiement de production Vercel correspondant réussit. Ne pas s’arrêter à une version locale, sauf demande explicite de l’utilisateur.

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
