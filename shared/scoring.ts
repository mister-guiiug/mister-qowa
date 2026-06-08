/**
 * Moteur de score — SOURCE DE VÉRITÉ UNIQUE (D10).
 * Importé tel quel par les Cloud Functions (jamais redéfini ailleurs).
 *
 *   faux / hors-temps / sondage  -> 0
 *   juste                        -> basePoints * vitesse * (1 + bonus de série)
 *
 * vitesse = 1 - 0.5 * (responseTimeMs / timeLimitMs)   borné [0.5 ; 1]
 *   => répondre instantanément = points pleins ; à la dernière seconde = moitié.
 */

export const STREAK_CAP = 5;

export interface ScoreInput {
  correct: boolean;
  /** Temps de réponse mesuré CÔTÉ SERVEUR (serverTs - activatedAt). */
  responseTimeMs: number;
  timeLimitMs: number;
  basePoints: number;
  /** Bonnes réponses consécutives AVANT cette question. */
  streakBefore: number;
  streakBonusPct: number;
}

export function speedFactor(
  responseTimeMs: number,
  timeLimitMs: number,
): number {
  const ratio = Math.min(
    Math.max(responseTimeMs, 0) / Math.max(timeLimitMs, 1),
    1,
  );
  return 1 - 0.5 * ratio;
}

export function streakMultiplier(
  streakBefore: number,
  streakBonusPct: number,
): number {
  const capped = Math.min(Math.max(streakBefore, 0), STREAK_CAP);
  return 1 + (streakBonusPct / 100) * capped;
}

export function computeScore(p: ScoreInput): number {
  if (!p.correct) return 0;
  const base = Math.round(
    p.basePoints * speedFactor(p.responseTimeMs, p.timeLimitMs),
  );
  return Math.round(base * streakMultiplier(p.streakBefore, p.streakBonusPct));
}
