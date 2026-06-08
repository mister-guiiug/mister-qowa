/**
 * Accès backend — mode SPARK (sans Cloud Functions). L'autorité est côté HOST :
 * le host détient le quiz localement (réponses jamais publiées aux joueurs),
 * écrit l'état/scores, et les Security Rules garantissent que seul le host écrit
 * ces nœuds et qu'un joueur n'écrit que SA réponse {choice, serverTs}.
 */
import {
  ref,
  set,
  get,
  update,
  push,
  runTransaction,
  serverTimestamp,
  onDisconnect,
} from "firebase/database";
import { doc, setDoc } from "firebase/firestore";
import { getDb, getFs, ensureAuth } from "./app";
import {
  pinIndexPath,
  metaPath,
  statePath,
  currentPath,
  playerPath,
  playersPath,
  scorePath,
  scoresPath,
  leaderboardPath,
  answersQuestionPath,
  answerPath,
  revealPath,
  playerRevealPath,
  reactionsPath,
} from "@shared/paths";
import {
  PIN_LENGTH,
  MAX_PLAYERS,
  STREAK_BONUS_PCT,
  LEADERBOARD_TOP,
} from "@shared/gameState";
import { computeScore } from "@shared/scoring";
import {
  isCorrect,
  correctChoiceOf,
  basePointsOf,
  publicQuestionFields,
} from "@shared/game";
import type { Quiz, Score } from "@shared/contracts";

type AnswerNode = { choice: string; serverTs: number };

function randomPin(): string {
  const a = new Uint32Array(PIN_LENGTH);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => String(n % 10)).join("");
}

/* ---------- host ---------- */

export async function createSession(
  quiz: Quiz,
): Promise<{ sessionId: string; pin: string }> {
  const user = await ensureAuth();
  const db = getDb();
  const sessionId = push(ref(db, "sessions")).key as string;

  let pin = "";
  for (let i = 0; i < 12; i += 1) {
    const cand = randomPin();
    const res = await runTransaction(ref(db, pinIndexPath(cand)), (cur) =>
      cur === null ? sessionId : undefined,
    );
    if (res.committed) {
      pin = cand;
      break;
    }
  }
  if (!pin) throw new Error("Impossible d’allouer un PIN.");

  // meta EN PREMIER (les Rules host se basent sur meta/hostUid).
  await set(ref(db, metaPath(sessionId)), {
    hostUid: user.uid,
    quizId: quiz.id,
    pin,
    createdAt: Date.now(),
    totalQuestions: quiz.questions.length,
  });
  await set(ref(db, statePath(sessionId)), "LOBBY");
  return { sessionId, pin };
}

export async function nextQuestion(
  sessionId: string,
  quiz: Quiz,
  index: number,
): Promise<void> {
  if (index >= quiz.questions.length) throw new Error("Plus de questions.");
  const db = getDb();
  const q = quiz.questions[index];
  await set(ref(db, currentPath(sessionId)), {
    ...publicQuestionFields(q, index, quiz.questions.length),
    activatedAt: serverTimestamp(),
  });
  await set(ref(db, statePath(sessionId)), "QUESTION_ACTIVE");
}

export async function closeQuestion(
  sessionId: string,
  quiz: Quiz,
  index: number,
): Promise<void> {
  const db = getDb();
  // Idempotence : on ne score qu'une fois (clôture manuelle + auto-clôture).
  if ((await get(ref(db, statePath(sessionId)))).val() !== "QUESTION_ACTIVE")
    return;
  const q = quiz.questions[index];
  const [curSnap, ansSnap, scoresSnap, playersSnap] = await Promise.all([
    get(ref(db, currentPath(sessionId))),
    get(ref(db, answersQuestionPath(sessionId, q.id))),
    get(ref(db, scoresPath(sessionId))),
    get(ref(db, playersPath(sessionId))),
  ]);
  const activatedAt = (curSnap.val()?.activatedAt as number) ?? Date.now();
  const shards = (ansSnap.val() ?? {}) as Record<
    string,
    Record<string, AnswerNode>
  >;
  const scores = (scoresSnap.val() ?? {}) as Record<string, Score>;
  const players = (playersSnap.val() ?? {}) as Record<
    string,
    { pseudo: string }
  >;

  // Dédup par joueur (1re réponse retenue) — écriture multi-shard forgée neutralisée.
  const flat = new Map<string, AnswerNode>();
  for (const shard of Object.values(shards)) {
    for (const [pid, ans] of Object.entries(shard)) {
      if (!flat.has(pid)) flat.set(pid, ans);
    }
  }

  const updates: Record<string, unknown> = {};
  for (const [pid, ans] of flat) {
    if (q.type === "poll") break; // sondage : ni score, ni série, ni reveal
    const correct = isCorrect(q, ans.choice);
    const responseTimeMs = Math.max(
      0,
      (ans.serverTs ?? activatedAt) - activatedAt,
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
    const newScore: Score = {
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
  if (q.type !== "poll") {
    updates[`${revealPath(sessionId, q.id)}/correct`] = correctChoiceOf(q);
  }
  updates[leaderboardPath(sessionId)] = Object.entries(scores)
    .map(([pid, s]) => ({
      uid: pid,
      pseudo: players[pid]?.pseudo ?? "?",
      total: s.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, LEADERBOARD_TOP);
  updates[statePath(sessionId)] = "LEADERBOARD";
  await update(ref(db), updates);
}

export async function endGame(sessionId: string, quiz?: Quiz): Promise<void> {
  const user = await ensureAuth();
  const db = getDb();
  const [scoresSnap, playersSnap] = await Promise.all([
    get(ref(db, scoresPath(sessionId))),
    get(ref(db, playersPath(sessionId))),
  ]);
  const scores = (scoresSnap.val() ?? {}) as Record<string, Score>;
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
    .sort((a, b) => b.total - a.total)
    .slice(0, LEADERBOARD_TOP);
  await update(ref(db), {
    [leaderboardPath(sessionId)]: ranking,
    [statePath(sessionId)]: "PODIUM",
  });

  // Archive durable (best-effort) — alimente l'historique des parties.
  try {
    await setDoc(doc(getFs(), "results", sessionId), {
      sessionId,
      hostUid: user.uid,
      quizId: quiz?.id ?? null,
      quizTitle: quiz?.title ?? "Quiz",
      finishedAt: Date.now(),
      playerCount: ranking.length,
      ranking,
    });
  } catch {
    /* archivage non critique */
  }
}

/* ---------- joueur ---------- */

export async function joinSession(
  pin: string,
  pseudo: string,
): Promise<{ sessionId: string }> {
  const user = await ensureAuth();
  const db = getDb();
  const sid = (await get(ref(db, pinIndexPath(pin)))).val();
  if (!sid || typeof sid !== "string") throw new Error("PIN invalide.");
  const state = (await get(ref(db, statePath(sid)))).val();
  if (state !== "LOBBY") throw new Error("La partie a déjà commencé.");
  const playersSnap = await get(ref(db, playersPath(sid)));
  const count = playersSnap.exists()
    ? Object.keys(playersSnap.val() as object).length
    : 0;
  if (count >= MAX_PLAYERS) throw new Error("Partie complète.");
  const playerRef = ref(db, playerPath(sid, user.uid));
  await set(playerRef, { pseudo, joinedAt: Date.now() });
  // Présence : retire le joueur du lobby s'il se déconnecte.
  void onDisconnect(playerRef).remove();
  return { sessionId: sid };
}

/** Réaction emoji éphémère (push RTDB). */
export async function sendReaction(
  sessionId: string,
  emoji: string,
): Promise<void> {
  await push(ref(getDb(), reactionsPath(sessionId)), {
    emoji,
    ts: serverTimestamp(),
  });
}

/** Soumission de réponse — écriture RTDB directe {choice, serverTs} (D2/D3). */
export async function submitAnswer(
  sessionId: string,
  questionId: string,
  choice: string,
): Promise<void> {
  const user = await ensureAuth();
  await set(ref(getDb(), answerPath(sessionId, questionId, user.uid)), {
    choice,
    serverTs: serverTimestamp(),
  });
}
