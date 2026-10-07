# Nexus — liste des extensions

État vérifié le 7 octobre 2026. Une case cochée signifie que le périmètre décrit est réalisé. Un module partiel reste décoché.

## Fondations terminées

- [x] Bus de modules et événements de lancement/fin de session.
- [x] Catalogue Extensions, recherche, catégories et présentation console/liquid glass en FR/EN.
- [x] Installation native séparée de Nexus Replay et Nexus Saves depuis les releases Nexus : progression, vérification SHA-256 de l'archive et des fichiers, activation, désactivation et désinstallation.
- [x] Erreur de catalogue visible et vérification relançable immédiatement.
- [x] Conservation des captures et sauvegardes après désinstallation.

## Ta liste complète

| Terminé | Module | Disponible | Reste à faire |
|---|---|---|---|
| ☐ | Nexus Achievements | Cache local Steam, progression disponible, intégration optionnelle SAN et notifications | Synchronisation complète fiable, rareté, Epic/GOG ; validation réelle d'un déblocage en jeu |
| ☐ | Nexus Capture / Replay | Captures PNG, galerie, replay 30 s / 720p / 30 fps, plugin téléchargé séparément | Audio, durées 1/3/5 min, commandes Share/Guide et validation d'une capture réelle en jeu |
| ☐ | Nexus Cloud Saves | Plugin Nexus Saves/Ludusavi, sauvegarde locale, cinq versions, restauration protégée et sauvegarde automatique facultative | Véritable synchronisation cloud/rclone, authentification des services, gestion des conflits et preuve d'envoi |
| ☐ | Nexus Quick Resume Lite | — | Suspension/reprise en RAM, suivi des processus et compatibilité des jeux |
| ☐ | Nexus Game Activity | Sessions, temps de jeu et historique persistants | FPS, CPU/GPU/RAM, températures, consommation et bilans complets |
| ☐ | Nexus Quick Menu | — | Overlay à la manette, volume, microphone, écran, Wi-Fi et commandes de jeu |
| ☐ | Controller Profiles | Navigation générale à la manette | Mapping par jeu, combinaisons, appuis courts/longs/doubles et profils |
| ☐ | How Long To Beat | — | Estimations de durée et comparaison au temps joué |
| ☐ | Can I Run It? | Détection des caractéristiques du PC à l'accueil initial | Prérequis par jeu et comparaison minimum/recommandé |
| ☑ | Game Media | Trailers, choix de vidéo, captures, fonds vidéo facultatifs, diaporama et cache des illustrations | Améliorations continues de la couverture des métadonnées ; un média absent chez le fournisseur reste indisponible |
| ☐ | Discord Presence | — | Rich Presence, minuterie et illustrations |
| ☐ | Nexus Remote | — | Appairage sécurisé du téléphone, bibliothèque et commandes à distance |
| ☐ | Mods Hub | — | Catalogue, installation/mise à jour et compatibilité des mods |
| ☐ | Deals / Free Games | — | Offres vérifiées, jeux gratuits et filtres |
| ☐ | Game Mode | — | Profils de performance réversibles et restauration après le jeu |

- [ ] Performance Overlay : sous-module encore à développer (FPS/frametimes, CPU/GPU, mémoire et températures).

## Tests de téléchargement réels

Les tests utilisent des profils isolés dans `frontend/artifacts/qa/plugin-downloads`. Aucun jeu, sauvegarde personnelle ou compte n'a été modifié ; aucun binaire téléchargé n'a été exécuté.

| Paquet | Téléchargement | Sur disque | Résultat |
|---|---:|---:|---|
| Nexus Replay 0.1.0 | 8 942 365 octets | 21 122 087 octets | Téléchargé, archive et fichiers vérifiés, extrait ; état `ready` |
| Nexus Saves 0.1.1 | 2 442 141 octets | 5 825 224 octets | Téléchargé, archive et fichiers vérifiés, extrait ; état `ready` |
| SAN 1.9.47 | 162 166 532 octets annoncés | Non vérifié | Release officielle et début de transfert HTTP 200 confirmés ; téléchargement complet interrompu au délai de 5 min, installation/exécution non testées |

L'aperçu navigateur affiche la disponibilité et la taille. L'installation avec progression et activation appartient à l'application Windows ; elle ne propose pas de ZIP à installer à la main.

## Ordre proposé pour la suite

1. Valider Replay et SAN sur un vrai jeu, puis terminer les commandes de capture et l'audio.
2. Compléter Activity et le premier Quick Menu avec des valeurs réellement mesurées.
3. Ajouter la synchronisation cloud aux sauvegardes locales.
4. Ajouter les profils de manette, puis Quick Resume pour les jeux compatibles.
5. HLTB/Discord, compatibilité PC, puis Remote/Mods/Deals/Game Mode.

Ces lignes sont une feuille de route : elles ne représentent pas des plugins déjà publiés ou installables.
