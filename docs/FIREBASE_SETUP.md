# Setup Firebase — mister-qowa

Le frontend se déploie sur **GitHub Pages** ; le **backend** (Realtime Database + Firestore + Auth) vit dans
un projet **Firebase**. Ce guide part de zéro jusqu'au jeu live.

> Plan requis : **Spark** (gratuit). Il n'y a plus de Cloud Functions depuis le passage en mode
> host-autoritaire : c'est le host qui calcule les scores, et les Security Rules qui l'encadrent. La variante
> à Functions autoritaires (plan Blaze) reste décrite dans [`07-backend.md`](07-backend.md), comme chemin de
> montée en charge.

## 1. Créer le projet

1. [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet** (ex. `mister-qowa`).
2. Activer les services :
   - **Realtime Database** → Créer (région _europe-west1_), démarrer en mode verrouillé (on pousse nos rules).
   - **Firestore** → Créer (même région), mode production.
   - **Authentication** → activer **Anonyme** et **Google**.
   - **Storage** (optionnel MVP, requis V1 pour les médias).

## 2. Config web → `.env.local`

Console → ⚙️ Paramètres du projet → _Vos applications_ → **Web** → enregistrer une app → copier la config.

```bash
cp .env.example .env.local
```

Remplir `.env.local` :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=mister-qowa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mister-qowa
VITE_FIREBASE_DATABASE_URL=https://mister-qowa-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_STORAGE_BUCKET=mister-qowa.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_EMULATOR=0
```

## 3. CLI Firebase + déploiement des règles

```bash
npm i -g firebase-tools
firebase login

# Déployer les règles de sécurité (Realtime Database + Firestore)
firebase deploy --only database,firestore
```

Le dépôt porte déjà `.firebaserc` pour le projet `mister-qowa` ; pour un autre projet, partir de
`.firebaserc.example`. Les règles se testent sur émulateurs avec `npm run test:rules`, que la CI joue
(`.github/workflows/rules.yml`).

## 4. App Check (anti-abus — D7/D8)

La config web est publique par nature : sans App Check, n'importe quel script qui la connaît parle à la
base. Le code est prêt (`src/firebase/app.ts` initialise App Check **avant** la base, dès que la clé est
là). En production, sans clé, l'app tourne quand même, mais elle écrit une erreur dans la console du
navigateur. Il reste des gestes de console, dans cet ordre :

1. Console → **App Check** → enregistrer l'app web avec **reCAPTCHA Enterprise** → copier la **clé de
   site**. Elle est publique : ce n'est pas un secret.
2. La fournir au build de production sous le nom `VITE_FIREBASE_APPCHECK_KEY`, dans `.env.production` ou
   en variable du dépôt passée par `build-env` dans `deploy.yml`, puis redéployer.
3. Vérifier dans la console (App Check → métriques de la Realtime Database) que les requêtes arrivent
   **vérifiées**. Activer l'enforcement avant cela couperait les clients qui n'envoient pas encore de jeton.
4. Seulement ensuite : **Enforce** sur la Realtime Database (et sur Firestore).
5. Facultatif, mais c'est ce qui ferme la porte : `VITE_REQUIRE_APPCHECK=true` au build de production. Un
   build sans clé refuse alors de démarrer, plutôt que de tourner sans protection
   (`src/firebase/env.ts`).

**Émulateurs et CI** : les émulateurs contournent App Check nativement, les tests de règles n'en ont donc
pas besoin. Pour un poste de développement branché sur le projet **cloud** une fois l'enforcement activé,
enregistrer un **jeton de débogage** dans la console App Check.

## 5. CI — déploiement des règles (optionnel)

Le workflow GitHub Pages (`deploy.yml`) ne déploie **que le frontend**. Pour déployer aussi les règles
depuis la CI :

1. Créer un **compte de service** GCP avec le rôle _Firebase Rules Admin_.
2. Stocker sa clé JSON en secret GitHub **`FIREBASE_SERVICE_ACCOUNT`** (un seul nom, cohérent partout).
3. Ajouter un job qui appelle `firebase deploy --only database,firestore` avec ce secret
   (`GOOGLE_APPLICATION_CREDENTIALS`).

> Sinon : déployer les règles à la main (`firebase deploy --only database,firestore`) ; le frontend, lui,
> part automatiquement sur Pages à chaque push `main`.

## 6. Jouer

- **Local sans cloud** : `VITE_USE_EMULATOR=1` + `npm run emulators` + `npm run dev`.
- **Cloud** : `npm run build` déployé sur Pages, règles déployées via `firebase deploy`.

Le quiz de démo est **bundlé** (`shared/seed.ts`) : aucune écriture Firestore n'est requise pour héberger
une première partie. Les quiz créés par les utilisateurs (V1) iront dans la collection `quizzes`.
