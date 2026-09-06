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
  deleteDoc,
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

/**
 * Efface TOUS les documents Firestore de l'utilisateur, et renvoie combien.
 *
 * DEUX COLLECTIONS, ET LA SECONDE EST DÉLIBÉRÉE. `results` est ce que l'app
 * écrit aujourd'hui (`saveResult` à la fin de chaque partie hébergée) ;
 * `quizzes` est déclarée par `firestore.rules` avec un `ownerUid`, et
 * `quizSchema` porte le champ, mais la bibliothèque vit encore en
 * `localStorage`. On la balaie quand même : le jour où un écran y écrit, la
 * suppression de compte n'aura pas à être re-corrigée, et une requête vide
 * coûte un aller-retour. C'est aussi ce que verrouillent les tests de règles —
 * les deux collections, dans les deux sens.
 *
 * PAS DE `writeBatch` : un lot Firestore plafonne à 500 écritures et échoue en
 * BLOC. Ici, une suppression refusée ne doit pas emporter les autres — mieux
 * vaut un document de moins effacé qu'une purge entièrement perdue.
 * `Promise.all` par collection suffit : le volume est celui d'un seul
 * utilisateur.
 *
 * CE QU'ON NE TOUCHE PAS, ET POURQUOI. Deux traces échappent à cette purge, et
 * l'écran « Mon compte » les annonce (`account.deleteLimit`) plutôt que de
 * promettre un effacement total.
 *
 *   1. LES PARTIES DES AUTRES. Le pseudo et le score d'un JOUEUR figurent dans
 *      le `results` de l'organisateur, dont il n'est pas le `hostUid`. Ouvrir
 *      la suppression à quiconque figure au classement, c'est laisser n'importe
 *      quel joueur effacer la partie — et le classement — de tous les autres.
 *      Les tests de règles figent le refus (« il n'efface PAS celles d'un autre
 *      host ») : c'est un arbitrage, pas un oubli.
 *
 *   2. LA BASE TEMPS RÉEL. Rien n'y survit à effacer : le nœud d'un joueur part
 *      à la déconnexion (`onDisconnect(playerRef).remove()` dans `api.ts`) et
 *      la session entière disparaît avec `closeSession`. Une purge RTDB
 *      n'aurait aucune cible durable — sauf les sessions d'un host qui n'a
 *      jamais fermé sa salle, que les règles lui laissent supprimer lui-même.
 */
export async function deleteMyDocuments(uid: string): Promise<number> {
  const db = getFs();
  const owned = await Promise.all([
    getDocs(query(collection(db, "results"), where("hostUid", "==", uid))),
    getDocs(query(collection(db, "quizzes"), where("ownerUid", "==", uid))),
  ]);
  const refs = owned.flatMap((snap) => snap.docs.map((d) => d.ref));
  await Promise.all(refs.map((ref) => deleteDoc(ref)));
  return refs.length;
}
