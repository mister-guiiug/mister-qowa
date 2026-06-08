# mister-qowa

PWA de **quiz interactif en temps réel** (type Kahoot) — mobile-first, installable, gamifiée.
Membre de la famille `miss-*`/`mister-*` (owner GitHub **mister-guiiug**).

- **Frontend** : React 19 + Vite 8 + Tailwind v4 + Zustand + zod + framer-motion, PWA déployée sur GitHub Pages
  (`https://mister-guiiug.github.io/mister-qowa/`), via `@mister-guiiug/dev-wpa-config`.
- **Backend** : Firebase serverless — **Realtime Database** (état de jeu live), **Firestore** (durable + analytics),
  **Auth** (invité anonyme + Google host), **Cloud Functions** (scoring autoritaire, PIN, anti-triche).

## Statut — MVP construit ✅

Boucle live complète : héberger un quiz → PIN → joueurs → questions chronométrées (QCM + vrai/faux) →
scoring vitesse+justesse → leaderboard live → podium. `tsc` + 18 tests + build (Vite 8/PWA) + build Functions vérifiés au vert.

## Démarrer en local (émulateurs Firebase, sans projet cloud)

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"   # accès @mister-guiiug sur GitHub Packages
npm install
cp .env.example .env.local                  # mettre VITE_USE_EMULATOR=1
(cd functions && npm install)
npm run emulators                           # Auth + RTDB + Firestore + Functions
npm run dev                                 # http://localhost:5173
```

Ouvrir un onglet **Héberger** (écran host) et un autre **Rejoindre** (joueur) avec le PIN affiché.

## Scripts

| Script                                                | Rôle                                              |
| ----------------------------------------------------- | ------------------------------------------------- |
| `npm run dev` / `build` / `preview`                   | Vite                                              |
| `npm test`                                            | Vitest (moteur de score, contrats, normalisation) |
| `npm run type-check` / `lint` / `format`              | qualité                                           |
| `npm run emulators`                                   | suite d'émulateurs Firebase                       |
| `firebase deploy --only database,firestore,functions` | déployer rules + Functions                        |

## Conception

Dossier complet dans [`docs/`](docs/) :

- [`docs/DESIGN.md`](docs/DESIGN.md) — dossier complet (8 sections).
- [`docs/00-decisions-consolidees.md`](docs/00-decisions-consolidees.md) — **décisions qui font foi** (arbitrage des revues).
- [`docs/REVUES.md`](docs/REVUES.md) — 24 findings des 2 revues adverses.

## Reste à faire

Créer le repo GitHub + Pages, projet Firebase + `.env.local`, icônes PNG, activer App Check en prod
(`enforceAppCheck: true`). Périmètre V1/V2 : voir `docs/08-deploiement-roadmap.md`.
