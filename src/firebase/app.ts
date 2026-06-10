/**
 * Init Firebase paresseuse — mode SPARK : Auth (invité anonyme + Google),
 * Realtime Database (jeu live), Firestore (historique des parties). Branche les
 * émulateurs si VITE_USE_EMULATOR=1.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  connectAuthEmulator,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getDatabase,
  connectDatabaseEmulator,
  type Database,
} from "firebase/database";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const useEmulator = import.meta.env.VITE_USE_EMULATOR === "1";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Database | undefined;

/**
 * App Check AVANT toute autre init Firebase : sinon les premières requêtes
 * RTDB/Firestore partent sans jeton et passent à travers une enforcement
 * serveur. En prod, l'absence de clé est un trou de sécurité → on alerte fort.
 */
function initAppCheck(application: FirebaseApp): void {
  if (useEmulator) return;
  const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
  if (!appCheckKey) {
    if (import.meta.env.PROD) {
      console.warn(
        "[Mister Qowa] App Check non configuré (VITE_FIREBASE_APPCHECK_KEY absente) : " +
          "la production n'est PAS protégée contre les bots. Activez App Check dans la " +
          "console Firebase (RTDB + Firestore → Enforce) et fournissez la clé reCAPTCHA Enterprise.",
      );
    }
    return;
  }
  initializeAppCheck(application, {
    provider: new ReCaptchaEnterpriseProvider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}

function ensure(): void {
  if (app) return;
  app = initializeApp(firebaseConfig);
  initAppCheck(app); // doit précéder getDatabase (et l'init Firestore lazy)
  auth = getAuth(app);
  db = getDatabase(app);
  // Firestore (historique) vit dans ./fs.ts, importé à la demande.

  if (useEmulator) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
  }
}

export function getDb(): Database {
  ensure();
  return db!;
}

export function getAuthInstance(): Auth {
  ensure();
  return auth!;
}

/** Garantit une session Auth (invité anonyme) et renvoie le User. */
export function ensureAuth(): Promise<User> {
  ensure();
  const a = auth!;
  return new Promise<User>((resolve, reject) => {
    const off = onAuthStateChanged(
      a,
      (user) => {
        if (user) {
          off();
          resolve(user);
        } else {
          signInAnonymously(a).catch((err) => {
            off();
            reject(err instanceof Error ? err : new Error(String(err)));
          });
        }
      },
      (err) => {
        off();
        reject(err);
      },
    );
  });
}
