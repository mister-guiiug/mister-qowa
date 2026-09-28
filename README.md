# mister-qowa

PWA de **quiz interactif en temps réel** (type Kahoot) — mobile-first, installable, gamifiée.
Membre de la famille `miss-*`/`mister-*` (owner GitHub **mister-guiiug**).

- **Frontend** : React 19 + Vite 8 + Tailwind v4 + Zustand + zod + framer-motion, PWA déployée sur GitHub Pages
  (`https://mister-guiiug.github.io/mister-qowa/`), via `@mister-guiiug/dev-pwa-config`.
- **Backend** : Firebase **Spark (gratuit, sans Cloud Functions)** : **Realtime Database** (état de jeu live),
  **Firestore** (historique des parties hébergées, pseudos des joueurs compris), **Storage** (images des questions,
  lisibles par tous) et **Auth** (invité anonyme, pour l'hôte comme pour les joueurs ; il n'y a pas de connexion
  Google). Autorité côté **host** : le host détient le quiz localement (la bonne réponse et l'explication ne sont
  publiées qu'à la clôture de la question) et calcule les scores ; les **Security Rules** garantissent que seul le
  host écrit l'état/scores, que `/answers` n'est lisible que par le host, et qu'un joueur n'écrit que sa propre
  réponse (`serverTs` forcé), sa fiche et ses réactions. La variante **Cloud Functions autoritaires** (plan Blaze)
  reste documentée dans `docs/07-backend.md` (chemin de montée en charge).
- **Ce qui part vers des tiers** : Sentry (région européenne) démarre à l'ouverture, sans consentement (il signale la
  session et reçoit un rapport à chaque erreur) ; PostHog (nuage européen) ne mesure l'audience qu'après accord dans le
  bandeau ; la génération par IA envoie le sujet ou le texte à Gemini ou à Anthropic, avec la clé de l'utilisateur ;
  les polices sont chargées depuis Google Fonts.

## Statut — 🎮 JOUABLE EN LIGNE → **https://mister-guiiug.github.io/mister-qowa/**

Boucle live complète : héberger un quiz → PIN → joueurs → questions chronométrées (choix multiple, vrai/faux, réponse
libre, sondage) → scoring vitesse+justesse → leaderboard live → podium. Déployé sur Firebase (projet `mister-qowa`,
Spark) ; boucle validée end-to-end (host + joueur, rules + anti-triche) sur le projet réel. `tsc`, les tests unitaires,
les tests des règles et le build (Vite 8/PWA) au vert.

## Démarrer en local

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"   # accès @mister-guiiug sur GitHub Packages
npm install
cp .env.example .env.local                  # remplir la config Firebase (cf. docs/FIREBASE_SETUP.md)
npm run dev                                 # http://localhost:5173
```

`.env.local` peut pointer sur le projet cloud (config web) ou, avec `VITE_USE_EMULATOR=1`, sur les émulateurs
(`npm run emulators` : Auth, RTDB et Firestore). Ouvrir un onglet **Héberger** (host) et un autre **Rejoindre** (joueur).

## Scripts

| Script                                              | Rôle                                              |
| --------------------------------------------------- | ------------------------------------------------- |
| `npm run dev` / `build` / `preview`                 | Vite                                              |
| `npm test`                                          | Vitest (moteur de score, contrats, normalisation) |
| `npm run type-check` / `lint` / `format`            | qualité                                           |
| `npm run emulators`                                 | suite d'émulateurs Firebase                       |
| `firebase deploy --only database,firestore,storage` | déployer les Security Rules                       |

## Conception

Dossier complet dans [`docs/`](docs/) :

- [`docs/DESIGN.md`](docs/DESIGN.md) : dossier complet (9 sections, de 0 à 8).
- [`docs/00-decisions-consolidees.md`](docs/00-decisions-consolidees.md) — **décisions qui font foi** (arbitrage des revues).
- [`docs/REVUES.md`](docs/REVUES.md) — 24 findings des 2 revues adverses.

## Reste à faire

Le dépôt, les Pages, le projet Firebase et les icônes sont en place. Il reste à activer **App Check** en
production : enregistrer l'app dans la console Firebase, fournir la clé de site au build
(`VITE_FIREBASE_APPCHECK_KEY`, dans `.env.production` ou par `build-env`), redéployer, puis activer
l'_enforcement_ sur la Realtime Database et sur Firestore. Tant qu'il ne l'est pas, la base
accepte les requêtes de n'importe quel script qui connaît la config web (publique par nature) ; l'app le
signale d'ailleurs en production par une erreur dans la console du navigateur.

Depuis le passage en mode Spark, il n'y a plus de Cloud Functions : le `enforceAppCheck: true` des `onCall`
qu'annonçait cette section n'a plus d'objet. La marche à suivre est dans
[`docs/FIREBASE_SETUP.md` § 4](docs/FIREBASE_SETUP.md#4-app-check-anti-abus--d7d8).

Périmètre V1/V2 : voir `docs/08-deploiement-roadmap.md`.
