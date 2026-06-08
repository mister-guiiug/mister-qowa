# Setup Firebase — mister-qowa

Le frontend se déploie sur **GitHub Pages** ; le **backend** (RTDB + Firestore + Auth + Functions) vit dans
un projet **Firebase**. Ce guide part de zéro jusqu'au jeu live.

> Plan requis : **Blaze** (pay-as-you-go) — obligatoire pour déployer des Cloud Functions. Reste quasi gratuit
> à faible trafic (free tier inclus), mais une carte est exigée.

## 1. Créer le projet

1. [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet** (ex. `mister-qowa`).
2. Activer les services :
   - **Realtime Database** → Créer (région _europe-west1_), démarrer en mode verrouillé (on pousse nos rules).
   - **Firestore** → Créer (même région), mode production.
   - **Authentication** → activer **Anonyme** et **Google**.
   - **Storage** (optionnel MVP, requis V1 pour les médias).
   - Passer le projet en **Blaze** (Paramètres → Utilisation et facturation).

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

## 3. CLI Firebase + déploiement

```bash
npm i -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc          # puis remplacer "mister-qowa" par l'ID réel
cd functions && npm install && cd ..

# Déployer les règles de sécurité + les Functions autoritaires
firebase deploy --only database,firestore,functions
```

Les **Cloud Functions** sont en région `europe-west1` (cf. `functions/src/index.ts` `setGlobalOptions`).

## 4. App Check (anti-abus — D7/D8)

Au MVP, `enforceAppCheck: false` dans `functions/src/index.ts` (jouable en émulateur/CI). **En production** :

1. Console → **App Check** → enregistrer l'app web avec **reCAPTCHA Enterprise** → copier la clé de site
   dans `VITE_FIREBASE_APPCHECK_KEY` (`.env.local`).
2. Passer chaque `onCall(opts, …)` à `opts = { enforceAppCheck: true }` puis redéployer.
3. Activer l'_enforcement_ App Check sur RTDB / Firestore / Functions dans la console.
4. **Émulateurs & CI** : App Check strict rejette les tests. Générer un **debug token**
   (`FIREBASE_APPCHECK_DEBUG_TOKEN`) et l'injecter en variable d'env locale / secret CI ; les émulateurs
   contournent App Check nativement.

## 5. CI — déploiement des Functions (optionnel)

Le workflow GitHub Pages (`deploy.yml`) ne déploie **que le frontend**. Pour déployer aussi les
rules/Functions depuis la CI :

1. Créer un **compte de service** GCP avec les rôles : _Firebase Rules Admin_, _Cloud Functions Admin_,
   _Cloud Build Editor_, _Service Account User_, _Artifact Registry Writer_.
2. Stocker sa clé JSON en secret GitHub **`FIREBASE_SERVICE_ACCOUNT`** (un seul nom, cohérent partout).
3. Ajouter un job qui appelle `firebase deploy --only database,firestore,functions` avec ce secret
   (`GOOGLE_APPLICATION_CREDENTIALS`).

> Sinon : déployer les Functions à la main (`firebase deploy --only functions`) ; le frontend, lui, part
> automatiquement sur Pages à chaque push `main`.

## 6. Jouer

- **Local sans cloud** : `VITE_USE_EMULATOR=1` + `npm run emulators` + `npm run dev`.
- **Cloud** : `npm run build` déployé sur Pages, Functions/rules déployées via `firebase deploy`.

Le quiz de démo est **bundlé** (`shared/seed.ts`) : aucune écriture Firestore n'est requise pour héberger
une première partie. Les quiz créés par les utilisateurs (V1) iront dans la collection `quizzes`.
