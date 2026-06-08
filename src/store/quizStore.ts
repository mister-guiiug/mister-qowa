/** Bibliothèque de quiz créés par l'utilisateur (local-first, localStorage). */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Quiz } from "@shared/contracts";

interface QuizLibrary {
  quizzes: Quiz[];
  upsert: (quiz: Quiz) => void;
  remove: (id: string) => void;
  get: (id: string) => Quiz | undefined;
}

export const useQuizLibrary = create<QuizLibrary>()(
  persist(
    (set, getState) => ({
      quizzes: [],
      upsert: (quiz) =>
        set((s) => {
          const exists = s.quizzes.some((q) => q.id === quiz.id);
          return {
            quizzes: exists
              ? s.quizzes.map((q) => (q.id === quiz.id ? quiz : q))
              : [...s.quizzes, quiz],
          };
        }),
      remove: (id) =>
        set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== id) })),
      get: (id) => getState().quizzes.find((q) => q.id === id),
    }),
    {
      name: "mister-qowa:quizzes",
      version: 1,
      migrate: (persisted) => persisted as QuizLibrary,
    },
  ),
);
