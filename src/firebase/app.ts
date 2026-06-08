/**
 * Init Firebase paresseuse (D8 : Auth + RTDB + Functions + App Check — briques
 * NOUVELLES pour le parc, absentes de mister-puzzle). Une seule initialisation,
 * branche les émulateurs si VITE_USE_EMULATOR=1 (jeu jouable sans projet cloud).
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
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";

const FUNCTIONS_REGION = "europe-west1";
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
let fns: Functions | undefined;

function ensure(): void {
  if (app) return;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
  fns = getFunctions(app, FUNCTIONS_REGION);

  // App Check (anti-abus) — uniquement hors émulateur, si une clé est fournie.
  const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
  if (appCheckKey && !useEmulator) {
    void import("firebase/app-check").then(
      ({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
        initializeAppCheck(app!, {
          provider: new ReCaptchaEnterpriseProvider(appCheckKey),
          isTokenAutoRefreshEnabled: true,
        });
      },
    );
  }

  if (useEmulator) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
    connectFunctionsEmulator(fns, "127.0.0.1", 5001);
  }
}

export function getDb(): Database {
  ensure();
  return db!;
}

export function getFns(): Functions {
  ensure();
  return fns!;
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
