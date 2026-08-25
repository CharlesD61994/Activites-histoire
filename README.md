# Alinéa - Activités d’histoire

Cette copie démarre l’adaptation de l’application “Alinéa - Activités de français” vers une application d’histoire.

## Étape actuelle

- identité produit changée vers “Alinéa - Activités d’histoire”;
- navigation et libellés visibles adaptés minimalement;
- stockage local isolé sous `alinea-activites-histoire-v1`;
- données de démonstration remplacées par des activités d’histoire;
- portails, groupes, années scolaires, séances, assignations, points, compétitions, lecteur, stockage local et Supabase conservés.

Les anciennes routes techniques comme `/phrases` et le type central `Sentence` restent en place pour éviter un renommage transversal prématuré.

## Prochaine étape prévue

Créer un modèle de données dédié aux activités d’histoire : documents sources, consignes, réponses attendues, corrigé, grille de correction, opération intellectuelle et aspects de société.
