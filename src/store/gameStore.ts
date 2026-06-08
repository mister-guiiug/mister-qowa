/** Identité de session locale (persistée pour survivre à un refresh). */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "host" | "player";

interface SessionState {
  role: Role | null;
  sessionId: string | null;
  pin: string | null;
  pseudo: string | null;
  quizId: string | null;
  setHost: (p: { sessionId: string; pin: string; quizId: string }) => void;
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
      setHost: ({ sessionId, pin, quizId }) =>
        set({ role: "host", sessionId, pin, quizId }),
      setPlayer: ({ sessionId, pin, pseudo }) =>
        set({ role: "player", sessionId, pin, pseudo }),
      reset: () =>
        set({
          role: null,
          sessionId: null,
          pin: null,
          pseudo: null,
          quizId: null,
        }),
    }),
    { name: "mister-qowa:session" },
  ),
);
