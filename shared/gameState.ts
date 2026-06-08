/**
 * Constantes & machine à états partagées (frontend + Cloud Functions).
 * Source unique — voir docs/00-decisions-consolidees.md (D1, D4, D7).
 */

export const GAME_STATES = [
  "LOBBY",
  "QUESTION_COUNTDOWN",
  "QUESTION_ACTIVE",
  "QUESTION_REVEAL",
  "LEADERBOARD",
  "PODIUM",
  "ENDED",
] as const;
export type GameState = (typeof GAME_STATES)[number];

export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "free_text",
  "poll",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Types réellement jouables au MVP (les autres sont V1). */
export const MVP_QUESTION_TYPES: readonly QuestionType[] = [
  "multiple_choice",
  "true_false",
];

export const PIN_LENGTH = 8; // D7 : 10^8, densité de collision faible à l'échelle
export const ANSWER_SHARDS = 20; // D4 : fan-in shardé
export const COUNTDOWN_MS = 4000;
export const DEFAULT_TIME_LIMIT_MS = 20_000;
export const DEFAULT_BASE_POINTS = 1000;
export const STREAK_BONUS_PCT = 10;
export const LEADERBOARD_TOP = 50; // D6/D12 : leaderboard tronqué
export const MAX_PLAYERS = 1000;
export const MAX_PSEUDO_LEN = 20;

/** Hash déterministe uid -> shard (identique client & serveur, D4). */
export function shardOf(uid: string, shards: number = ANSWER_SHARDS): number {
  let h = 0;
  for (let i = 0; i < uid.length; i += 1) {
    h = (h * 31 + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % shards;
}
