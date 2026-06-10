/**
 * Frontière Firestore UNIQUE, chargée à la demande (`await import("./fs")`) :
 * Firestore ne sert qu'à l'historique (archive endGame + lecture History),
 * il sort donc du chemin critique de démarrage et du chunk Firebase commun.
 */
import { getApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { ensureAuth } from "./app";

let fs: Firestore | undefined;

function getFs(): Firestore {
  if (!fs) {
    // Cache offline (IndexedDB) : historique consultable hors-ligne.
    fs = initializeFirestore(getApp(), { localCache: persistentLocalCache() });
    if (import.meta.env.VITE_USE_EMULATOR === "1") {
      connectFirestoreEmulator(fs, "127.0.0.1", 8080);
    }
  }
  return fs;
}

/** Archive un résultat de partie (best-effort, appelé par endGame). */
export async function saveResult(
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(getFs(), "results", sessionId), data);
}

/** Résultats des parties hébergées par l'utilisateur courant. */
export async function fetchResults<T>(): Promise<(T & { id: string })[]> {
  const user = await ensureAuth();
  const snap = await getDocs(
    query(collection(getFs(), "results"), where("hostUid", "==", user.uid)),
  );
  const rows: (T & { id: string })[] = [];
  snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as T) }));
  return rows;
}
