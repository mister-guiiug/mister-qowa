/**
 * Cloud Functions autoritaires de Mister Qowa.
 *
 * Invariants (docs/00-decisions-consolidees.md) :
 *  - clé d'état = sessionId (D1) ; PIN = alias `pins/{pin} -> sessionId`.
 *  - le scoring est calculé UNIQUEMENT au REVEAL, en une passe (D5), jamais à la soumission.
 *  - la question diffusée aux clients ne contient JAMAIS la bonne réponse (anti-triche).
 *  - le quiz complet (avec corrections) vit dans un nœud `secret` lu seulement par l'Admin SDK.
 *
 * NOTE MVP : `enforceAppCheck` est à false pour rester jouable en émulateur/CI.
 * En production, activer App Check (D7/D8) : onCall({ enforceAppCheck: true }).
 */
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import type { ZodType } from "zod";
import { rtdb, firestore } from "./lib/admin";
import { allocatePin } from "./lib/pin";
import {
  createSessionInput,
  joinSessionInput,
  sessionActionInput,
  submitAnswerInput,
  type Quiz,
  type Question,
  type PublicQuestion,
} from "../../shared/contracts";
import {
  MAX_PLAYERS,
  STREAK_BONUS_PCT,
  LEADERBOARD_TOP,
} from "../../shared/gameState";
import { computeScore } from "../../shared/scoring";
import { freeTextMatches } from "../../shared/normalize";
import { DEMO_QUIZZES } from "../../shared/seed";
import {
  pinIndexPath,
  statePath,
  currentPath,
  metaPath,
  playersPath,
  scoresPath,
  scorePath,
  leaderboardPath,
  answersQuestionPath,
  answerPath,
  revealPath,
  playerRevealPath,
} from "../../shared/paths";

setGlobalOptions({ region: "europe-west1", maxInstances: 40 });

const opts = { enforceAppCheck: false };

interface SecretNode {
  quiz: Quiz;
  currentIndex: number;
}
interface ScoreRow {
  total: number;
  streak: number;
}

/* ---------- helpers ---------- */

function requireAuth(req: CallableRequest): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Connexion requise.");
  return uid;
}

function parseInput<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new HttpsError(
      "invalid-argument",
      r.error.issues[0]?.message ?? "Entrée invalide.",
    );
  }
  return r.data;
}

async function requireHost(
  sessionId: string,
  uid: string,
): Promise<{ quizId: string; hostUid: string }> {
  const snap = await rtdb.ref(metaPath(sessionId)).get();
  const meta = snap.val() as { quizId: string; hostUid: string } | null;
  if (!meta) throw new HttpsError("not-found", "Session introuvable.");
  if (meta.hostUid !== uid)
    throw new HttpsError("permission-denied", "Action réservée à l’hôte.");
  return meta;
}

async function getQuiz(quizId: string): Promise<Quiz | null> {
  const demo = DEMO_QUIZZES.find((q) => q.id === quizId);
  if (demo) return demo;
  const doc = await firestore.collection("quizzes").doc(quizId).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Quiz) : null;
}

function basePointsOf(q: Question): number {
  return q.type === "poll" ? 0 : q.basePoints;
}

function isCorrect(q: Question, choice: string): boolean {
  switch (q.type) {
    case "multiple_choice":
      return choice === q.correctOptionId;
    case "true_false":
      return (choice === "true") === q.correct;
    case "free_text":
      return freeTextMatches(choice, q.acceptedAnswers, q.caseSensitive);
    case "poll":
      return false;
  }
}

function correctChoiceOf(q: Question): string {
  switch (q.type) {
    case "multiple_choice":
      return q.correctOptionId;
    case "true_false":
      return q.correct ? "true" : "false";
    case "free_text":
      return q.acceptedAnswers[0];
    case "poll":
      return "";
  }
}

function toPublicQuestion(
  q: Question,
  index: number,
  total: number,
  activatedAt: number,
): PublicQuestion {
  const common = {
    questionId: q.id,
    index,
    total,
    type: q.type,
    prompt: q.prompt,
    activatedAt,
    endsAt: activatedAt + q.timeLimitMs,
    scored: q.type !== "poll",
    ...(q.mediaUrl ? { mediaUrl: q.mediaUrl } : {}),
  };
  if (q.type === "multiple_choice" || q.type === "poll") {
    return { ...common, options: q.options };
  }
  if (q.type === "true_false") {
    return {
      ...common,
      options: [
        { id: "true", label: "Vrai" },
        { id: "false", label: "Faux" },
      ],
    };
  }
  return common; // free_text : pas d'options
}

/* ---------- handlers ---------- */

export const createSession = onCall(opts, async (req) => {
  const uid = requireAuth(req);
  const { quizId } = parseInput(createSessionInput, req.data);
  const quiz = await getQuiz(quizId);
  if (!quiz) throw new HttpsError("not-found", "Quiz introuvable.");

  const sessionRef = rtdb.ref("sessions").push();
  const sessionId = sessionRef.key as string;
  const pin = await allocatePin(sessionId);

  await sessionRef.set({
    meta: {
      quizId,
      hostUid: uid,
      pin,
      createdAt: Date.now(),
      totalQuestions: quiz.questions.length,
    },
    state: "LOBBY",
    secret: { quiz, currentIndex: -1 } satisfies SecretNode,
  });

  return { sessionId, pin };
});

export const joinSession = onCall(opts, async (req) => {
  const uid = requireAuth(req);
  const { pin, pseudo } = parseInput(joinSessionInput, req.data);

  const sessionId = (await rtdb.ref(pinIndexPath(pin)).get()).val();
  if (!sessionId || typeof sessionId !== "string")
    throw new HttpsError("not-found", "PIN invalide.");

  const state = (await rtdb.ref(statePath(sessionId)).get()).val();
  if (state !== "LOBBY")
    throw new HttpsError("failed-precondition", "La partie a déjà commencé.");

  const playersSnap = await rtdb.ref(playersPath(sessionId)).get();
  const count = playersSnap.exists()
    ? Object.keys(playersSnap.val() as object).length
    : 0;
  if (count >= MAX_PLAYERS)
    throw new HttpsError("resource-exhausted", "Partie complète.");

  await rtdb.ref().update({
    [`${playersPath(sessionId)}/${uid}`]: { pseudo, joinedAt: Date.now() },
    [scorePath(sessionId, uid)]: { total: 0, streak: 0 },
  });

  return { sessionId };
});

export const nextQuestion = onCall(opts, async (req) => {
  const uid = requireAuth(req);
  const { sessionId } = parseInput(sessionActionInput, req.data);
  await requireHost(sessionId, uid);

  const secret = (
    await rtdb.ref(`sessions/${sessionId}/secret`).get()
  ).val() as SecretNode | null;
  if (!secret)
    throw new HttpsError("failed-precondition", "Session sans quiz.");

  const nextIndex = secret.currentIndex + 1;
  if (nextIndex >= secret.quiz.questions.length)
    throw new HttpsError("failed-precondition", "Plus de questions.");

  const q = secret.quiz.questions[nextIndex];
  const activatedAt = Date.now();
  const current = toPublicQuestion(
    q,
    nextIndex,
    secret.quiz.questions.length,
    activatedAt,
  );

  await rtdb.ref().update({
    [`sessions/${sessionId}/secret/currentIndex`]: nextIndex,
    [currentPath(sessionId)]: current,
    [statePath(sessionId)]: "QUESTION_ACTIVE",
  });

  return { ok: true };
});

export const closeQuestion = onCall(opts, async (req) => {
  const uid = requireAuth(req);
  const { sessionId } = parseInput(sessionActionInput, req.data);
  await requireHost(sessionId, uid);

  const [stateSnap, secretSnap, currentSnap] = await Promise.all([
    rtdb.ref(statePath(sessionId)).get(),
    rtdb.ref(`sessions/${sessionId}/secret`).get(),
    rtdb.ref(currentPath(sessionId)).get(),
  ]);

  // Garde d'état = idempotence (D5) : on ne score qu'une fois.
  if (stateSnap.val() !== "QUESTION_ACTIVE")
    throw new HttpsError("failed-precondition", "Aucune question active.");

  const secret = secretSnap.val() as SecretNode;
  const current = currentSnap.val() as PublicQuestion;
  const q = secret.quiz.questions[secret.currentIndex];

  const [answersSnap, scoresSnap, playersSnap] = await Promise.all([
    rtdb.ref(answersQuestionPath(sessionId, q.id)).get(),
    rtdb.ref(scoresPath(sessionId)).get(),
    rtdb.ref(playersPath(sessionId)).get(),
  ]);

  const shards = (answersSnap.val() ?? {}) as Record<
    string,
    Record<string, { choice: string; serverTs: number }>
  >;
  const scores = (scoresSnap.val() ?? {}) as Record<string, ScoreRow>;
  const players = (playersSnap.val() ?? {}) as Record<
    string,
    { pseudo: string }
  >;

  const updates: Record<string, unknown> = {};

  // Dédup par joueur (1re réponse retenue) : neutralise une écriture multi-shard
  // forgée — les Rules ne peuvent pas vérifier le hash de shard côté serveur (D4).
  const flat = new Map<string, { choice: string; serverTs: number }>();
  for (const shard of Object.values(shards)) {
    for (const [pid, ans] of Object.entries(shard)) {
      if (!flat.has(pid)) flat.set(pid, ans);
    }
  }

  for (const [pid, ans] of flat) {
    {
      const correct = isCorrect(q, ans.choice);
      const responseTimeMs = Math.max(
        0,
        (ans.serverTs ?? current.activatedAt) - current.activatedAt,
      );
      const prev = scores[pid] ?? { total: 0, streak: 0 };
      const awarded = computeScore({
        correct,
        responseTimeMs,
        timeLimitMs: q.timeLimitMs,
        basePoints: basePointsOf(q),
        streakBefore: prev.streak,
        streakBonusPct: STREAK_BONUS_PCT,
      });
      const newScore: ScoreRow = {
        total: prev.total + awarded,
        streak: correct ? prev.streak + 1 : 0,
      };
      scores[pid] = newScore;
      updates[scorePath(sessionId, pid)] = newScore;
      updates[playerRevealPath(sessionId, q.id, pid)] = {
        correct,
        awarded,
        responseTimeMs,
        total: newScore.total,
      };
    }
  }

  updates[`${revealPath(sessionId, q.id)}/correct`] = correctChoiceOf(q);
  updates[leaderboardPath(sessionId)] = Object.entries(scores)
    .map(([pid, s]) => ({
      uid: pid,
      pseudo: players[pid]?.pseudo ?? "?",
      total: s.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, LEADERBOARD_TOP);
  updates[statePath(sessionId)] = "LEADERBOARD";

  await rtdb.ref().update(updates);
  return { ok: true };
});

export const endGame = onCall(opts, async (req) => {
  const uid = requireAuth(req);
  const { sessionId } = parseInput(sessionActionInput, req.data);
  const meta = await requireHost(sessionId, uid);

  const [scoresSnap, playersSnap] = await Promise.all([
    rtdb.ref(scoresPath(sessionId)).get(),
    rtdb.ref(playersPath(sessionId)).get(),
  ]);
  const scores = (scoresSnap.val() ?? {}) as Record<string, ScoreRow>;
  const players = (playersSnap.val() ?? {}) as Record<
    string,
    { pseudo: string }
  >;

  const ranking = Object.entries(scores)
    .map(([pid, s]) => ({
      uid: pid,
      pseudo: players[pid]?.pseudo ?? "?",
      total: s.total,
    }))
    .sort((a, b) => b.total - a.total);

  // Snapshot durable Firestore — inclus DÈS le MVP (pas de perte de données).
  await firestore.collection("results").doc(sessionId).set({
    sessionId,
    quizId: meta.quizId,
    hostUid: uid,
    finishedAt: Date.now(),
    playerCount: ranking.length,
    ranking,
  });

  await rtdb.ref().update({
    [leaderboardPath(sessionId)]: ranking.slice(0, LEADERBOARD_TOP),
    [statePath(sessionId)]: "PODIUM",
  });

  return { ok: true };
});

/** Chemin de SECOURS (D2 : défaut = écriture RTDB directe côté client). */
export const submitAnswer = onCall(opts, async (req) => {
  const uid = requireAuth(req);
  const { sessionId, questionId, choice } = parseInput(
    submitAnswerInput,
    req.data,
  );

  const [stateSnap, currentSnap] = await Promise.all([
    rtdb.ref(statePath(sessionId)).get(),
    rtdb.ref(currentPath(sessionId)).get(),
  ]);
  if (stateSnap.val() !== "QUESTION_ACTIVE")
    throw new HttpsError("failed-precondition", "Réponses fermées.");

  const current = currentSnap.val() as PublicQuestion | null;
  if (!current || current.questionId !== questionId)
    throw new HttpsError("failed-precondition", "Question obsolète.");
  if (Date.now() > current.endsAt)
    throw new HttpsError("deadline-exceeded", "Trop tard.");

  const ref = rtdb.ref(answerPath(sessionId, questionId, uid));
  const res = await ref.transaction((cur) =>
    cur === null ? { choice, serverTs: Date.now() } : undefined,
  );
  if (!res.committed) throw new HttpsError("already-exists", "Déjà répondu.");
  return { ok: true };
});
