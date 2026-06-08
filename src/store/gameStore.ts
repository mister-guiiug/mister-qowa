/** Identité de session locale (persistée pour survivre à un refresh). */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Quiz } from "@shared/contracts";

export type Role = "host" | "player";

interface SessionState {
  role: Role | null;
  sessionId: string | null;
  pin: string | null;
  pseudo: string | null;
  quizId: string | null;
  /** Quiz complet (avec réponses) — détenu UNIQUEMENT par le host, jamais publié. */
  hostQuiz: Quiz | null;
  setHost: (p: { sessionId: string; pin: string; quiz: Quiz }) => void;
  setPlayer: (p: { sessionId: string; pin: string; pseudo: string }) => void;
  reset: () => void;
}

export const useGameStore = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      sessionId: null,
      pin: null,
      pseudo: null,
      quizId: null,
      hostQuiz: null,
      setHost: ({ sessionId, pin, quiz }) =>
        set({ role: "host", sessionId, pin, quizId: quiz.id, hostQuiz: quiz }),
      setPlayer: ({ sessionId, pin, pseudo }) =>
        set({ role: "player", sessionId, pin, pseudo }),
      reset: () =>
        set({
          role: null,
          sessionId: null,
          pin: null,
          pseudo: null,
          quizId: null,
          hostQuiz: null,
        }),
    }),
    { name: "mister-qowa:session" },
  ),
);
