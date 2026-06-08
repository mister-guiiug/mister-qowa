/**
 * Contrats zod — FRONTIÈRE DE CONFIANCE UNIQUE (D9).
 * Importés à l'identique par le frontend ET les Cloud Functions. Aucune
 * redéfinition locale ailleurs. Littéraux de type figés.
 */
import { z } from "zod";
import {
  GAME_STATES,
  QUESTION_TYPES,
  PIN_LENGTH,
  MAX_PSEUDO_LEN,
} from "./gameState";

/* ---------- primitives ---------- */

export const pseudoSchema = z.string().trim().min(1).max(MAX_PSEUDO_LEN);

export const optionSchema = z.object({
  id: z.string().min(1).max(8),
  label: z.string().min(1).max(120),
});
export type QuizOption = z.infer<typeof optionSchema>;

/* ---------- questions (union discriminée par `type`) ---------- */

const baseQuestion = {
  id: z.string().min(1),
  prompt: z.string().min(1).max(300),
  mediaUrl: z.string().url().optional(),
  timeLimitMs: z.number().int().positive(),
};

export const questionSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseQuestion,
    type: z.literal("multiple_choice"),
    basePoints: z.number().int().nonnegative(),
    options: z.array(optionSchema).min(2).max(4),
    correctOptionId: z.string().min(1),
  }),
  z.object({
    ...baseQuestion,
    type: z.literal("true_false"),
    basePoints: z.number().int().nonnegative(),
    correct: z.boolean(),
  }),
  z.object({
    ...baseQuestion,
    type: z.literal("free_text"),
    basePoints: z.number().int().nonnegative(),
    acceptedAnswers: z.array(z.string().min(1)).min(1),
    caseSensitive: z.boolean().default(false),
  }),
  z.object({
    ...baseQuestion,
    type: z.literal("poll"),
    options: z.array(optionSchema).min(2).max(4),
  }),
]);
export type Question = z.infer<typeof questionSchema>;

export const quizSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(300).optional(),
  ownerUid: z.string().optional(),
  createdAt: z.number().int().optional(),
  questions: z.array(questionSchema).min(1).max(100),
});
export type Quiz = z.infer<typeof quizSchema>;

/* ---------- état live RTDB (formes publiques, sans la correction) ---------- */

export const gameStateSchema = z.enum(GAME_STATES);
export const questionTypeSchema = z.enum(QUESTION_TYPES);

/** Question telle qu'envoyée aux clients : SANS la bonne réponse (anti-triche). */
export const publicQuestionSchema = z.object({
  questionId: z.string(),
  index: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  type: questionTypeSchema,
  prompt: z.string(),
  mediaUrl: z.string().optional(),
  options: z.array(optionSchema).optional(),
  activatedAt: z.number().int(),
  endsAt: z.number().int(),
  scored: z.boolean(),
});
export type PublicQuestion = z.infer<typeof publicQuestionSchema>;

export const playerSchema = z.object({
  pseudo: pseudoSchema,
  joinedAt: z.number().int(),
  lastSeen: z.number().int().optional(),
  teamId: z.string().optional(),
});
export type Player = z.infer<typeof playerSchema>;

export const scoreSchema = z.object({
  total: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
});
export type Score = z.infer<typeof scoreSchema>;

export const leaderboardEntrySchema = z.object({
  uid: z.string(),
  pseudo: z.string(),
  total: z.number().int().nonnegative(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

/** Nœud réponse écrit par le CLIENT (D3) : uniquement {choice, serverTs}. */
export const answerNodeSchema = z.object({
  choice: z.string().min(1).max(200),
  serverTs: z.number().int(),
});
export type AnswerNode = z.infer<typeof answerNodeSchema>;

/** Reveal par joueur, écrit par la Function au REVEAL (D5). */
export const playerRevealSchema = z.object({
  correct: z.boolean(),
  awarded: z.number().int().nonnegative(),
  responseTimeMs: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type PlayerReveal = z.infer<typeof playerRevealSchema>;

/* ---------- contrats des Cloud Functions callable (D4) ---------- */

export const createSessionInput = z.object({ quizId: z.string().min(1) });
export const createSessionResult = z.object({
  sessionId: z.string(),
  pin: z.string().length(PIN_LENGTH),
});

export const joinSessionInput = z.object({
  pin: z.string().length(PIN_LENGTH),
  pseudo: pseudoSchema,
});
export const joinSessionResult = z.object({ sessionId: z.string() });

/** nextQuestion / closeQuestion / endGame partagent cet input (host). */
export const sessionActionInput = z.object({ sessionId: z.string().min(1) });

/** Soumission de réponse — chemin de secours callable (D2 : défaut = écriture RTDB directe). */
export const submitAnswerInput = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  choice: z.string().min(1).max(200),
});

export const okResult = z.object({ ok: z.boolean() });

export type CreateSessionInput = z.infer<typeof createSessionInput>;
export type CreateSessionResult = z.infer<typeof createSessionResult>;
export type JoinSessionInput = z.infer<typeof joinSessionInput>;
export type JoinSessionResult = z.infer<typeof joinSessionResult>;
export type SessionActionInput = z.infer<typeof sessionActionInput>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerInput>;
