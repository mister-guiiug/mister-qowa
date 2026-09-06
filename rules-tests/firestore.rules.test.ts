/**
 * Suite de tests des Security Rules FIRESTORE — verrouille le droit à
 * l'effacement : « chacun efface ses documents, et RIEN d'autre ». Tourne
 * contre l'ÉMULATEUR (npm run test:rules).
 *
 * POURQUOI CETTE SUITE EXISTE. La suppression de compte (`lib/account.ts`)
 * purge Firestore DEPUIS LE NAVIGATEUR : il n'y a pas de Function en mode
 * Spark, donc pas d'Admin SDK pour effacer à la place de l'utilisateur. Ce ne
 * sont pas les règles qui documentent la purge, ce sont elles qui la rendent
 * possible — et qui l'empêchent de déborder. Sans les deux assertions
 * ci-dessous, « efface ses quiz » et « efface ceux d'un autre » seraient le
 * même code.
 *
 * Invariants couverts :
 *  - quizzes : suppression par le propriétaire, refusée à un autre et à l'anonyme ;
 *  - results : suppression par le host désigné, refusée à un autre et à l'anonyme ;
 *  - results : toujours INréinscriptibles (`update` interdit à tous) ;
 *  - results : lecture toujours réservée au host (cloisonnement RGPD, D11) ;
 *  - les REQUÊTES de la purge : `hostUid == moi` passe, sans filtre ou sur un
 *    autre host non — c'est la première opération de `deleteMyDocuments`, et
 *    elle s'autorise autrement qu'une lecture de document.
 */
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

const ALICE = "alice-uid";
const BOB = "bob-uid";

let env: RulesTestEnvironment;

/**
 * LE SEUL ENDROIT OÙ LES DEUX API FIRESTORE SE RENCONTRENT, et la seule
 * conversion de ce fichier.
 *
 * `@firebase/rules-unit-testing` 4.x/5.x rend un Firestore **compat**
 * (`firebase.firestore.Firestore`) là où `doc()`, `getDocs()` et les autres
 * fonctions modulaires déclarent le Firestore **modulaire**. Les deux
 * s'entendent à l'exécution — le SDK déballe le `_delegate` de tout objet
 * compat qu'on lui passe — mais pas au type-check, qui reproche à l'un les
 * `type` et `toJSON` de l'autre. Personne ne l'avait vu tant que ce fichier
 * n'était dans aucun tsconfig ; on ne l'apprend pas en montant le paquet, la
 * 5.x rend la même chose et la 6.x n'existe pas.
 *
 * On convertit donc ici, une fois, plutôt que de disperser un `as` par cas de
 * test — et le reste du fichier ne parle plus que du SDK modulaire.
 */
const fs = (uid: string | null): Firestore =>
  (uid
    ? env.authenticatedContext(uid).firestore()
    : env.unauthenticatedContext().firestore()) as unknown as Firestore;

/** Sème sans règles : un quiz d'ALICE et une partie hébergée par ALICE. */
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await setDoc(doc(db, "quizzes", "quiz-alice"), {
      ownerUid: ALICE,
      title: "Culture générale",
    });
    await setDoc(doc(db, "quizzes", "quiz-bob"), {
      ownerUid: BOB,
      title: "Le quiz de Bob",
    });
    await setDoc(doc(db, "results", "game-alice"), {
      hostUid: ALICE,
      quizTitle: "Culture générale",
      ranking: [{ uid: BOB, pseudo: "Bob", total: 1200 }],
    });
    await setDoc(doc(db, "results", "game-bob"), {
      hostUid: BOB,
      quizTitle: "Le quiz de Bob",
      ranking: [],
    });
  });
}

beforeAll(async () => {
  const hostPort = (
    process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"
  ).split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-mister-qowa",
    firestore: {
      host: hostPort[0],
      port: Number(hostPort[1]),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

afterAll(async () => {
  await env?.cleanup();
});

describe("quizzes (droit à l'effacement)", () => {
  it("un utilisateur efface SES quiz", async () => {
    await assertSucceeds(deleteDoc(doc(fs(ALICE), "quizzes", "quiz-alice")));
  });

  it("il n'efface PAS ceux d'un autre", async () => {
    await assertFails(deleteDoc(doc(fs(ALICE), "quizzes", "quiz-bob")));
    // Et le document de Bob est toujours là pour Bob.
    await assertSucceeds(getDoc(doc(fs(BOB), "quizzes", "quiz-bob")));
  });

  it("un visiteur non connecté n'efface rien", async () => {
    await assertFails(deleteDoc(doc(fs(null), "quizzes", "quiz-alice")));
  });
});

describe("results (droit à l'effacement)", () => {
  it("le host efface SES parties archivées", async () => {
    await assertSucceeds(deleteDoc(doc(fs(ALICE), "results", "game-alice")));
  });

  it("il n'efface PAS celles d'un autre host", async () => {
    await assertFails(deleteDoc(doc(fs(ALICE), "results", "game-bob")));
  });

  it("un visiteur non connecté n'efface rien", async () => {
    await assertFails(deleteDoc(doc(fs(null), "results", "game-alice")));
  });

  it("une archive reste NON modifiable, même par son host", async () => {
    // `delete` s'est ouvert, `update` non : un classement qu'on réécrit après
    // coup n'est plus une archive.
    await assertFails(
      updateDoc(doc(fs(ALICE), "results", "game-alice"), { ranking: [] }),
    );
  });

  it("la lecture reste réservée au host (cloisonnement RGPD)", async () => {
    await assertSucceeds(getDoc(doc(fs(ALICE), "results", "game-alice")));
    // BOB figure au classement de la partie d'ALICE, et ne peut pas la lire.
    await assertFails(getDoc(doc(fs(BOB), "results", "game-alice")));
    await assertFails(getDoc(doc(fs(null), "results", "game-alice")));
  });
});

describe("les REQUÊTES de la purge (deleteMyDocuments)", () => {
  // Une suppression commence par une LISTE, et une liste s'autorise autrement
  // qu'une lecture de document : Firestore n'ouvre pas les documents pour
  // décider, il exige que la requête PROUVE d'elle-même qu'elle ne rapportera
  // que de l'autorisé. Les trois cas ci-dessous sont donc l'invariant réel de
  // `deleteMyDocuments` — sans eux, la suite passerait au vert avec une purge
  // qui échoue dès son premier aller-retour.

  it("le filtre `hostUid == moi` est la condition de la purge", async () => {
    await assertSucceeds(
      getDocs(
        query(collection(fs(ALICE), "results"), where("hostUid", "==", ALICE)),
      ),
    );
  });

  it("lister les results SANS filtre est refusé", async () => {
    // Le refus ne dépend pas de ce que contient la base : même si ALICE était
    // le seul host du monde, la requête ne le prouve pas.
    await assertFails(getDocs(collection(fs(ALICE), "results")));
  });

  it("lister ceux d'un AUTRE host est refusé", async () => {
    await assertFails(
      getDocs(
        query(collection(fs(ALICE), "results"), where("hostUid", "==", BOB)),
      ),
    );
  });

  it("le filtre `ownerUid == moi` liste les quiz à effacer", async () => {
    await assertSucceeds(
      getDocs(
        query(collection(fs(ALICE), "quizzes"), where("ownerUid", "==", ALICE)),
      ),
    );
  });
});

describe("users (profil privé)", () => {
  it("chacun efface SON document, pas celui d'un autre", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      await setDoc(doc(db, "users", ALICE), { pseudo: "Alice" });
      await setDoc(doc(db, "users", BOB), { pseudo: "Bob" });
    });
    await assertFails(deleteDoc(doc(fs(ALICE), "users", BOB)));
    await assertSucceeds(deleteDoc(doc(fs(ALICE), "users", ALICE)));
  });
});
