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
import { getDb, ensureAuth } from "./app";
import {
  pinIndexPath,
  sessionPath,
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
  teamLeaderboardPath,
} from "@shared/paths";
import type { Team } from "@shared/teams";
import {
  PIN_LENGTH,
  MAX_PLAYERS,
  STREAK_BONUS_PCT,
  LEADERBOARD_TOP,
} from "@shared/gameState";
import {
  scoreRound,
  tallyAnswers,
  eliminateAfterRound,
  type RoundAnswer,
} from "@shared/round";
import { publicQuestionFields } from "@shared/game";
import type { Quiz, Score } from "@shared/contracts";

type AnswerNode = { choice: string; serverTs: number };

function randomPin(): string {
  const a = new Uint32Array(PIN_LENGTH);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => String(n % 10)).join("");
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Écriture host CRITIQUE (transition d'état, scoring) : une re-tentative après
 * un court délai si le 1er essai échoue (coupure réseau passagère), puis on
 * trace et on remonte l'erreur au lieu de la perdre silencieusement.
 */
async function hostWrite<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await sleep(600); // re-tentative après une coupure réseau passagère
    try {
      return await fn();
    } catch (second) {
      console.error(`[host:${label}] échec après re-tentative`, second);
      throw second instanceof Error ? second : new Error(String(second));
    }
  }
}

/** Agrège les scores individuels par équipe (mode équipe). */
function teamStandings(
  teams: Team[],
  scores: Record<string, Score>,
  players: Record<string, { teamId?: string }>,
) {
  const totals: Record<string, number> = {};
  for (const [pid, s] of Object.entries(scores)) {
    const tid = players[pid]?.teamId;
    if (tid) totals[tid] = (totals[tid] ?? 0) + s.total;
  }
  return teams
    .map((t) => ({
      teamId: t.id,
      name: t.name,
      color: t.color,
      total: totals[t.id] ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

type PlayerLite = { pseudo: string; teamId?: string; avatar?: string };

/** Classement tronqué (avec avatar quand présent) à partir des scores. */
function buildRanking(
  scores: Record<string, Score>,
  players: Record<string, PlayerLite>,
) {
  return Object.entries(scores)
    .map(([pid, s]) => {
      const av = players[pid]?.avatar;
      return {
        uid: pid,
        pseudo: players[pid]?.pseudo ?? "?",
        total: s.total,
        ...(av ? { avatar: av } : {}),
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, LEADERBOARD_TOP);
}

/* ---------- host ---------- */

export async function createSession(
  quiz: Quiz,
  teams?: Team[],
  opts?: { elimination?: boolean },
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
    ...(teams && teams.length ? { teams } : {}),
    ...(opts?.elimination ? { eliminationMode: true } : {}),
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
  await hostWrite("nextQuestion", async () => {
    await set(ref(db, currentPath(sessionId)), {
      ...publicQuestionFields(q, index, quiz.questions.length),
      activatedAt: serverTimestamp(),
    });
    await set(ref(db, statePath(sessionId)), "QUESTION_ACTIVE");
  });
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
  const [curSnap, ansSnap, scoresSnap, playersSnap, metaSnap] =
    await Promise.all([
      get(ref(db, currentPath(sessionId))),
      get(ref(db, answersQuestionPath(sessionId, q.id))),
      get(ref(db, scoresPath(sessionId))),
      get(ref(db, playersPath(sessionId))),
      get(ref(db, metaPath(sessionId))),
    ]);
  const activatedAt = (curSnap.val()?.activatedAt as number) ?? Date.now();
  const shards = (ansSnap.val() ?? {}) as Record<
    string,
    Record<string, AnswerNode>
  >;
  const scores = (scoresSnap.val() ?? {}) as Record<string, Score>;
  const players = (playersSnap.val() ?? {}) as Record<string, PlayerLite>;

  // Dédup par joueur (1re réponse retenue) — écriture multi-shard forgée neutralisée.
  const flat = new Map<string, AnswerNode>();
  for (const shard of Object.values(shards)) {
    for (const [pid, ans] of Object.entries(shard)) {
      if (!flat.has(pid)) flat.set(pid, ans);
    }
  }
  const meta = metaSnap.val() as {
    teams?: Team[];
    eliminationMode?: boolean;
  } | null;
  const elimination = meta?.eliminationMode === true;
  // Mode élimination : les joueurs hors course ne marquent plus de points.
  const answers = Object.fromEntries(
    [...flat].filter(([pid]) => !(elimination && scores[pid]?.eliminated)),
  );

  // Cœur métier PUR (testé dans shared/round.test.ts).
  const round = scoreRound(q, answers, scores, activatedAt, STREAK_BONUS_PCT);
  const updates: Record<string, unknown> = {};
  for (const [pid, sc] of Object.entries(round.scores)) {
    scores[pid] = sc;
    updates[scorePath(sessionId, pid)] = sc;
    updates[playerRevealPath(sessionId, q.id, pid)] = round.reveals[pid];
  }
  if (elimination) {
    const fallen = eliminateAfterRound(
      q,
      answers,
      Object.keys(players),
      scores,
    );
    for (const pid of fallen) {
      const prev = scores[pid] ?? { total: 0, streak: 0 };
      const sc: Score = { total: prev.total, streak: 0, eliminated: true };
      scores[pid] = sc;
      updates[scorePath(sessionId, pid)] = sc;
    }
  }
  if (round.correctChoice !== null) {
    updates[`${revealPath(sessionId, q.id)}/correct`] = round.correctChoice;
    if (q.type !== "poll" && q.explanation?.trim()) {
      updates[`${revealPath(sessionId, q.id)}/explanation`] =
        q.explanation.trim();
    }
  }
  updates[leaderboardPath(sessionId)] = buildRanking(scores, players);
  const teams = meta?.teams;
  if (teams?.length) {
    updates[teamLeaderboardPath(sessionId)] = teamStandings(
      teams,
      scores,
      players,
    );
  }
  updates[statePath(sessionId)] = "LEADERBOARD";
  await hostWrite("closeQuestion", () => update(ref(db), updates));
}

export async function endGame(sessionId: string, quiz?: Quiz): Promise<void> {
  const user = await ensureAuth();
  const db = getDb();
  const [scoresSnap, playersSnap, metaSnap, answersSnap] = await Promise.all([
    get(ref(db, scoresPath(sessionId))),
    get(ref(db, playersPath(sessionId))),
    get(ref(db, metaPath(sessionId))),
    get(ref(db, `sessions/${sessionId}/answers`)),
  ]);
  const scores = (scoresSnap.val() ?? {}) as Record<string, Score>;
  const players = (playersSnap.val() ?? {}) as Record<string, PlayerLite>;
  const ranking = buildRanking(scores, players);
  const questionStats = quiz
    ? computeQuestionStats(quiz, answersSnap.val())
    : [];
  const finalUpdate: Record<string, unknown> = {
    [leaderboardPath(sessionId)]: ranking,
    [statePath(sessionId)]: "PODIUM",
  };
  const teams = (metaSnap.val() as { teams?: Team[] } | null)?.teams;
  if (teams?.length) {
    finalUpdate[teamLeaderboardPath(sessionId)] = teamStandings(
      teams,
      scores,
      players,
    );
  }
  await hostWrite("endGame", () => update(ref(db), finalUpdate));

  // Archive durable (best-effort) — Firestore chargé à la demande (chunk séparé).
  try {
    const { saveResult } = await import("./fs");
    await saveResult(sessionId, {
      sessionId,
      hostUid: user.uid,
      quizId: quiz?.id ?? null,
      quizTitle: quiz?.title ?? "Quiz",
      finishedAt: Date.now(),
      playerCount: ranking.length,
      ranking,
      ...(questionStats.length ? { questionStats } : {}),
    });
  } catch (e) {
    console.error("[endGame] archivage Firestore échoué", e);
  }
}

/** Stats par question (taux de réussite) à partir du nœud answers RTDB. */
function computeQuestionStats(
  quiz: Quiz,
  answersRaw: unknown,
): { index: number; prompt: string; answered: number; correct: number }[] {
  const all = (answersRaw ?? {}) as Record<
    string,
    Record<string, Record<string, RoundAnswer>>
  >;
  return quiz.questions.map((q, index) => {
    // Dédup par joueur (1re réponse) à travers les shards de la question.
    const flat: Record<string, RoundAnswer> = {};
    for (const shard of Object.values(all[q.id] ?? {})) {
      for (const [pid, ans] of Object.entries(shard)) {
        if (!(pid in flat)) flat[pid] = ans;
      }
    }
    const { answered, correct } = tallyAnswers(q, flat);
    return { index, prompt: q.prompt, answered, correct };
  });
}

/* ---------- joueur ---------- */

/** Résout un PIN -> session + équipes (si mode équipe), avant de rejoindre. */
export async function lookupSession(
  pin: string,
): Promise<{ sessionId: string; teams: Team[] | null }> {
  await ensureAuth(); // la lecture de pins/ exige désormais une session Auth (anti-bot)
  const db = getDb();
  const sid = (await get(ref(db, pinIndexPath(pin)))).val();
  if (!sid || typeof sid !== "string") throw new Error("PIN invalide.");
  if ((await get(ref(db, statePath(sid)))).val() !== "LOBBY")
    throw new Error("La partie a déjà commencé.");
  const meta = (await get(ref(db, metaPath(sid)))).val() as {
    teams?: Team[];
  } | null;
  return { sessionId: sid, teams: meta?.teams ?? null };
}

export async function joinSession(
  pin: string,
  pseudo: string,
  teamId?: string,
  avatar?: string,
): Promise<{ sessionId: string }> {
  const user = await ensureAuth();
  const db = getDb();
  const sid = (await get(ref(db, pinIndexPath(pin)))).val();
  if (!sid || typeof sid !== "string") throw new Error("PIN invalide.");
  const state = (await get(ref(db, statePath(sid)))).val();
  if (state !== "LOBBY") throw new Error("La partie a déjà commencé.");
  const bannedSnap = await get(ref(db, `${metaPath(sid)}/banned/${user.uid}`));
  if (bannedSnap.exists()) throw new Error("Tu as été retiré de cette partie.");
  const playersSnap = await get(ref(db, playersPath(sid)));
  const count = playersSnap.exists()
    ? Object.keys(playersSnap.val() as object).length
    : 0;
  if (count >= MAX_PLAYERS) throw new Error("Partie complète.");
  const playerRef = ref(db, playerPath(sid, user.uid));
  await set(playerRef, {
    pseudo,
    joinedAt: Date.now(),
    ...(teamId ? { teamId } : {}),
    ...(avatar ? { avatar } : {}),
  });
  // Présence : retire le joueur du lobby s'il se déconnecte.
  void onDisconnect(playerRef).remove();
  return { sessionId: sid };
}

/**
 * Pause / reprise de la question courante. La pause bloque les réponses CÔTÉ
 * SERVEUR (rule `meta/paused !== true`) ; à la reprise, la fenêtre de réponse
 * est étendue de la durée de la pause (timeLimitMs += pauseMs).
 */
export async function pauseQuestion(
  sessionId: string,
  paused: boolean,
): Promise<void> {
  const db = getDb();
  if (paused) {
    await update(ref(db, metaPath(sessionId)), {
      paused: true,
      pausedAt: serverTimestamp(),
    });
    return;
  }
  const [metaSnap, curSnap] = await Promise.all([
    get(ref(db, metaPath(sessionId))),
    get(ref(db, currentPath(sessionId))),
  ]);
  const pausedAt = (metaSnap.val() as { pausedAt?: number } | null)?.pausedAt;
  const timeLimitMs = (curSnap.val() as { timeLimitMs?: number } | null)
    ?.timeLimitMs;
  // Horloge locale ≈ horloge serveur (skew < 1 s) : approximation suffisante.
  const pauseMs = pausedAt ? Math.max(0, Date.now() - pausedAt) : 0;
  const updates: Record<string, unknown> = {
    [`${metaPath(sessionId)}/paused`]: null,
    [`${metaPath(sessionId)}/pausedAt`]: null,
  };
  if (timeLimitMs && pauseMs > 0) {
    updates[`${currentPath(sessionId)}/timeLimitMs`] = timeLimitMs + pauseMs;
  }
  await update(ref(db), updates);
}

/** Re-pose la question courante : purge réponses + reveal, chrono repart à zéro. */
export async function replayQuestion(
  sessionId: string,
  quiz: Quiz,
  index: number,
): Promise<void> {
  const db = getDb();
  const q = quiz.questions[index];
  await hostWrite("replayQuestion", () =>
    update(ref(db), {
      [answersQuestionPath(sessionId, q.id)]: null,
      [revealPath(sessionId, q.id)]: null,
      [`${metaPath(sessionId)}/paused`]: null,
      [`${metaPath(sessionId)}/pausedAt`]: null,
      [currentPath(sessionId)]: {
        ...publicQuestionFields(q, index, quiz.questions.length),
        activatedAt: serverTimestamp(),
      },
      [statePath(sessionId)]: "QUESTION_ACTIVE",
    }),
  );
}

/**
 * Ferme définitivement la salle : supprime la session entière (rule host-delete
 * au niveau $sid) et libère le PIN. À appeler quand le host quitte le podium.
 */
export async function closeSession(
  sessionId: string,
  pin: string | null,
): Promise<void> {
  const updates: Record<string, unknown> = { [sessionPath(sessionId)]: null };
  if (pin) updates[pinIndexPath(pin)] = null;
  await update(ref(getDb()), updates);
}

/** Exclut un joueur (host) : retire son nœud et le bannit (anti re-join). */
export async function kickPlayer(
  sessionId: string,
  uid: string,
): Promise<void> {
  await update(ref(getDb()), {
    [playerPath(sessionId, uid)]: null,
    [`${metaPath(sessionId)}/banned/${uid}`]: true,
  });
}

/** Saute la question courante sans la scorer : passe à la suivante (ou au podium). */
export async function skipQuestion(
  sessionId: string,
  quiz: Quiz,
  index: number,
): Promise<void> {
  if (index + 1 < quiz.questions.length)
    await nextQuestion(sessionId, quiz, index + 1);
  else await endGame(sessionId, quiz);
}

/** Revanche : remet la session en LOBBY, purge la partie, conserve joueurs + PIN. */
export async function restartSession(
  sessionId: string,
  quiz: Quiz,
): Promise<void> {
  const db = getDb();
  const updates: Record<string, unknown> = {
    [statePath(sessionId)]: "LOBBY",
    [currentPath(sessionId)]: null,
    [scoresPath(sessionId)]: null,
    [leaderboardPath(sessionId)]: null,
    [teamLeaderboardPath(sessionId)]: null,
  };
  // Purge réponses + reveal de CHAQUE question (sinon !data.exists() rebloque).
  for (const q of quiz.questions) {
    updates[answersQuestionPath(sessionId, q.id)] = null;
    updates[revealPath(sessionId, q.id)] = null;
  }
  await hostWrite("restartSession", () => update(ref(db), updates));
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
