/**
 * Chemins canoniques RTDB (D1) — clé = `sessionId` STABLE, jamais le PIN.
 * Le PIN n'est qu'un alias de jointure : `pins/{pin} -> sessionId`.
 */
import { shardOf } from "./gameState";

export const pinIndexPath = (pin: string) => `pins/${pin}`;

export const sessionPath = (sid: string) => `sessions/${sid}`;
export const metaPath = (sid: string) => `sessions/${sid}/meta`;
export const statePath = (sid: string) => `sessions/${sid}/state`;
export const currentPath = (sid: string) => `sessions/${sid}/current`;

export const playersPath = (sid: string) => `sessions/${sid}/players`;
export const playerPath = (sid: string, uid: string) =>
  `sessions/${sid}/players/${uid}`;
export const playerLastSeenPath = (sid: string, uid: string) =>
  `sessions/${sid}/players/${uid}/lastSeen`;

/** Réponses SHARDÉES (D4) : answers/{questionId}/{shardId}/{uid}. */
export const answersQuestionPath = (sid: string, qid: string) =>
  `sessions/${sid}/answers/${qid}`;
export const answerShardPath = (sid: string, qid: string, shard: number) =>
  `sessions/${sid}/answers/${qid}/${shard}`;
export const answerPath = (sid: string, qid: string, uid: string) =>
  `sessions/${sid}/answers/${qid}/${shardOf(uid)}/${uid}`;

export const scoresPath = (sid: string) => `sessions/${sid}/scores`;
export const scorePath = (sid: string, uid: string) =>
  `sessions/${sid}/scores/${uid}`;

export const leaderboardPath = (sid: string) =>
  `sessions/${sid}/leaderboard/top`;

/** Reveal écrit par la Function au REVEAL (jamais dans /answers, D3/D5). */
export const revealPath = (sid: string, qid: string) =>
  `sessions/${sid}/reveal/${qid}`;
export const playerRevealPath = (sid: string, qid: string, uid: string) =>
  `sessions/${sid}/reveal/${qid}/${uid}`;
