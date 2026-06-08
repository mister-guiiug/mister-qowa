/**
 * Clôture d'une question — LOGIQUE PURE testable (extraite de l'I/O host).
 * À partir des réponses dédupliquées et des scores précédents, calcule les
 * nouveaux scores, le reveal par joueur et la bonne réponse. Aucune dépendance
 * Firebase : c'est le cœur métier, exercé directement par les tests.
 */
import type { Question, Score, PlayerReveal } from "./contracts";
import { isCorrect, correctChoiceOf, basePointsOf } from "./game";
import { computeScore } from "./scoring";

export interface RoundAnswer {
  choice: string;
  serverTs?: number;
}

export interface RoundResult {
  /** Scores mis à jour pour les SEULS joueurs ayant répondu. */
  scores: Record<string, Score>;
  /** Reveal par joueur (correct/awarded/temps/total). */
  reveals: Record<string, PlayerReveal>;
  /** Bonne réponse publiable, ou null pour un sondage (pas de scoring). */
  correctChoice: string | null;
}

export function scoreRound(
  q: Question,
  answers: Record<string, RoundAnswer>,
  prevScores: Record<string, Score>,
  activatedAt: number,
  streakBonusPct: number,
): RoundResult {
  const scores: Record<string, Score> = {};
  const reveals: Record<string, PlayerReveal> = {};

  // Sondage : ni score, ni série, ni reveal.
  if (q.type === "poll") return { scores, reveals, correctChoice: null };

  for (const [pid, ans] of Object.entries(answers)) {
    const correct = isCorrect(q, ans.choice);
    const responseTimeMs = Math.max(
      0,
      (ans.serverTs ?? activatedAt) - activatedAt,
    );
    const prev = prevScores[pid] ?? { total: 0, streak: 0 };
    const awarded = computeScore({
      correct,
      responseTimeMs,
      timeLimitMs: q.timeLimitMs,
      basePoints: basePointsOf(q),
      streakBefore: prev.streak,
      streakBonusPct,
    });
    const newScore: Score = {
      total: prev.total + awarded,
      streak: correct ? prev.streak + 1 : 0,
    };
    scores[pid] = newScore;
    reveals[pid] = { correct, awarded, responseTimeMs, total: newScore.total };
  }

  return { scores, reveals, correctChoice: correctChoiceOf(q) };
}

/** Compte réponses & bonnes réponses d'une question (pour les stats post-partie). */
export function tallyAnswers(
  q: Question,
  answers: Record<string, RoundAnswer>,
): { answered: number; correct: number } {
  let correct = 0;
  for (const a of Object.values(answers)) {
    if (isCorrect(q, a.choice)) correct += 1;
  }
  return { answered: Object.keys(answers).length, correct };
}
