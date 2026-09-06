/**
 * Le compte, et son effacement. Frontière PURE : aucun import de `firebase/*`
 * ici, tout ce qui touche au SDK arrive par injection (`AccountDeps`) ou par
 * `import()` dans `deleteMyAccount`. C'est ce qui rend l'ordre des opérations
 * testable sans émulateur.
 *
 * TOUS LES COMPTES DE CETTE APP SONT ANONYMES. `ensureAuth()` appelle
 * `signInAnonymously` et rien d'autre : il n'y a pas de connexion Google, pas
 * de mot de passe, pas d'e-mail (le commentaire d'en-tête de `firebase/app.ts`
 * annonce « invité anonyme + Google » — le second n'a jamais été écrit). Deux
 * conséquences dictent tout ce fichier.
 *
 *   1. UN COMPTE ANONYME EST QUAND MÊME UN COMPTE. Son uid est persistant (le
 *      SDK le garde en IndexedDB), il survit des mois, et il est inscrit dans
 *      chaque document `results` en tant que `hostUid` — à côté des pseudos
 *      des joueurs. C'est un identifiant rattaché à des données personnelles :
 *      il relève du droit à l'effacement au même titre qu'un compte Google.
 *      On ne l'exempte donc pas.
 *
 *   2. UN COMPTE ANONYME NE PEUT PAS SE RÉ-AUTHENTIFIER. Firebase refuse
 *      `deleteUser` quand le jeton est trop vieux (`auth/requires-recent-login`)
 *      et attend qu'on présente à nouveau une identité. Un invité n'en a
 *      aucune à présenter : `reauthenticateWithCredential` demande un
 *      justificatif qui n'existe pas, et se reconnecter en anonyme fabrique un
 *      uid NEUF, sans accès aux données de l'ancien. Il n'y a pas de voie de
 *      recours.
 *
 * D'OÙ L'ORDRE : LES DONNÉES D'ABORD, LE COMPTE ENSUITE. Purger Firestore
 * demande seulement un jeton VALIDE (les règles lisent `request.auth.uid`) ;
 * supprimer le compte demande un jeton RÉCENT. Si on supprimait le compte en
 * premier et qu'il partait, la purge suivante n'aurait plus d'auth et les
 * documents resteraient là pour toujours — orphelins, avec les pseudos des
 * joueurs dedans. Dans l'autre sens, le pire cas laisse un identifiant invité
 * vide : c'est ce que dit `"data-erased-only"`, et l'écran l'annonce tel quel
 * plutôt que d'afficher un code d'erreur brut.
 */
import type { Key } from "../i18n";
import { useGameStore } from "../store/gameStore";
import { useQuizLibrary } from "../store/quizStore";
import { useProfile } from "../store/profileStore";
import { useAiSettings } from "../store/settingsStore";
import { emptyProfile } from "./profile";

/**
 * Le préfixe de TOUTES les clés locales de l'app (`mister-qowa:quizzes`,
 * `:profile`, `:session`, `:ai-settings`, `:draft`, `:install-dismissed`…).
 * On balaie par préfixe et non par liste : une liste vieillit en silence à la
 * première clé ajoutée ailleurs, et c'est précisément le genre d'oubli qui
 * laisse traîner une clé d'API ou un pseudo.
 */
export const LOCAL_PREFIX = "mister-qowa:";

/**
 * La seule clé conservée : la langue choisie. Ce n'est pas une donnée du
 * compte — elle ne dit rien de qui on est — et l'effacer renverrait au
 * français un utilisateur qui vient de lire l'avertissement en espagnol.
 */
export const KEPT_LOCAL_KEYS = [`${LOCAL_PREFIX}lang`];

/** Efface les données locales de l'app. Renvoie les clés retirées. */
export function purgeLocalData(storage?: Storage): string[] {
  const store = storage ?? globalThis.localStorage;
  if (!store) return [];
  const doomed: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key && key.startsWith(LOCAL_PREFIX) && !KEPT_LOCAL_KEYS.includes(key)) {
      doomed.push(key);
    }
  }
  // Retrait APRÈS le parcours : supprimer pendant décale les index et saute
  // une clé sur deux.
  for (const key of doomed) store.removeItem(key);
  return doomed;
}

/**
 * Vide les magasins EN MÉMOIRE, avant de toucher au stockage.
 *
 * SANS CETTE ÉTAPE, LA PURGE NE TIENT PAS. `zustand/persist` réécrit sa clé à
 * chaque `set()` depuis l'état qu'il a en mémoire : effacer `localStorage` en
 * laissant la bibliothèque de quiz dans le magasin, c'est la voir revenir
 * intacte au premier changement d'écran qui touche à l'état. On remet donc les
 * magasins à zéro D'ABORD, on efface ENSUITE — dans cet ordre, une éventuelle
 * réécriture ne peut plus contenir que du vide.
 *
 * C'est aussi ce que l'utilisateur voit : profil, parties et quiz disparaissent
 * de l'accueil au moment où il supprime, sans rechargement à demander.
 */
export function resetLocalStores(): void {
  useGameStore.getState().reset();
  useQuizLibrary.setState({ quizzes: [] });
  useProfile.setState({ profile: emptyProfile() });
  useAiSettings.setState({ provider: "gemini", keys: {}, models: {} });
}

/**
 * Firebase refuse-t-il la suppression faute de connexion récente ? Le SDK pose
 * le code sur l'erreur (`FirebaseError.code`), pas sur son message : on lit le
 * code, et on tolère aussi le message pour les doubles de test.
 */
export function isRecentLoginRequired(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: unknown }).code;
  if (typeof code === "string") return code === "auth/requires-recent-login";
  const message = (e as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    message.includes("auth/requires-recent-login")
  );
}

/** Ce qui a été effacé, et jusqu'où on est allé. */
export interface DeletionReport {
  /**
   * `"deleted"` : les données ET le compte sont partis.
   * `"data-erased-only"` : les données sont parties, le compte reste — Firebase
   * a exigé une connexion récente, qu'un invité ne peut pas fournir.
   */
  outcome: "deleted" | "data-erased-only";
  /** Documents Firestore supprimés (résultats + quiz). */
  remoteDocs: number;
  /** Clés locales retirées. */
  localKeys: number;
}

export interface AccountDeps {
  /** Supprime les documents Firestore de l'utilisateur ; renvoie leur nombre. */
  purgeRemote: () => Promise<number>;
  /** Efface les données locales ; renvoie les clés retirées. */
  purgeLocal: () => string[];
  /** `deleteUser(auth.currentUser)` du SDK. */
  deleteAccount: () => Promise<void>;
}

/**
 * L'effacement, dans l'ordre qui survit à un refus de Firebase.
 *
 * Seul `auth/requires-recent-login` est rattrapé, et il ne devient pas une
 * erreur : les données SONT parties, l'utilisateur a obtenu l'essentiel de ce
 * qu'il demandait. Toute autre erreur remonte — une purge Firestore qui échoue
 * ne doit surtout pas passer pour une réussite.
 */
export async function runAccountDeletion(
  deps: AccountDeps,
): Promise<DeletionReport> {
  const remoteDocs = await deps.purgeRemote();
  const localKeys = deps.purgeLocal().length;
  try {
    await deps.deleteAccount();
  } catch (e) {
    if (!isRecentLoginRequired(e)) throw e;
    return { outcome: "data-erased-only", remoteDocs, localKeys };
  }
  return { outcome: "deleted", remoteDocs, localKeys };
}

/** La clé i18n du message final, selon l'issue. */
export function outcomeMessageKey(outcome: DeletionReport["outcome"]): Key {
  return outcome === "deleted"
    ? "account.deleteDone"
    : "account.deleteDoneNoAccount";
}

/** Remise à zéro mémoire PUIS stockage — l'ordre compte, voir plus haut. */
function purgeLocal(): string[] {
  resetLocalStores();
  return purgeLocalData();
}

/**
 * Le câblage réel : Firestore et Auth arrivent par `import()`, donc hors du
 * chunk d'entrée — cet écran est déjà chargé à la demande, il n'y a aucune
 * raison qu'il pèse sur le démarrage.
 *
 * `peekAuthUid` et non `ensureAuth` : demander le compte courant ne doit pas en
 * FABRIQUER un. Sans compte, il n'y a que le local à effacer, et rien à
 * demander à Firebase — surtout pas de créer un invité pour le supprimer dans
 * la foulée.
 */
export async function deleteMyAccount(): Promise<DeletionReport> {
  const { peekAuthUid, deleteCurrentUser } = await import("../firebase/app");
  const uid = await peekAuthUid();
  if (!uid) {
    return {
      outcome: "deleted",
      remoteDocs: 0,
      localKeys: purgeLocal().length,
    };
  }
  const { deleteMyDocuments } = await import("../firebase/fs");
  return runAccountDeletion({
    purgeRemote: () => deleteMyDocuments(uid),
    purgeLocal,
    deleteAccount: () => deleteCurrentUser(),
  });
}
