# Onboarding — correction du 7 octobre 2026

## Problèmes identifiés

- Les jeux chargés automatiquement étaient affichés, mais `libraryChoice` restait faux : Continuer exigeait une nouvelle sélection même lorsque la bibliothèque était prête.
- Le cadre avait une hauteur automatique et plusieurs contenus à hauteur minimale. Les deux grandes cartes repoussaient le pied de page hors de l'écran.

## Changements

- Une collection détectée avec succès et non vide permet de continuer directement.
- Ajouter mes jeux plus tard mène à la personnalisation, sans sauter le reste de l'accueil initial.
- Choix de langue, aperçus des ambiances et résumé final avec les valeurs réellement sélectionnées.
- En-tête et pied de page réservés dans la hauteur du viewport. Sur desktop, défilement interne des cartes ; sur écran étroit, défilement du contenu central. Les commandes restent hors de cette zone.
- La zone d'une étape conserve sa hauteur de contenu pour éviter le chevauchement avec les chapitres dans une fenêtre courte.
- Détection PC/Steam/Epic/GOG conservée, sans connexion automatique aux comptes.

## Vérification

- Deux nouveaux tests reproduisaient les blocages avant correction, puis passent : collection existante et configuration sans jeux avec résumé final.
- 125 tests backend et 56 tests UI passent. Typecheck et build passent.
- Revue : un risque de chevauchement sur petite hauteur corrigé après signalement.
- Vérification visuelle responsive non terminée : deux lectures de l'aperçu ont été bloquées par un délai de l'approbation automatique du navigateur. Aucun contournement utilisé.
