# mister-qowa

PWA de **quiz interactif en temps réel** (type Kahoot) — mobile-first, installable, gamifiée.
Membre de la famille `miss-*`/`mister-*` (owner GitHub **mister-guiiug**).

- **Frontend** : React 19 + Vite 8 + Tailwind v4 + Zustand + zod + framer-motion, PWA déployée sur GitHub Pages
  (`https://mister-guiiug.github.io/mister-qowa/`), via `@mister-guiiug/dev-pwa-config`.
- **Backend** : Firebase **Spark (gratuit, sans Cloud Functions)** — **Realtime Database** (état de jeu live) +
  **Auth** (invité anonyme + Google host). Autorité côté **host** : le host détient le quiz localement (réponses
  jamais publiées) et calcule les scores ; les **Security Rules** garantissent que seul le host écrit l'état/scores,
  que `/answers` n'est lisible que par le host, et qu'un joueur n'écrit que sa réponse (`serverTs` forcé). La variante
  **Cloud Functions autoritaires** (plan Blaze) reste documentée dans `docs/07-backend.md` (chemin de montée en charge).

## Statut — 🎮 JOUABLE EN LIGNE → **https://mister-guiiug.github.io/mister-qowa/**

Boucle live complète : héberger un quiz → PIN → joueurs → questions chronométrées (QCM + vrai/faux) →
scoring vitesse+justesse → leaderboard live → podium. Déployé sur Firebase (projet `mister-qowa`, Spark) ;
boucle validée end-to-end (host + joueur, rules + anti-triche) sur le projet réel. `tsc` + 18 tests + build (Vite 8/PWA) au vert.

## Démarrer en local

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"   # accès @mister-guiiug sur GitHub Packages
npm install
cp .env.example .env.local                  # remplir la config Firebase (cf. docs/FIREBASE_SETUP.md)
npm run dev                                 # http://localhost:5173
```

`.env.local` peut pointer sur le projet cloud (config web) ou, avec `VITE_USE_EMULATOR=1`, sur les émulateurs
(`npm run emulators` — Auth + RTDB). Ouvrir un onglet **Héberger** (host) et un autre **Rejoindre** (joueur).

## Scripts

| Script                                      | Rôle                                              |
| ------------------------------------------- | ------------------------------------------------- |
| `npm run dev` / `build` / `preview`         | Vite                                              |
| `npm test`                                  | Vitest (moteur de score, contrats, normalisation) |
| `npm run type-check` / `lint` / `format`    | qualité                                           |
| `npm run emulators`                         | suite d'émulateurs Firebase                       |
| `firebase deploy --only database,firestore` | déployer les Security Rules                       |

## Conception

Dossier complet dans [`docs/`](docs/) :

- [`docs/DESIGN.md`](docs/DESIGN.md) — dossier complet (8 sections).
- [`docs/00-decisions-consolidees.md`](docs/00-decisions-consolidees.md) — **décisions qui font foi** (arbitrage des revues).
- [`docs/REVUES.md`](docs/REVUES.md) — 24 findings des 2 revues adverses.

## Reste à faire

Créer le repo GitHub + Pages, projet Firebase + `.env.local`, icônes PNG, activer App Check en prod
(`enforceAppCheck: true`). Périmètre V1/V2 : voir `docs/08-deploiement-roadmap.md`.
