/**
 * Suite de tests des Security Rules RTDB — verrouille le modèle anti-triche
 * Spark host-authoritative. Tourne contre l'ÉMULATEUR (npm run test:rules).
 *
 * Invariants couverts :
 *  - pins : lecture authentifiée seulement, pas d'écrasement, libération par le host ;
 *  - players : un joueur n'écrit que SON nœud, forme validée, banni = rejeté ;
 *  - nœuds host (state/current/scores/reveal/leaderboard) : host uniquement,
 *    state borné à la machine à états, scores de forme {total, streak[, eliminated]} ;
 *  - answers : 1 écriture par joueur, fenêtre temporelle, pause bloquante,
 *    lecture host-only, purge host (re-poser/revanche) ;
 *  - reveal : `correct`/`explanation` publics, reveal par joueur cloisonné ;
 *  - session : suppression intégrale par le host uniquement.
 */
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, set, get, update, serverTimestamp } from "firebase/database";
import { shardOf } from "@shared/gameState";

const HOST = "host-uid";
const ALICE = "alice-uid";
const BOB = "bob-uid";

let env: RulesTestEnvironment;

const db = (uid: string | null) =>
  uid
    ? env.authenticatedContext(uid).database()
    : env.unauthenticatedContext().database();

/** Seed sans rules : une session LOBBY appartenant à HOST. */
async function seedSession(sid: string, extraMeta: object = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.database();
    await set(ref(d, `sessions/${sid}/meta`), {
      hostUid: HOST,
      quizId: "quiz1",
      pin: "12345678",
      createdAt: Date.now(),
      totalQuestions: 5,
      ...extraMeta,
    });
    await set(ref(d, `sessions/${sid}/state`), "LOBBY");
  });
}

/** Passe la session en QUESTION_ACTIVE avec une fenêtre de réponse ouverte. */
async function activateQuestion(sid: string, qid = "q1") {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.database();
    await set(ref(d, `sessions/${sid}/current`), {
      questionId: qid,
      index: 0,
      total: 5,
      type: "multiple_choice",
      prompt: "?",
      timeLimitMs: 20_000,
      scored: true,
      activatedAt: Date.now() - 1_000,
    });
    await set(ref(d, `sessions/${sid}/state`), "QUESTION_ACTIVE");
  });
}

const answerPath = (sid: string, qid: string, uid: string) =>
  `sessions/${sid}/answers/${qid}/${shardOf(uid)}/${uid}`;

const validAnswer = () => ({ choice: "a", serverTs: serverTimestamp() });

beforeAll(async () => {
  const hostPort = (
    process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? "127.0.0.1:9000"
  ).split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-mister-qowa",
    database: {
      host: hostPort[0],
      port: Number(hostPort[1]),
      rules: readFileSync("database.rules.json", "utf8"),
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe("pins", () => {
  it("lecture refusée sans auth, autorisée avec auth", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), "pins/00000001"), "sess-pin-read"),
    );
    await assertFails(get(ref(db(null), "pins/00000001")));
    await assertSucceeds(get(ref(db(ALICE), "pins/00000001")));
  });

  it("création OK mais écrasement refusé", async () => {
    // L'alias ne peut être créé que pour une session dont on est le host.
    await seedSession("sess-a");
    await assertSucceeds(set(ref(db(HOST), "pins/00000002"), "sess-a"));
    await assertFails(set(ref(db(ALICE), "pins/00000002"), "sess-b"));
  });

  it("PIN non conforme (pas 8 chiffres) refusé", async () => {
    await seedSession("sess-pin-fmt");
    await assertFails(set(ref(db(HOST), "pins/123"), "sess-pin-fmt"));
    await assertFails(set(ref(db(HOST), "pins/abcdefgh"), "sess-pin-fmt"));
  });

  it("alias vers une session que l'on ne possède pas refusé", async () => {
    await seedSession("sess-owned-by-host"); // meta/hostUid = HOST
    await assertFails(
      set(ref(db(ALICE), "pins/00000007"), "sess-owned-by-host"),
    );
    await assertSucceeds(
      set(ref(db(HOST), "pins/00000007"), "sess-owned-by-host"),
    );
  });

  it("libération par le host de la session, pas par un joueur", async () => {
    await seedSession("sess-pin-del");
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), "pins/00000003"), "sess-pin-del"),
    );
    await assertFails(set(ref(db(ALICE), "pins/00000003"), null));
    await assertSucceeds(set(ref(db(HOST), "pins/00000003"), null));
  });
});

describe("players", () => {
  it("un joueur écrit SON nœud (avec avatar), pas celui d'un autre", async () => {
    await seedSession("s-players");
    await assertSucceeds(
      set(ref(db(ALICE), `sessions/s-players/players/${ALICE}`), {
        pseudo: "Alice",
        joinedAt: Date.now(),
        avatar: "🦊",
      }),
    );
    await assertFails(
      set(ref(db(ALICE), `sessions/s-players/players/${BOB}`), {
        pseudo: "Imposteur",
        joinedAt: Date.now(),
      }),
    );
  });

  it("champ inconnu et pseudo trop long rejetés", async () => {
    await seedSession("s-players-shape");
    await assertFails(
      set(ref(db(ALICE), `sessions/s-players-shape/players/${ALICE}`), {
        pseudo: "Alice",
        joinedAt: Date.now(),
        isAdmin: true,
      }),
    );
    await assertFails(
      set(ref(db(ALICE), `sessions/s-players-shape/players/${ALICE}`), {
        pseudo: "x".repeat(30),
        joinedAt: Date.now(),
      }),
    );
  });

  it("kick + ban : le host retire le joueur, le banni ne peut pas revenir", async () => {
    await seedSession("s-kick");
    await set(ref(db(ALICE), `sessions/s-kick/players/${ALICE}`), {
      pseudo: "Alice",
      joinedAt: Date.now(),
    });
    // Kick atomique : suppression + ban (écriture host).
    await assertSucceeds(
      update(ref(db(HOST)), {
        [`sessions/s-kick/players/${ALICE}`]: null,
        [`sessions/s-kick/meta/banned/${ALICE}`]: true,
      }),
    );
    await assertFails(
      set(ref(db(ALICE), `sessions/s-kick/players/${ALICE}`), {
        pseudo: "Alice",
        joinedAt: Date.now(),
      }),
    );
  });
});

describe("nœuds host (state, scores, leaderboard)", () => {
  it("un joueur ne peut écrire ni state, ni scores, ni leaderboard", async () => {
    await seedSession("s-host-only");
    await assertFails(
      set(ref(db(ALICE), "sessions/s-host-only/state"), "PODIUM"),
    );
    await assertFails(
      set(ref(db(ALICE), `sessions/s-host-only/scores/${ALICE}`), {
        total: 99999,
        streak: 9,
      }),
    );
    await assertFails(
      set(ref(db(ALICE), "sessions/s-host-only/leaderboard/top"), []),
    );
  });

  it("state borné à la machine à états", async () => {
    await seedSession("s-state");
    await assertSucceeds(
      set(ref(db(HOST), "sessions/s-state/state"), "QUESTION_ACTIVE"),
    );
    await assertFails(set(ref(db(HOST), "sessions/s-state/state"), "HACKED"));
  });

  it("scores : forme {total, streak[, eliminated]} validée", async () => {
    await seedSession("s-scores");
    await assertSucceeds(
      set(ref(db(HOST), `sessions/s-scores/scores/${ALICE}`), {
        total: 1200,
        streak: 2,
      }),
    );
    await assertSucceeds(
      set(ref(db(HOST), `sessions/s-scores/scores/${ALICE}`), {
        total: 1200,
        streak: 0,
        eliminated: true,
      }),
    );
    await assertFails(
      set(ref(db(HOST), `sessions/s-scores/scores/${ALICE}`), {
        total: "beaucoup",
        streak: 0,
      }),
    );
    await assertFails(
      set(ref(db(HOST), `sessions/s-scores/scores/${ALICE}`), {
        total: 100,
        streak: 0,
        cheat: true,
      }),
    );
  });
});

describe("answers (anti-triche)", () => {
  it("le joueur écrit SA réponse une seule fois, pendant la fenêtre", async () => {
    await seedSession("s-ans");
    await activateQuestion("s-ans");
    await assertSucceeds(
      set(ref(db(ALICE), answerPath("s-ans", "q1", ALICE)), validAnswer()),
    );
    // Re-soumission refusée (!data.exists()).
    await assertFails(
      set(ref(db(ALICE), answerPath("s-ans", "q1", ALICE)), validAnswer()),
    );
    // Réponse au nom d'un autre refusée.
    await assertFails(
      set(ref(db(ALICE), answerPath("s-ans", "q1", BOB)), validAnswer()),
    );
  });

  it("réponse refusée hors QUESTION_ACTIVE", async () => {
    await seedSession("s-ans-closed");
    await activateQuestion("s-ans-closed");
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), "sessions/s-ans-closed/state"), "LEADERBOARD"),
    );
    await assertFails(
      set(
        ref(db(ALICE), answerPath("s-ans-closed", "q1", ALICE)),
        validAnswer(),
      ),
    );
  });

  it("réponse refusée pendant la PAUSE", async () => {
    await seedSession("s-ans-paused");
    await activateQuestion("s-ans-paused");
    await env.withSecurityRulesDisabled((ctx) =>
      set(ref(ctx.database(), "sessions/s-ans-paused/meta/paused"), true),
    );
    await assertFails(
      set(
        ref(db(ALICE), answerPath("s-ans-paused", "q1", ALICE)),
        validAnswer(),
      ),
    );
  });

  it("lecture des réponses : host oui, joueur non", async () => {
    await seedSession("s-ans-read");
    await activateQuestion("s-ans-read");
    await set(
      ref(db(ALICE), answerPath("s-ans-read", "q1", ALICE)),
      validAnswer(),
    );
    await assertFails(get(ref(db(BOB), "sessions/s-ans-read/answers/q1")));
    await assertSucceeds(get(ref(db(HOST), "sessions/s-ans-read/answers/q1")));
  });

  it("purge d'une question : host oui (re-poser/revanche), joueur non", async () => {
    await seedSession("s-ans-purge");
    await activateQuestion("s-ans-purge");
    await set(
      ref(db(ALICE), answerPath("s-ans-purge", "q1", ALICE)),
      validAnswer(),
    );
    await assertFails(
      set(ref(db(ALICE), "sessions/s-ans-purge/answers/q1"), null),
    );
    await assertSucceeds(
      set(ref(db(HOST), "sessions/s-ans-purge/answers/q1"), null),
    );
  });
});

describe("reveal (cloisonné)", () => {
  it("correct/explanation publics, reveal par joueur réservé à soi + host", async () => {
    await seedSession("s-reveal");
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.database();
      await set(ref(d, "sessions/s-reveal/reveal/q1"), {
        correct: "a",
        explanation: "Parce que.",
        [ALICE]: {
          correct: true,
          awarded: 800,
          responseTimeMs: 1200,
          total: 800,
        },
      });
    });
    await assertSucceeds(
      get(ref(db(BOB), "sessions/s-reveal/reveal/q1/correct")),
    );
    await assertSucceeds(
      get(ref(db(BOB), "sessions/s-reveal/reveal/q1/explanation")),
    );
    await assertSucceeds(
      get(ref(db(ALICE), `sessions/s-reveal/reveal/q1/${ALICE}`)),
    );
    await assertFails(
      get(ref(db(BOB), `sessions/s-reveal/reveal/q1/${ALICE}`)),
    );
    await assertSucceeds(
      get(ref(db(HOST), `sessions/s-reveal/reveal/q1/${ALICE}`)),
    );
  });
});

describe("suppression de session", () => {
  it("le host supprime la session entière, pas un joueur", async () => {
    await seedSession("s-delete");
    await assertFails(set(ref(db(ALICE), "sessions/s-delete"), null));
    await assertSucceeds(set(ref(db(HOST), "sessions/s-delete"), null));
  });
});

describe("reactions (anti-flood)", () => {
  it("un joueur n'écrit que SA réaction, pas celle d'un autre", async () => {
    await seedSession("s-react");
    await assertSucceeds(
      set(ref(db(ALICE), `sessions/s-react/reactions/${ALICE}`), {
        emoji: "👍",
        ts: serverTimestamp(),
      }),
    );
    await assertFails(
      set(ref(db(ALICE), `sessions/s-react/reactions/${BOB}`), {
        emoji: "🔥",
        ts: serverTimestamp(),
      }),
    );
  });

  it("cooldown : une 2e réaction immédiate (< 800 ms) est rejetée", async () => {
    await seedSession("s-react-cd");
    await assertSucceeds(
      set(ref(db(ALICE), `sessions/s-react-cd/reactions/${ALICE}`), {
        emoji: "👍",
        ts: serverTimestamp(),
      }),
    );
    // Immédiat → now <= précédent + 800 → refusé.
    await assertFails(
      set(ref(db(ALICE), `sessions/s-react-cd/reactions/${ALICE}`), {
        emoji: "❤️",
        ts: serverTimestamp(),
      }),
    );
  });
});

describe("current (validation de la fenêtre)", () => {
  const baseCurrent = {
    questionId: "q1",
    index: 0,
    total: 5,
    type: "multiple_choice",
    prompt: "?",
    scored: true,
    activatedAt: Date.now(),
  };

  it("timeLimitMs hors borne (≤ 1 h, > 0) rejeté", async () => {
    await seedSession("s-current");
    await assertSucceeds(
      set(ref(db(HOST), "sessions/s-current/current"), {
        ...baseCurrent,
        timeLimitMs: 20_000,
      }),
    );
    // Réouverture abusive de la fenêtre (des heures) → rejetée.
    await assertFails(
      set(ref(db(HOST), "sessions/s-current/current"), {
        ...baseCurrent,
        timeLimitMs: 999_999_999,
      }),
    );
    await assertFails(
      set(ref(db(HOST), "sessions/s-current/current"), {
        ...baseCurrent,
        timeLimitMs: 0,
      }),
    );
  });
});

describe("lecture du roster (cloisonnement RGPD)", () => {
  it("players/scores/leaderboard : non-participant refusé, participant et host OK", async () => {
    await seedSession("s-roster");
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.database();
      await set(ref(d, `sessions/s-roster/players/${ALICE}`), {
        pseudo: "Alice",
        joinedAt: Date.now(),
      });
      await set(ref(d, "sessions/s-roster/leaderboard/top"), [
        { uid: ALICE, pseudo: "Alice", total: 100 },
      ]);
      await set(ref(d, `sessions/s-roster/scores/${ALICE}`), {
        total: 100,
        streak: 1,
      });
    });
    // BOB n'a jamais participé → lecture du roster refusée.
    await assertFails(get(ref(db(BOB), "sessions/s-roster/players")));
    await assertFails(get(ref(db(BOB), "sessions/s-roster/leaderboard/top")));
    await assertFails(get(ref(db(BOB), "sessions/s-roster/scores")));
    // ALICE (présente) et le host peuvent lire.
    await assertSucceeds(
      get(ref(db(ALICE), "sessions/s-roster/leaderboard/top")),
    );
    await assertSucceeds(get(ref(db(HOST), "sessions/s-roster/players")));
  });

  it("joueur reconnecté (players purgé mais score présent) lit toujours le classement", async () => {
    await seedSession("s-roster-rejoin");
    await env.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.database();
      // players/$uid retiré par onDisconnect, mais le score subsiste.
      await set(ref(d, `sessions/s-roster-rejoin/scores/${ALICE}`), {
        total: 50,
        streak: 0,
      });
      await set(ref(d, "sessions/s-roster-rejoin/leaderboard/top"), [
        { uid: ALICE, pseudo: "Alice", total: 50 },
      ]);
    });
    await assertSucceeds(
      get(ref(db(ALICE), "sessions/s-roster-rejoin/leaderboard/top")),
    );
  });
});

describe("boucle de jeu complète (host ↔ joueur sous Rules)", () => {
  it("join → answer → host close (scores/reveal), joueur ne peut pas scorer", async () => {
    await seedSession("s-loop");
    // 1) Le joueur rejoint le lobby.
    await assertSucceeds(
      set(ref(db(ALICE), `sessions/s-loop/players/${ALICE}`), {
        pseudo: "Alice",
        joinedAt: Date.now(),
        avatar: "🦊",
      }),
    );
    // 2) Le host active la question.
    await activateQuestion("s-loop");
    // 3) Le joueur écrit SA réponse (fenêtre ouverte).
    await assertSucceeds(
      set(ref(db(ALICE), answerPath("s-loop", "q1", ALICE)), validAnswer()),
    );
    // 4) Un joueur NE PEUT PAS écrire les scores.
    await assertFails(
      set(ref(db(ALICE), `sessions/s-loop/scores/${ALICE}`), {
        total: 1000,
        streak: 1,
      }),
    );
    // 5) Le host lit les réponses, écrit scores + reveal + bascule l'état.
    await assertSucceeds(get(ref(db(HOST), "sessions/s-loop/answers/q1")));
    await assertSucceeds(
      update(ref(db(HOST)), {
        [`sessions/s-loop/scores/${ALICE}`]: { total: 1000, streak: 1 },
        [`sessions/s-loop/reveal/q1/correct`]: "a",
        [`sessions/s-loop/reveal/q1/${ALICE}`]: {
          correct: true,
          awarded: 1000,
          responseTimeMs: 1200,
          total: 1000,
        },
        [`sessions/s-loop/leaderboard/top`]: [
          { uid: ALICE, pseudo: "Alice", total: 1000 },
        ],
        [`sessions/s-loop/state`]: "LEADERBOARD",
      }),
    );
    // 6) Le joueur voit la bonne réponse (publique) et SON reveal.
    await assertSucceeds(
      get(ref(db(ALICE), "sessions/s-loop/reveal/q1/correct")),
    );
    await assertSucceeds(
      get(ref(db(ALICE), `sessions/s-loop/reveal/q1/${ALICE}`)),
    );
    // 7) Fenêtre fermée (LEADERBOARD) → plus de réponse possible.
    await assertFails(
      set(ref(db(BOB), answerPath("s-loop", "q1", BOB)), validAnswer()),
    );
  });
});
