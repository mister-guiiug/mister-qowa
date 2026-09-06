/**
 * Init Firebase paresseuse — mode SPARK : Auth (invité anonyme + Google),
 * Realtime Database (jeu live), Firestore (historique des parties). Branche les
 * émulateurs si VITE_USE_EMULATOR=1.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signOut,
  deleteUser,
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
import { useEmulator } from "./env";
import { createLogger } from "@mister-guiiug/dev-pwa-config/logger";

const log = createLogger("firebase");

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
      log.error(
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

/**
 * L'uid courant SANS en créer un : `null` s'il n'y a pas de session.
 *
 * `ensureAuth` ouvre une session invité quand il n'en trouve pas — c'est ce
 * qu'on veut pour rejoindre une partie, et exactement ce qu'on ne veut pas sur
 * l'écran « Mon compte », où afficher son identifiant créerait le compte qu'on
 * vient regarder (et où « supprimer » en fabriquerait un pour l'effacer).
 * `onAuthStateChanged` répond une fois la persistance relue, sans réseau.
 */
export function peekAuthUid(): Promise<string | null> {
  ensure();
  return new Promise<string | null>((resolve) => {
    const off = onAuthStateChanged(
      auth!,
      (user) => {
        off();
        resolve(user?.uid ?? null);
      },
      () => {
        off();
        resolve(null);
      },
    );
  });
}

/**
 * Ferme la session courante.
 *
 * SUR UN COMPTE ANONYME, CE N'EST PAS NEUTRE : le compte n'est pas supprimé,
 * il devient INJOIGNABLE. Aucun identifiant ne permet d'y revenir — la
 * prochaine visite appelle `signInAnonymously` et obtient un uid NEUF. Les
 * parties archivées sous l'ancien uid restent chez Firebase et ne sont plus
 * lisibles par personne. L'écran « Mon compte » le dit avant d'appeler ceci ;
 * c'est aussi pourquoi la suppression de compte, elle, purge AVANT.
 */
export async function signOutCurrentUser(): Promise<void> {
  ensure();
  await signOut(auth!);
}

/**
 * Supprime le compte Firebase courant. Peut échouer en
 * `auth/requires-recent-login` : voir `lib/account.ts`, qui traite ce cas —
 * et qui appelle donc TOUJOURS la purge des données avant cette fonction.
 */
export async function deleteCurrentUser(): Promise<void> {
  ensure();
  const user = auth!.currentUser;
  if (!user) return;
  await deleteUser(user);
}
