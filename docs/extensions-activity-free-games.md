# Nexus Activity et Jeux gratuits

Deux modules légers inclus dans Nexus, accessibles depuis Extensions. Les moteurs Replay/Saves restent des téléchargements séparés.

## Activity

L'API desktop retourne un résumé du journal local : somme des durées mesurées pour les sessions terminées, nombre de ces sessions et les 50 dernières sessions de tous les jeux. Le résumé porte sur le journal conservé (jusqu'à 2 000 sessions), avec les heures Steam séparées. Les sessions en cours ou interrompues n'ont pas de durée inventée. Un journal illisible renvoie indisponible, sans statistiques à zéro.

La fenêtre se met à jour sur les événements ActivityChanged. Elle n'est pas simulée dans le navigateur. FPS, températures et télémétrie restent à développer.

## Jeux gratuits

- Source : [API officielle GamerPower](https://www.gamerpower.com/api-read), sans clé et avec attribution visible.
- Liste PC/Steam/Epic/GOG/DRM-Free, type Game uniquement ; chargement au clic, aucune requête à l'ouverture du catalogue Extensions.
- Requête fixe côté backend, délai de 15 s, réponse limitée à 2 Mo, liens HTTPS restreints à GamerPower et ouverture desktop par ID d'offre validé.
- Cache mémoire de 10 minutes et coalescence des appels simultanés. En cas d'échec, les dernières offres en mémoire sont explicitement signalées comme conservées. Pas de cache persistant après redémarrage.
- L'heure fournie dans end_date est préservée. Les dates sans décalage sont normalisées en UTC (convention explicite du module ; la page officielle ne documente pas le fuseau). Aucun compte à rebours ni promesse de disponibilité exacte n'est affiché ; la page du fournisseur confirme les conditions et la disponibilité.
- Le module ne réclame pas l'offre, ne connecte aucun compte et n'installe aucun jeu.

## Vérification

- Tests des totaux mesurés, journal indisponible, requêtes à la demande, déduplication, liens refusés, cache hors ligne et expiration à l'heure fournie.
- Tests UI : aucune lecture avant ouverture ; ouverture d'une offre par ID dans le desktop ; indisponibilité distincte de zéro heures.
- Test réel du service : 13 offres PC validées le 7 octobre 2026. La liste évolue avec le fournisseur.
- Fenêtre d'offres et catalogue confirmés dans l'aperçu, avec capture visuelle de la fenêtre glass. Le tableau d'activité desktop est vérifié avec données de test, sans nouvelle session de jeu réel.
