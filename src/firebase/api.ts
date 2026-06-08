/**
 * Accès backend typé. Les actions host passent par des Cloud Functions
 * autoritaires ; la soumission de réponse est une écriture RTDB directe
 * shardée {choice, serverTs} (D2/D3) — chemin chaud, faible latence.
 */
import { httpsCallable } from "firebase/functions";
import { ref, set, serverTimestamp } from "firebase/database";
import { getFns, getDb, ensureAuth } from "./app";
import { answerPath } from "@shared/paths";
import type { CreateSessionResult, JoinSessionResult } from "@shared/contracts";

async function call<TIn extends object, TOut>(
  name: string,
  data: TIn,
): Promise<TOut> {
  await ensureAuth();
  const fn = httpsCallable<TIn, TOut>(getFns(), name);
  const res = await fn(data);
  return res.data;
}

export const createSession = (quizId: string) =>
  call<{ quizId: string }, CreateSessionResult>("createSession", { quizId });

export const joinSession = (pin: string, pseudo: string) =>
  call<{ pin: string; pseudo: string }, JoinSessionResult>("joinSession", {
    pin,
    pseudo,
  });

export const nextQuestion = (sessionId: string) =>
  call<{ sessionId: string }, { ok: boolean }>("nextQuestion", { sessionId });

export const closeQuestion = (sessionId: string) =>
  call<{ sessionId: string }, { ok: boolean }>("closeQuestion", { sessionId });

export const endGame = (sessionId: string) =>
  call<{ sessionId: string }, { ok: boolean }>("endGame", { sessionId });

/** Soumission de réponse — écriture RTDB directe (D2). serverTs résolu par le serveur. */
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
